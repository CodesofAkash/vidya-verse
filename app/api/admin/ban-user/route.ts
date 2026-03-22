import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/modules/auth/auth.service';
import { requireRoles } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Only admins can ban
    const admin = await requireRoles(request, ['ADMIN', 'OWNER']);

    const { userId, reason } = await request.json();

    await authService.banUser(userId, admin.userId, reason);

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