import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/modules/auth/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authService.login(body);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Login failed',
      },
      { status: 401 }
    );
  }
}