// No runtime directive needed — no auth/bcrypt, pure DB read
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/colleges
export async function GET() {
  try {
    const colleges = await prisma.college.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        logo: true,
      },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: { colleges } });
  } catch (error) {
    console.error('Fetch colleges error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}