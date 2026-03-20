import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, isTokenBlacklisted, isUserBlacklisted } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No token provided',
        },
        { status: 401 }
      );
    }

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token has been invalidated',
        },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    // Check if user is blacklisted (banned)
    const userBlacklisted = await isUserBlacklisted(decoded.userId);
    if (userBlacklisted) {
      return NextResponse.json(
        {
          success: false,
          message: 'User account has been suspended',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: decoded.userId,
          email: decoded.email,
          roles: decoded.roles,
          emailVerified: decoded.emailVerified,
          semester: decoded.semester,
          department: decoded.department,
          college: decoded.college,
        },
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get user',
      },
      { status: 500 }
    );
  }
}