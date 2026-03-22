export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';

// GET /api/bookmarks
export async function GET() {
  try {
    const user = await requireAuth();

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        createdAt: true,
        resource: {
          select: {
            id: true,
            title: true,
            description: true,
            subject: true,
            semester: true,
            department: true,
            resourceType: true,
            chapterTopic: true,
            fileSize: true,
            downloadCount: true,
            averageRating: true,
            totalRatings: true,
            isPremium: true,
            createdAt: true,
            uploadedBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: { bookmarks } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch bookmarks' },
      { status: getErrorStatus(error) }
    );
  }
}

// POST /api/bookmarks
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { success: false, message: 'resourceId is required' },
        { status: 400 }
      );
    }

    // Verify resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true },
    });
    if (!resource) {
      return NextResponse.json(
        { success: false, message: 'Resource not found' },
        { status: 404 }
      );
    }

    // Upsert to avoid duplicate error
    const bookmark = await prisma.bookmark.upsert({
      where: { userId_resourceId: { userId: user.userId, resourceId } },
      create: { userId: user.userId, resourceId },
      update: {},
    });

    return NextResponse.json(
      { success: true, message: 'Bookmarked', data: { bookmark } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add bookmark' },
      { status: getErrorStatus(error) }
    );
  }
}

// DELETE /api/bookmarks?resourceId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json(
        { success: false, message: 'resourceId query param is required' },
        { status: 400 }
      );
    }

    await prisma.bookmark.deleteMany({
      where: { userId: user.userId, resourceId },
    });

    return NextResponse.json({ success: true, message: 'Bookmark removed' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to remove bookmark' },
      { status: getErrorStatus(error) }
    );
  }
}