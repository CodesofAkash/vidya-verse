export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';

export async function GET() {
  try {
    const user = await requireAuth();

    const [uploadCount, downloadCount, bookmarkCount, pendingCount] = await Promise.all([
      // Approved resources uploaded by this user
      prisma.resource.count({
        where: { uploadedById: user.userId },
      }),
      // Total downloads by this user
      prisma.downloadHistory.count({
        where: { userId: user.userId },
      }),
      // Saved bookmarks
      prisma.bookmark.count({
        where: { userId: user.userId },
      }),
      // Pending uploads still awaiting review
      prisma.pendingUpload.count({
        where: { uploadedById: user.userId, status: 'PENDING' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          uploads: uploadCount,
          downloads: downloadCount,
          bookmarks: bookmarkCount,
          questions: 0,        // placeholder until Q&A is built
          pendingUploads: pendingCount,
          streakDays: 0,       // placeholder until streak logic is built
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch stats' },
      { status: getErrorStatus(error) }
    );
  }
}