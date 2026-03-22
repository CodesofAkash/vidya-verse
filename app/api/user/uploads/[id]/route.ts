// ============================================================
// app/api/user/uploads/[id]/route.ts
// DELETE /api/user/uploads/[id]  — retract a PENDING upload
// ============================================================
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';

type Params = { params: { id: string } };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const upload = await prisma.pendingUpload.findUnique({
      where: { id },
      select: { uploadedById: true, status: true, canEdit: true },
    });

    if (!upload) {
      return NextResponse.json(
        { success: false, message: 'Upload not found' },
        { status: 404 }
      );
    }

    if (upload.uploadedById !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Can only retract if still PENDING and canEdit is true
    if (upload.status !== 'PENDING' || !upload.canEdit) {
      return NextResponse.json(
        {
          success: false,
          message:
            upload.status === 'UNDER_REVIEW'
              ? 'Cannot retract — upload is currently under review'
              : 'This upload can no longer be retracted',
        },
        { status: 400 }
      );
    }

    await prisma.pendingUpload.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Upload retracted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retract upload' },
      { status: getErrorStatus(error) }
    );
  }
}