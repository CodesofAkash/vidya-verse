export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';

const FREE_DAILY_LIMIT = 5;

type Params = { params: { id: string } };

// POST /api/resources/[id]/download
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        isPremium: true,
        downloadCount: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: 'Resource not found' },
        { status: 404 }
      );
    }

    // --- Daily download limit for free users ---
    // TODO: when subscriptions are added, check user.isPremium here
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.downloadHistory.count({
      where: {
        userId: user.userId,
        downloadedAt: { gte: todayStart },
      },
    });

    if (todayCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message: `You've reached your ${FREE_DAILY_LIMIT} free downloads for today. Upgrade to premium for unlimited access.`,
          code: 'DAILY_LIMIT_REACHED',
          data: { limit: FREE_DAILY_LIMIT, used: todayCount },
        },
        { status: 429 }
      );
    }

    // Record download + increment counter atomically
    await prisma.$transaction([
      prisma.downloadHistory.create({
        data: { userId: user.userId, resourceId: id },
      }),
      prisma.resource.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Download recorded',
      data: {
        fileUrl: resource.fileUrl,
        downloadsUsedToday: todayCount + 1,
        downloadsRemainingToday: FREE_DAILY_LIMIT - (todayCount + 1),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Download failed' },
      { status: getErrorStatus(error) }
    );
  }
}