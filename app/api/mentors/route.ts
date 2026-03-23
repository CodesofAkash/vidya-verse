// app/api/mentors/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, optionalAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

const createProfileSchema = z.object({
  headline: z.string().min(5).max(150),
  bio: z.string().min(20).max(2000),
  expertise: z.array(z.string().max(50)).min(1).max(10),
  department: z.enum(['COMPUTER','PHYSICS','CHEMISTRY','MATHEMATICS','ELECTRONICS','BOTANY','ZOOLOGY','BIOLOGY','ENGLISH']),
  semester: z.number().min(1).max(8).optional(),
  availability: z.array(z.enum(['WEEKDAY_MORNINGS','WEEKDAY_EVENINGS','WEEKENDS','FLEXIBLE'])).min(1),
  hourlyRate: z.number().min(0).optional().nullable(),
});

// GET /api/mentors?department=&search=&availability=&page=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const availability = searchParams.get('availability');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const freeOnly = searchParams.get('freeOnly') === 'true';

    const where: any = { isActive: true };
    if (department) where.department = department;
    if (availability) where.availability = { has: availability };
    if (freeOnly) where.hourlyRate = null;
    if (search) {
      where.OR = [
        { headline: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [mentors, total] = await Promise.all([
      prisma.mentorProfile.findMany({
        where,
        orderBy: [{ averageRating: 'desc' }, { totalSessions: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, profilePicture: true, roles: true } },
        },
      }),
      prisma.mentorProfile.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { mentors, total, page, limit } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch mentors' }, { status: 500 });
  }
}

// POST /api/mentors — create or update own mentor profile
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user.roles.includes('MENTOR')) {
      return NextResponse.json({ success: false, message: 'You need the MENTOR role. Request it from your dashboard.' }, { status: 403 });
    }
    const body = await request.json();
    const data = createProfileSchema.parse(body);
    const profile = await prisma.mentorProfile.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId, ...data },
      update: { ...data, isActive: true },
      include: { user: { select: { id: true, name: true, profilePicture: true } } },
    });
    return NextResponse.json({ success: true, data: { profile } }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to create profile' }, { status: 500 });
  }
}