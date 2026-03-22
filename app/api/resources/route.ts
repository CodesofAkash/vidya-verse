export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { optionalAuth, requireAuth, getErrorStatus } from '@/lib/auth-middleware';
import { z } from 'zod';
import crypto from 'crypto';

const createResourceSchema = z.object({
  title: z.string().min(5).max(200),
  // ResourceType enum: NOTES | PYQ | SYLLABUS (no ASSIGNMENT in schema)
  type: z.enum(['NOTES', 'PYQ', 'SYLLABUS']),
  subject: z.string().min(2).max(100),
  semester: z.number().int().min(1).max(8),
  department: z.enum([
    'COMPUTER', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS',
    'ELECTRONICS', 'BOTANY', 'ZOOLOGY', 'BIOLOGY', 'ENGLISH',
  ]),
  description: z.string().min(10).max(1000),
  chapterTopic: z.string().max(200).optional(),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive(),
});

// GET /api/resources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type       = searchParams.get('type');
    const semester   = searchParams.get('semester');
    const department = searchParams.get('department');
    const subject    = searchParams.get('subject');
    const search     = searchParams.get('search');
    const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit      = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip       = (page - 1) * limit;

    const where: any = {};

    if (type && type !== 'ALL') {
      where.resourceType = type;
    }
    if (semester && semester !== 'ALL') {
      where.semester = parseInt(semester);
    }
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (subject) {
      where.subject = { contains: subject, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { subject:     { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
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
          thumbnailUrl: true,
          downloadCount: true,
          viewCount: true,
          averageRating: true,
          totalRatings: true,
          isPremium: true,
          createdAt: true,
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    // Increment viewCount for resources returned (fire-and-forget)
    if (resources.length > 0) {
      prisma.resource
        .updateMany({
          where: { id: { in: resources.map((r) => r.id) } },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        resources,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Fetch resources error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources  — creates a PendingUpload (goes to admin queue)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check upload permissions
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { canUpload: true, emailVerified: true },
    });

    if (!dbUser?.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email before uploading' },
        { status: 403 }
      );
    }
    if (!dbUser?.canUpload) {
      return NextResponse.json(
        { success: false, message: 'Your upload permission has been revoked' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createResourceSchema.parse(body);

    // Generate a deterministic hash from URL so duplicates can be detected
    const fileHash = crypto
      .createHash('sha256')
      .update(validated.fileUrl)
      .digest('hex');

    // Check for duplicate (same file already pending or approved)
    const duplicate = await prisma.pendingUpload.findFirst({
      where: { fileHash },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: 'This file has already been submitted' },
        { status: 409 }
      );
    }

    const pendingUpload = await prisma.pendingUpload.create({
      data: {
        title:        validated.title,
        description:  validated.description,
        subject:      validated.subject,
        semester:     validated.semester,
        department:   validated.department,
        resourceType: validated.type,
        chapterTopic: validated.chapterTopic,
        blobUrl:      validated.fileUrl,
        fileSize:     validated.fileSize,
        fileHash,
        uploadedById: user.userId,
        status:       'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Resource submitted for admin review. You will be notified once approved.',
        data: { pendingUpload },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: getErrorStatus(error) }
    );
  }
}