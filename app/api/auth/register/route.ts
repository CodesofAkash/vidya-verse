import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  collegeId: z.string().optional(),
  semester: z.number().min(1).max(8).optional(),
  department: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
        collegeId: validated.collegeId,
        semester: validated.semester,
        department: validated.department as any,
        emailVerificationToken,
        emailVerificationExpiry,
        roles: ['STUDENT'],
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        emailVerified: true,
      },
    });

    // Send verification email
    try {
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${emailVerificationToken}`;
      await sendEmail.welcome(user.name || 'Student', verifyUrl, user.email);

      // Send admin notification
      if (process.env.ADMIN_EMAIL) {
        await sendEmail.adminNotification(
          user.name || 'New User',
          user.email,
          process.env.ADMIN_EMAIL
        );
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: { user },
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  }
}