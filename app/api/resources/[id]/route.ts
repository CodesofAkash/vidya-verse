export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { optionalAuth, requireAuth, isAdmin, getErrorStatus } from '@/lib/auth-middleware';

type Params = { params: { id: string } };

// GET /api/resources/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        ratings: {
          select: {
            rating: true,
            reviewText: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: 'Resource not found' },
        { status: 404 }
      );
    }

    // Increment view count (fire-and-forget)
    prisma.resource
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    // If caller is logged in, check if they've bookmarked it
    const caller = await optionalAuth();
    let isBookmarked = false;
    if (caller) {
      const bm = await prisma.bookmark.findUnique({
        where: { userId_resourceId: { userId: caller.userId, resourceId: id } },
      });
      isBookmarked = !!bm;
    }

    return NextResponse.json({
      success: true,
      data: { resource, isBookmarked },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { uploadedById: true, title: true },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: 'Resource not found' },
        { status: 404 }
      );
    }

    const canDelete = resource.uploadedById === user.userId || isAdmin(user);
    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to delete this resource' },
        { status: 403 }
      );
    }

    // Delete all related records first (FK constraints)
    await prisma.$transaction([
      prisma.bookmark.deleteMany({ where: { resourceId: id } }),
      prisma.resourceRating.deleteMany({ where: { resourceId: id } }),
      prisma.downloadHistory.deleteMany({ where: { resourceId: id } }),
      prisma.moderationLog.updateMany({
        where: { resourceId: id },
        data: { resourceId: null },
      }),
      prisma.resource.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `"${resource.title}" has been deleted`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete resource' },
      { status: getErrorStatus(error) }
    );
  }
}