// app/api/answers/[answerId]/vote/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

type Params = { params: { answerId: string } };

const voteSchema = z.object({ type: z.enum(['UP', 'DOWN']) });

// POST /api/answers/[answerId]/vote
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { answerId } = params;
    const body = await request.json();
    const { type } = voteSchema.parse(body);

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { id: true, authorId: true, upvotes: true, downvotes: true },
    });
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    if (answer.authorId === user.userId) {
      return NextResponse.json({ success: false, message: 'You cannot vote on your own answer' }, { status: 400 });
    }

    const existing = await prisma.vote.findUnique({
      where: { userId_answerId: { userId: user.userId, answerId } },
    });

    let newUpvotes = answer.upvotes;
    let newDownvotes = answer.downvotes;

    if (existing) {
      if (existing.type === type) {
        // Toggle off (remove vote)
        await prisma.vote.delete({ where: { userId_answerId: { userId: user.userId, answerId } } });
        if (type === 'UP') newUpvotes--;
        else newDownvotes--;
      } else {
        // Switch vote direction
        await prisma.vote.update({
          where: { userId_answerId: { userId: user.userId, answerId } },
          data: { type },
        });
        if (type === 'UP') { newUpvotes++; newDownvotes--; }
        else { newDownvotes++; newUpvotes--; }
      }
    } else {
      await prisma.vote.create({ data: { userId: user.userId, answerId, type } });
      if (type === 'UP') newUpvotes++;
      else newDownvotes++;
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { upvotes: Math.max(0, newUpvotes), downvotes: Math.max(0, newDownvotes) },
    });

    const userVote = existing?.type === type ? null : type;
    return NextResponse.json({ success: true, data: { upvotes: updatedAnswer.upvotes, downvotes: updatedAnswer.downvotes, userVote } });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to vote' }, { status: 500 });
  }
}

// ── Accept answer ─────────────────────────────────────────────────────────────
// PATCH /api/answers/[answerId]/accept — question author marks best answer
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { answerId } = params;

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: { question: { select: { id: true, authorId: true } } },
    });
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    if (answer.question.authorId !== user.userId) {
      return NextResponse.json({ success: false, message: 'Only the question author can accept an answer' }, { status: 403 });
    }

    await prisma.$transaction([
      // Un-accept all previous accepted answers for this question
      prisma.answer.updateMany({ where: { questionId: answer.questionId, isAccepted: true }, data: { isAccepted: false } }),
      // Accept this answer
      prisma.answer.update({ where: { id: answerId }, data: { isAccepted: true } }),
      // Mark question resolved
      prisma.question.update({ where: { id: answer.questionId }, data: { isResolved: true } }),
    ]);

    // Notify answer author
    if (answer.authorId !== user.userId) {
      await prisma.notification.create({
        data: {
          recipientId: answer.authorId,
          senderId: user.userId,
          type: 'ANSWER_ACCEPTED',
          title: 'Your Answer Was Accepted! ✅',
          body: 'Your answer has been marked as the best answer.',
          linkUrl: `/vidya-sang/questions/${answer.questionId}`,
          metadata: { answerId },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to accept answer' }, { status: 500 });
  }
}