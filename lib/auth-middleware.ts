import { NextRequest } from 'next/server';
import { verifyAccessToken, isTokenBlacklisted, isUserBlacklisted } from './jwt';
import { UserRole } from '@prisma/client';

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  // Check blacklist
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    return null;
  }

  // Verify token
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return null;
  }

  // Check user blacklist
  const userBlacklisted = await isUserBlacklisted(decoded.userId);
  if (userBlacklisted) {
    return null;
  }

  return decoded;
}

export async function requireAuth(request: NextRequest) {
  const user = await authenticateRequest(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireRoles(request: NextRequest, allowedRoles: UserRole[]) {
  const user = await requireAuth(request);

  const hasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}