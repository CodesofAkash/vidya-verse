// ============================================================
// app/api/auth/reset-password/route.ts
// POST /api/auth/reset-password
// ============================================================
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const { token, password } = schema.parse(await request.json());

    // Look up user by prefixed token
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: `reset_${token}` },
      select: {
        id: true,
        emailVerificationExpiry: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Prevent re-using current password
    const isSame = await bcrypt.compare(password, user.passwordHash);
    if (isSame) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from your current password' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerificationToken:  null,
        emailVerificationExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}