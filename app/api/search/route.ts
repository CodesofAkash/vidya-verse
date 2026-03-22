export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/search?q=...&type=NOTES&semester=3&department=COMPUTER&sortBy=downloads&page=1&limit=12
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q          = searchParams.get('q')?.trim() || '';
    const type       = searchParams.get('type');
    const semester   = searchParams.get('semester');
    const department = searchParams.get('department');
    const sortBy     = searchParams.get('sortBy') || 'recent';
    const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit      = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip       = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (q) {
      where.OR = [
        { title:       { contains: q, mode: 'insensitive' } },
        { subject:     { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { chapterTopic:{ contains: q, mode: 'insensitive' } },
      ];
    }

    if (type && type !== 'ALL')             where.resourceType = type;
    if (semester && semester !== 'ALL')     where.semester = parseInt(semester);
    if (department && department !== 'ALL') where.department = department;

    // Build orderBy
    const orderByMap: Record<string, any> = {
      recent:    { createdAt: 'desc' },
      downloads: { downloadCount: 'desc' },
      rating:    { averageRating: 'desc' },
      title:     { title: 'asc' },
    };
    const orderBy = orderByMap[sortBy] ?? { createdAt: 'desc' };

    const [results, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        select: {
          id:            true,
          title:         true,
          description:   true,
          subject:       true,
          semester:      true,
          department:    true,
          resourceType:  true,
          chapterTopic:  true,
          fileSize:      true,
          downloadCount: true,
          viewCount:     true,
          averageRating: true,
          totalRatings:  true,
          isPremium:     true,
          thumbnailUrl:  true,
          createdAt:     true,
          uploadedBy:    { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        results,
        query: q,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        appliedFilters: { type, semester, department, sortBy },
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: 'Search failed' },
      { status: 500 }
    );
  }
}