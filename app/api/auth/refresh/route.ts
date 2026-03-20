import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/modules/auth/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Refresh token required',
        },
        { status: 400 }
      );
    }

    const result = await authService.refreshToken(refreshToken);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Token refresh failed',
      },
      { status: 401 }
    );
  }
}