// ============================================================
// app/api/auth/forgot-password/route.ts
// POST /api/auth/forgot-password
// ============================================================
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());

    // Always return the same message to prevent email enumeration
    const genericResponse = NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) return genericResponse;

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store in the emailVerificationToken field (reuse for password reset)
    // In production you'd add a dedicated passwordResetToken field to the schema
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: `reset_${token}`,
        emailVerificationExpiry: expiry,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await sendEmail.passwordReset(user.name || 'Student', resetUrl, email);

    return genericResponse;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}