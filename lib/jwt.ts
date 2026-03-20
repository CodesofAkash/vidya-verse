import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { redis } from './redis';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  emailVerified: boolean;
  semester?: number | null;
  department?: string | null;
  college?: string | null;
}

// Generate Access Token (short-lived)
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

// Generate Refresh Token (long-lived)
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

// Verify Access Token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Verify Refresh Token
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Blacklist a token (for logout, ban, role change)
export async function blacklistToken(token: string, expirySeconds: number = 900) {
  // Store in Redis with TTL (auto-expires after token would expire anyway)
  await redis.setex(`blacklist:${token}`, expirySeconds, '1');
}

// Check if token is blacklisted
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await redis.get(`blacklist:${token}`);
  return result !== null;
}

// Blacklist all user tokens (for ban or role change)
export async function blacklistUserTokens(userId: string) {
  // Store userId in blacklist (all their tokens become invalid)
  await redis.setex(`user_blacklist:${userId}`, 60 * 60 * 24 * 7, '1'); // 7 days
}

// Check if user is blacklisted
export async function isUserBlacklisted(userId: string): Promise<boolean> {
  const result = await redis.get(`user_blacklist:${userId}`);
  return result !== null;
}

// Remove user from blacklist (after unbanning)
export async function removeUserBlacklist(userId: string) {
  await redis.del(`user_blacklist:${userId}`);
}