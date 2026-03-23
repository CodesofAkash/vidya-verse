// app/api/admin/moderation/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-middleware';
import { sendEmail } from '@/lib/email';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod';

const utApi = new UTApi();

// GET /api/admin/moderation?status=PENDING&page=1
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    const [uploads, total] = await Promise.all([
      prisma.pendingUpload.findMany({
        where: { status: status as any },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true, profilePicture: true } },
          assignedAdmin: { select: { name: true, email: true } },
        },
      }),
      prisma.pendingUpload.count({ where: { status: status as any } }),
    ]);

    return NextResponse.json({ success: true, data: { uploads, total, page, limit } });
  } catch (error: any) {
    if (error?.message === 'Forbidden') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to fetch moderation queue' }, { status: 500 });
  }
}

const decisionSchema = z.object({
  uploadId: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
  // If APPROVED: these come from the UploadThing upload that the admin triggered from the UI
  uploadthingUrl: z.string().url().optional(),
  uploadthingKey: z.string().optional(),
});

// PATCH /api/admin/moderation — approve or reject a pending upload
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { uploadId, decision, rejectionReason, uploadthingUrl, uploadthingKey } = decisionSchema.parse(body);

    if (decision === 'REJECTED' && !rejectionReason?.trim()) {
      return NextResponse.json({ success: false, message: 'Rejection reason required' }, { status: 400 });
    }
    if (decision === 'APPROVED' && (!uploadthingUrl || !uploadthingKey)) {
      return NextResponse.json({ success: false, message: 'UploadThing URL and key required for approval' }, { status: 400 });
    }

    const pending = await prisma.pendingUpload.findUnique({
      where: { id: uploadId },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });

    if (!pending) return NextResponse.json({ success: false, message: 'Upload not found' }, { status: 404 });
    if (pending.status === 'APPROVED') {
      return NextResponse.json({ success: false, message: 'Already approved' }, { status: 409 });
    }

    if (decision === 'APPROVED') {
      // Create the permanent resource and update pending upload in a transaction
      await prisma.$transaction(async (tx) => {
        const resource = await tx.resource.create({
          data: {
            title: pending.title,
            description: pending.description,
            subject: pending.subject,
            semester: pending.semester,
            department: pending.department,
            resourceType: pending.resourceType,
            chapterTopic: pending.chapterTopic,
            fileUrl: uploadthingUrl!,
            uploadthingKey: uploadthingKey,
            fileSize: pending.fileSize,
            fileHash: pending.fileHash,
            uploadedById: pending.uploadedById,
            approvedById: admin.userId,
            approvedAt: new Date(),
          },
        });

        await tx.pendingUpload.update({
          where: { id: uploadId },
          data: {
            status: 'APPROVED',
            uploadthingKey,
            canEdit: false,
            lastActivityAt: new Date(),
          },
        });

        await tx.moderationLog.create({
          data: {
            originalUploadId: uploadId,
            resourceId: resource.id,
            decision: 'APPROVED',
            decidedById: admin.userId,
            metadataSnapshot: { title: pending.title, department: pending.department, resourceType: pending.resourceType },
          },
        });

        // Notify uploader
        await tx.notification.create({
          data: {
            recipientId: pending.uploadedById,
            senderId: admin.userId,
            type: 'UPLOAD_APPROVED',
            title: 'Upload Approved! 🎉',
            body: `Your resource "${pending.title}" has been approved and is now live.`,
            linkUrl: `/vidya-vault`,
            metadata: { resourceId: resource.id },
          },
        });
      });

      const resourceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vidya-vault`;
      sendEmail.uploadApproved(
        pending.uploadedBy.name || pending.uploadedBy.email,
        pending.title,
        resourceUrl,
        pending.uploadedBy.email,
      ).catch(console.error);

    } else {
      // REJECTED — optionally delete the Vercel Blob file
      await prisma.$transaction(async (tx) => {
        await tx.pendingUpload.update({
          where: { id: uploadId },
          data: {
            status: 'REJECTED',
            rejectionReason,
            canEdit: true,
            lastActivityAt: new Date(),
          },
        });

        await tx.moderationLog.create({
          data: {
            originalUploadId: uploadId,
            decision: 'REJECTED',
            reason: rejectionReason,
            decidedById: admin.userId,
            metadataSnapshot: { title: pending.title },
          },
        });

        await tx.notification.create({
          data: {
            recipientId: pending.uploadedById,
            senderId: admin.userId,
            type: 'UPLOAD_REJECTED',
            title: 'Upload Not Approved',
            body: `Your resource "${pending.title}" was not approved. Reason: ${rejectionReason}`,
            linkUrl: '/dashboard/uploads',
            metadata: { pendingUploadId: uploadId },
          },
        });
      });

      sendEmail.uploadRejected(
        pending.uploadedBy.name || pending.uploadedBy.email,
        pending.title,
        rejectionReason!,
        pending.uploadedBy.email,
      ).catch(console.error);
    }

    return NextResponse.json({ success: true, message: `Upload ${decision.toLowerCase()} successfully` });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    if (error?.message === 'Forbidden') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    console.error('Moderation PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process decision' }, { status: 500 });
  }
}