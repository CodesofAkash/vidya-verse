// app/api/questions/[id]/answers/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

type Params = { params: { id: string } };

const answerSchema = z.object({
  body: z.string().min(10, 'Answer must be at least 10 characters').max(10000),
});

// POST /api/questions/[id]/answers — post an answer
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id: questionId } = params;
    const body = await request.json();
    const { body: answerBody } = answerSchema.parse(body);

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, authorId: true, title: true },
    });
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    const [answer] = await prisma.$transaction([
      prisma.answer.create({
        data: { questionId, authorId: user.userId, body: answerBody },
        include: {
          author: { select: { id: true, name: true, profilePicture: true, roles: true } },
        },
      }),
      prisma.question.update({
        where: { id: questionId },
        data: { answerCount: { increment: 1 } },
      }),
    ]);

    // Notify question author (not self)
    if (question.authorId !== user.userId) {
      const answerer = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          recipientId: question.authorId,
          senderId: user.userId,
          type: 'NEW_ANSWER',
          title: 'New Answer on Your Question',
          body: `${answerer?.name || 'Someone'} answered your question: "${question.title}"`,
          linkUrl: `/vidya-sang/questions/${questionId}`,
          metadata: { questionId, answerId: answer.id },
        },
      });
    }

    return NextResponse.json({ success: true, data: { answer } }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    console.error('Answer POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to post answer' }, { status: 500 });
  }
}