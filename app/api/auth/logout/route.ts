import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add custom logout logic here
    // (e.g., blacklist tokens, clear Redis cache, log audit trail)

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}