// app/api/role-requests/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const REQUESTABLE_ROLES = ['CONTRIBUTOR', 'MENTOR', 'ADMIN'] as const;

const submitSchema = z.object({
  requestedRole: z.enum(REQUESTABLE_ROLES),
  reason: z.string().min(50, 'Please explain in at least 50 characters').max(1000),
});

// POST /api/role-requests — submit a new role request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { requestedRole, reason } = submitSchema.parse(body);

    // OWNER role cannot be requested
    if (requestedRole === 'OWNER' as any) {
      return NextResponse.json({ success: false, message: 'OWNER role cannot be requested' }, { status: 400 });
    }

    // Check user already has this role
    if (user.roles.includes(requestedRole)) {
      return NextResponse.json({ success: false, message: 'You already have this role' }, { status: 400 });
    }

    // Block if a pending request exists for this role
    const existing = await prisma.roleRequest.findFirst({
      where: { userId: user.userId, requestedRole, status: 'PENDING' },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: 'You already have a pending request for this role' }, { status: 409 });
    }

    const roleRequest = await prisma.roleRequest.create({
      data: { userId: user.userId, requestedRole, reason },
    });

    // Notify all admins + owners
    const admins = await prisma.user.findMany({
      where: { roles: { hasSome: ['ADMIN', 'OWNER'] }, isActive: true },
      select: { id: true, email: true, name: true },
    });

    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/role-requests`;
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });

    // Create in-app notifications for admins
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        recipientId: admin.id,
        senderId: user.userId,
        type: 'ROLE_REQUEST_SUBMITTED' as any,
        title: 'New Role Request',
        body: `${dbUser?.name || user.email} has requested the ${requestedRole} role.`,
        linkUrl: reviewUrl,
        metadata: { roleRequestId: roleRequest.id },
      })),
    });

    // Send emails to admins (fire-and-forget)
    for (const admin of admins) {
      sendEmail.roleRequestSubmitted(
        dbUser?.name || user.email,
        requestedRole,
        reason,
        reviewUrl,
        admin.email,
      ).catch(console.error);
    }

    return NextResponse.json({ success: true, data: { roleRequest } }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, message: error.errors[0]?.message || 'Validation error' }, { status: 400 });
    }
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    console.error('Role request POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit request' }, { status: 500 });
  }
}

// GET /api/role-requests — get own role requests
export async function GET() {
  try {
    const user = await requireAuth();
    const requests = await prisma.roleRequest.findMany({
      where: { userId: user.userId },
      orderBy: { requestedAt: 'desc' },
      include: {
        reviewedBy: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json({ success: true, data: { requests } });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to fetch requests' }, { status: 500 });
  }
}