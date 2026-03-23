import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Only admins can ban
    const admin = await requireRole(['ADMIN', 'OWNER']);

    const { userId, reason } = await request.json();

    // Set isActive to false to ban the user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Optionally, log the reason and admin.userId in a moderation log table if exists

    return NextResponse.json({
      success: true,
      message: 'User banned successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.message === 'Unauthorized' ? 401 : 403 }
    );
  }
}