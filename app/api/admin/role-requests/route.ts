// app/api/admin/role-requests/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-middleware';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

// GET /api/admin/role-requests?status=PENDING
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [requests, total] = await Promise.all([
      prisma.roleRequest.findMany({
        where: { status: status as any },
        orderBy: { requestedAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, roles: true, profilePicture: true, createdAt: true } },
          reviewedBy: { select: { name: true, email: true } },
        },
      }),
      prisma.roleRequest.count({ where: { status: status as any } }),
    ]);

    return NextResponse.json({ success: true, data: { requests, total, page, limit } });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (error?.message === 'Forbidden') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, message: 'Failed to fetch requests' }, { status: 500 });
  }
}

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

// PATCH /api/admin/role-requests — approve or reject
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { requestId, decision, rejectionReason } = reviewSchema.parse(body);

    if (decision === 'REJECTED' && !rejectionReason?.trim()) {
      return NextResponse.json({ success: false, message: 'Rejection reason is required' }, { status: 400 });
    }

    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, name: true, email: true, roles: true } } },
    });

    if (!roleRequest) return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    if (roleRequest.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Request is no longer pending' }, { status: 409 });
    }

    // Prevent non-OWNER from approving ADMIN requests
    if (roleRequest.requestedRole === 'ADMIN' && !admin.roles.includes('OWNER')) {
      return NextResponse.json({ success: false, message: 'Only OWNER can approve ADMIN role requests' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Update role request
      await tx.roleRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          reviewedById: admin.userId,
          reviewedAt: new Date(),
          rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
        },
      });

      if (decision === 'APPROVED') {
        // Add role to user (avoid duplicates)
        const currentRoles = roleRequest.user.roles;
        if (!currentRoles.includes(roleRequest.requestedRole)) {
          await tx.user.update({
            where: { id: roleRequest.user.id },
            data: { roles: { push: roleRequest.requestedRole } },
          });
        }
      }

      // Create in-app notification for the requester
      await tx.notification.create({
        data: {
          recipientId: roleRequest.user.id,
          senderId: admin.userId,
          type: decision === 'APPROVED' ? 'ROLE_REQUEST_APPROVED' : 'ROLE_REQUEST_REJECTED',
          title: decision === 'APPROVED' ? `Role Approved: ${roleRequest.requestedRole}` : 'Role Request Update',
          body: decision === 'APPROVED'
            ? `Your request for ${roleRequest.requestedRole} role has been approved! 🎉`
            : `Your request for ${roleRequest.requestedRole} was not approved. Reason: ${rejectionReason}`,
          linkUrl: '/dashboard/role-request',
          metadata: { roleRequestId: requestId },
        },
      });
    });

    // Send email (fire-and-forget)
    if (decision === 'APPROVED') {
      sendEmail.roleRequestApproved(
        roleRequest.user.name || roleRequest.user.email,
        roleRequest.requestedRole,
        roleRequest.user.email,
      ).catch(console.error);
    } else {
      sendEmail.roleRequestRejected(
        roleRequest.user.name || roleRequest.user.email,
        roleRequest.requestedRole,
        rejectionReason!,
        roleRequest.user.email,
      ).catch(console.error);
    }

    return NextResponse.json({ success: true, message: `Request ${decision.toLowerCase()} successfully` });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    }
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (error?.message === 'Forbidden') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    console.error('Admin role request PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process request' }, { status: 500 });
  }
}