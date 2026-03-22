export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  semester: z.number().int().min(1).max(8).nullable().optional(),
  department: z.string().nullable().optional(),
  collegeId: z.string().nullable().optional(),
  profilePicture: z.string().url().nullable().optional(),
});

const profileSelect = {
  id: true,
  email: true,
  name: true,
  bio: true,
  semester: true,
  department: true,
  profilePicture: true,
  roles: true,
  emailVerified: true,
  isActive: true,
  canUpload: true,
  warningCount: true,
  collegeId: true,
  createdAt: true,
  college: {
    select: { id: true, name: true, city: true, state: true },
  },
} as const;

// GET /api/user/profile
export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: profileSelect,
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { profile } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch profile' },
      { status: getErrorStatus(error) }
    );
  }
}

// PATCH /api/user/profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Strip undefined keys so Prisma only updates what was sent
    const data: Record<string, any> = {};
    if (validated.name !== undefined)           data.name           = validated.name;
    if (validated.bio !== undefined)            data.bio            = validated.bio;
    if (validated.semester !== undefined)       data.semester       = validated.semester;
    if (validated.department !== undefined)     data.department     = validated.department as any;
    if (validated.collegeId !== undefined)      data.collegeId      = validated.collegeId;
    if (validated.profilePicture !== undefined) data.profilePicture = validated.profilePicture;

    const updatedProfile = await prisma.user.update({
      where: { id: user.userId },
      data,
      select: profileSelect,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile: updatedProfile },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: getErrorStatus(error) }
    );
  }
}