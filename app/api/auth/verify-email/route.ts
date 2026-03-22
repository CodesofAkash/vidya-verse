import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// Supports both GET (token in query string, e.g. from email link) and
// POST (token in JSON body, e.g. from client-side fetch)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  return verifyToken(token);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token ?? null;
    return verifyToken(token);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}

async function verifyToken(token: string | null) {
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Verification token is required' },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification token' },
        { status: 400 }
      );
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Verification token has expired' },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email already verified' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    // Send confirmation email
    try {
      await sendEmail.emailVerified(updatedUser.name || 'Student', updatedUser.email);
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Email verification failed' },
      { status: 500 }
    );
  }
}