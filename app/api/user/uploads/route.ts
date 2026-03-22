// ============================================================
// app/api/user/uploads/route.ts
// GET  /api/user/uploads        — my pending + approved uploads
// DELETE /api/user/uploads/[id] — retract a PENDING upload
// ============================================================
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';

// GET /api/user/uploads
export async function GET() {
  try {
    const user = await requireAuth();

    const [pending, approved] = await Promise.all([
      prisma.pendingUpload.findMany({
        where: { uploadedById: user.userId },
        select: {
          id: true,
          title: true,
          subject: true,
          semester: true,
          department: true,
          resourceType: true,
          status: true,
          rejectionReason: true,
          appealCount: true,
          canEdit: true,
          createdAt: true,
          updatedAt: true,
          lastActivityAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.resource.findMany({
        where: { uploadedById: user.userId },
        select: {
          id: true,
          title: true,
          subject: true,
          semester: true,
          department: true,
          resourceType: true,
          downloadCount: true,
          averageRating: true,
          totalRatings: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { pending, approved },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch uploads' },
      { status: getErrorStatus(error) }
    );
  }
}