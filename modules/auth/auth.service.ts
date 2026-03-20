import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  generateAccessToken,
  generateRefreshToken,
  blacklistUserTokens,
  removeUserBlacklist,
} from '@/lib/jwt';
import { UserRole } from '@prisma/client';

// Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  semester: z.number().min(1).max(8).optional(),
  department: z.string().optional(),
  collegeId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  // Register new user
  async register(data: RegisterInput) {
    const validated = registerSchema.parse(data);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
        semester: validated.semester,
        department: validated.department as any,
        collegeId: validated.collegeId,
        roles: ['STUDENT'],
      },
      include: {
        college: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles as UserRole[],
      emailVerified: user.emailVerified,
      semester: user.semester,
      department: user.department,
      college: user.college?.name || null,
    });

    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        emailVerified: user.emailVerified,
        semester: user.semester,
        department: user.department,
        college: user.college?.name || null,
      },
      accessToken,
      refreshToken,
    };
  }

  // Login user
  async login(data: LoginInput) {
    const validated = loginSchema.parse(data);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: { college: true },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      validated.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles as UserRole[],
      emailVerified: user.emailVerified,
      semester: user.semester,
      department: user.department,
      college: user.college?.name || null,
    });

    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        emailVerified: user.emailVerified,
        semester: user.semester,
        department: user.department,
        college: user.college?.name || null,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string) {
    const decoded = await import('@/lib/jwt').then((m) =>
      m.verifyRefreshToken(refreshToken)
    );

    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Check if user is blacklisted
    const isBlacklisted = await import('@/lib/jwt').then((m) =>
      m.isUserBlacklisted(decoded.userId)
    );

    if (isBlacklisted) {
      throw new Error('User session has been invalidated');
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { college: true },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token with fresh data
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles as UserRole[],
      emailVerified: user.emailVerified,
      semester: user.semester,
      department: user.department,
      college: user.college?.name || null,
    });

    return {
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        emailVerified: user.emailVerified,
      },
    };
  }

  // Ban user (invalidate all their tokens)
  async banUser(userId: string, bannedById: string, reason: string) {
    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        canUpload: false,
      },
    });

    // Blacklist all user tokens
    await blacklistUserTokens(userId);

    // Log the ban
    await prisma.userWarning.create({
      data: {
        userId,
        warnedById: bannedById,
        reason: `BANNED: ${reason}`,
      },
    });

    return { message: 'User banned successfully' };
  }

  // Unban user
  async unbanUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        canUpload: true,
      },
    });

    // Remove from blacklist
    await removeUserBlacklist(userId);

    return { message: 'User unbanned successfully' };
  }

  // Change user role (invalidate tokens to force re-login)
  async changeUserRole(userId: string, newRoles: UserRole[]) {
    await prisma.user.update({
      where: { id: userId },
      data: { roles: newRoles },
    });

    // Blacklist all existing tokens (user must re-login to get new role)
    await blacklistUserTokens(userId);

    return { message: 'Role updated. User must re-login.' };
  }

  // Verify email
  async verifyEmail(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
      include: { college: true },
    });

    // Blacklist old tokens, generate new one with emailVerified: true
    await blacklistUserTokens(userId);

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles as UserRole[],
      emailVerified: true,
      semester: user.semester,
      department: user.department,
      college: user.college?.name || null,
    });

    const refreshToken = generateRefreshToken(user.id);

    return {
      message: 'Email verified successfully',
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();