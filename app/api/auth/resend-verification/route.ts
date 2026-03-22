// ============================================================
// app/api/auth/resend-verification/route.ts
// POST /api/auth/resend-verification
// ============================================================
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getErrorStatus } from '@/lib/auth-middleware';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST() {
  try {
    const authUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerificationExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Rate-limit: don't allow re-send if token was issued less than 5 minutes ago
    if (
      user.emailVerificationExpiry &&
      user.emailVerificationExpiry.getTime() - Date.now() > 23.5 * 60 * 60 * 1000
    ) {
      return NextResponse.json(
        { success: false, message: 'Please wait a few minutes before requesting another email' },
        { status: 429 }
      );
    }

    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationExpiry: expiry },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    await sendEmail.welcome(user.name || 'Student', verifyUrl, user.email);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Check your inbox.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to resend verification' },
      { status: getErrorStatus(error) }
    );
  }
}