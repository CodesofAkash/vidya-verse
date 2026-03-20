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

// ```

// ### Test in Postman:

// **Step 1:** Login as admin:
// ```
// POST /api/auth/login
// Body: {
//   "email": "admin@vidyaverse.com",
//   "password": "password123"
// }
// → Save admin's accessToken
// ```

// **Step 2:** Login as regular user:
// ```
// POST /api/auth/login
// Body: {
//   "email": "student1@vidyaverse.com",
//   "password": "password123"
// }
// → Save student's accessToken and user.id
// ```

// **Step 3:** Ban the student (as admin):
// ```
// POST /api/admin/ban-user
// Headers:
//   Authorization: Bearer <admin's token>
// Body: {
//   "userId": "<student's id>",
//   "reason": "Spam uploads"
// }
// ```

// **Step 4:** Try using student's token:
// ```
// GET /api/auth/me
// Headers:
//   Authorization: Bearer <student's token>
// → 403 Forbidden "User account has been suspended"