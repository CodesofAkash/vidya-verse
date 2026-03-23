// app/api/questions/[id]/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, optionalAuth } from '@/lib/auth-middleware';

type Params = { params: { id: string } };

// GET /api/questions/[id] — full question with answers
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await optionalAuth();
    const { id } = params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, profilePicture: true, roles: true } },
        answers: {
          orderBy: [{ isAccepted: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: { select: { id: true, name: true, profilePicture: true, roles: true } },
            votes: user ? { where: { userId: user.userId } } : false,
          },
        },
      },
    });

    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    // Increment view count (fire-and-forget)
    prisma.question.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    return NextResponse.json({ success: true, data: { question } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch question' }, { status: 500 });
  }
}

// DELETE /api/questions/[id] — author or admin only
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const isOwner = question.authorId === user.userId;
    const isAdmin = user.roles.some((r) => r === 'ADMIN' || r === 'OWNER');
    if (!isOwner && !isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to delete question' }, { status: 500 });
  }
}