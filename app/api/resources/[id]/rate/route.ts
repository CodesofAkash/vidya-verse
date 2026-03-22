export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';
import { z } from 'zod';

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(500).optional(),
});

type Params = { params: { id: string } };

// POST /api/resources/[id]/rate  — upsert rating + recalc averageRating
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { id: true, uploadedById: true },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: 'Resource not found' },
        { status: 404 }
      );
    }

    // Prevent self-rating
    if (resource.uploadedById === user.userId) {
      return NextResponse.json(
        { success: false, message: 'You cannot rate your own resource' },
        { status: 400 }
      );
    }

    // Must have downloaded it first
    const downloaded = await prisma.downloadHistory.findFirst({
      where: { userId: user.userId, resourceId: id },
    });
    if (!downloaded) {
      return NextResponse.json(
        { success: false, message: 'You must download a resource before rating it' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, reviewText } = rateSchema.parse(body);

    // Upsert rating
    await prisma.resourceRating.upsert({
      where: { resourceId_userId: { resourceId: id, userId: user.userId } },
      create: { resourceId: id, userId: user.userId, rating, reviewText },
      update: { rating, reviewText },
    });

    // Recalculate average
    const agg = await prisma.resourceRating.aggregate({
      where: { resourceId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.resource.update({
      where: { id },
      data: {
        averageRating: agg._avg.rating,
        totalRatings:  agg._count.rating,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rating saved',
      data: {
        averageRating: agg._avg.rating,
        totalRatings:  agg._count.rating,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Rating failed' },
      { status: getErrorStatus(error) }
    );
  }
}

// DELETE /api/resources/[id]/rate  — remove own rating
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const existing = await prisma.resourceRating.findUnique({
      where: { resourceId_userId: { resourceId: id, userId: user.userId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'No rating found to delete' },
        { status: 404 }
      );
    }

    await prisma.resourceRating.delete({
      where: { resourceId_userId: { resourceId: id, userId: user.userId } },
    });

    // Recalculate average
    const agg = await prisma.resourceRating.aggregate({
      where: { resourceId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.resource.update({
      where: { id },
      data: {
        averageRating: agg._count.rating > 0 ? agg._avg.rating : null,
        totalRatings:  agg._count.rating,
      },
    });

    return NextResponse.json({ success: true, message: 'Rating removed' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to remove rating' },
      { status: getErrorStatus(error) }
    );
  }
}