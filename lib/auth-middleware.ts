// Force Node.js runtime — auth() uses bcrypt/crypto internally
export const runtime = 'nodejs';

import { auth } from '@/auth';

export interface AuthUser {
  userId: string;
  email: string;
  name: string | null;
  roles: string[];
  emailVerified: boolean;
}

/**
 * Require a valid session. Throws 'Unauthorized' if none.
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? null,
    roles: session.user.roles ?? ['STUDENT'],
    emailVerified: (session.user as any).emailVerified ?? false,
  };
}

/**
 * Returns the session user if logged in, or null. Never throws.
 */
export async function optionalAuth(): Promise<AuthUser | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

/**
 * Require one of the given roles. Throws 'Forbidden' if missing.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!user.roles.some((r) => allowedRoles.includes(r))) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(['ADMIN', 'OWNER']);
}

export async function requireOwner(): Promise<AuthUser> {
  return requireRole(['OWNER']);
}

export function isAdmin(user: AuthUser): boolean {
  return user.roles.some((r) => r === 'ADMIN' || r === 'OWNER');
}

/**
 * Map common thrown errors to HTTP status codes.
 * Usage: status: getErrorStatus(error)
 */
export function getErrorStatus(error: any): number {
  if (error?.message === 'Unauthorized') return 401;
  if (error?.message === 'Forbidden') return 403;
  return 500;
}