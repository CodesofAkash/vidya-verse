// app/api/questions/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, optionalAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  body: z.string().min(20, 'Please describe your question in more detail').max(10000),
  subject: z.string().min(2).max(100),
  semester: z.number().min(1).max(8).optional(),
  department: z.enum(['COMPUTER','PHYSICS','CHEMISTRY','MATHEMATICS','ELECTRONICS','BOTANY','ZOOLOGY','BIOLOGY','ENGLISH']).optional(),
  tags: z.array(z.string().max(30)).max(5).default([]),
});

// GET /api/questions?subject=&department=&semester=&search=&page=1&sort=newest
export async function GET(request: NextRequest) {
  try {
    const user = await optionalAuth();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const department = searchParams.get('department');
    const semester = searchParams.get('semester');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    const where: any = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (department) where.department = department;
    if (semester) where.semester = parseInt(semester);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any =
      sort === 'popular' ? { viewCount: 'desc' }
      : sort === 'unanswered' ? { answerCount: 'asc' }
      : { createdAt: 'desc' };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, name: true, profilePicture: true, roles: true } },
          _count: { select: { answers: true } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { questions, total, page, limit, hasMore: page * limit < total },
    });
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/questions
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = createSchema.parse(body);

    const question = await prisma.question.create({
      data: { ...data, authorId: user.userId },
      include: {
        author: { select: { id: true, name: true, profilePicture: true, roles: true } },
      },
    });

    return NextResponse.json({ success: true, data: { question } }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    console.error('Questions POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create question' }, { status: 500 });
  }
}