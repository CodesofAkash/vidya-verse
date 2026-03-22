export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { optionalAuth } from '@/lib/auth-middleware';

/**
 * GET /api/recommendations
 *
 * Query params:
 *   type=trending|similar|personalized   (default: trending)
 *   resourceId=xxx                       (required for type=similar)
 *   limit=6                              (default 6, max 12)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type       = searchParams.get('type') || 'trending';
    const resourceId = searchParams.get('resourceId');
    const limit      = Math.min(12, Math.max(1, parseInt(searchParams.get('limit') || '6')));

    const caller = await optionalAuth();

    // ── 1. TRENDING ──────────────────────────────────────────────────
    if (type === 'trending') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Resources with most downloads in the last 7 days
      const recent = await prisma.downloadHistory.groupBy({
        by: ['resourceId'],
        where: { downloadedAt: { gte: sevenDaysAgo } },
        _count: { resourceId: true },
        orderBy: { _count: { resourceId: 'desc' } },
        take: limit,
      });

      const ids = recent.map((r) => r.resourceId);

      // If not enough recent activity, fall back to all-time top downloads
      let resources;
      if (ids.length >= limit) {
        resources = await prisma.resource.findMany({
          where: { id: { in: ids } },
          select: resourceSelectFields,
        });
        // Re-sort to match trending order
        const order = Object.fromEntries(ids.map((id, i) => [id, i]));
        resources.sort((a, b) => (order[a.id] ?? 99) - (order[b.id] ?? 99));
      } else {
        resources = await prisma.resource.findMany({
          select: resourceSelectFields,
          orderBy: { downloadCount: 'desc' },
          take: limit,
        });
      }

      return NextResponse.json({
        success: true,
        data: { type: 'trending', resources },
      });
    }

    // ── 2. SIMILAR ───────────────────────────────────────────────────
    if (type === 'similar') {
      if (!resourceId) {
        return NextResponse.json(
          { success: false, message: 'resourceId is required for type=similar' },
          { status: 400 }
        );
      }

      const source = await prisma.resource.findUnique({
        where: { id: resourceId },
        select: { resourceType: true, subject: true, semester: true, department: true },
      });

      if (!source) {
        return NextResponse.json(
          { success: false, message: 'Resource not found' },
          { status: 404 }
        );
      }

      // Same subject first, then same type+semester, exclude self
      const resources = await prisma.resource.findMany({
        where: {
          id:  { not: resourceId },
          OR: [
            { subject:    { contains: source.subject, mode: 'insensitive' } },
            { resourceType: source.resourceType, semester: source.semester },
            { department: source.department, semester: source.semester },
          ],
        },
        select: resourceSelectFields,
        orderBy: { downloadCount: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        data: { type: 'similar', resources },
      });
    }

    // ── 3. PERSONALIZED ──────────────────────────────────────────────
    if (type === 'personalized') {
      if (!caller) {
        // Not logged in → fall back to trending
        const resources = await prisma.resource.findMany({
          select: resourceSelectFields,
          orderBy: { downloadCount: 'desc' },
          take: limit,
        });
        return NextResponse.json({
          success: true,
          data: { type: 'trending', resources, note: 'Log in for personalised picks' },
        });
      }

      // Get user's profile to understand their semester/department
      const user = await prisma.user.findUnique({
        where: { id: caller.userId },
        select: { semester: true, department: true },
      });

      // Get IDs the user already downloaded (exclude them)
      const downloaded = await prisma.downloadHistory.findMany({
        where: { userId: caller.userId },
        select: { resourceId: true },
      });
      const seenIds = downloaded.map((d) => d.resourceId);

      const where: any = { id: { notIn: seenIds } };
      if (user?.semester)   where.semester   = user.semester;
      if (user?.department) where.department = user.department;

      let resources = await prisma.resource.findMany({
        where,
        select: resourceSelectFields,
        orderBy: { downloadCount: 'desc' },
        take: limit,
      });

      // If not enough, relax filters and fill up
      if (resources.length < limit) {
        const moreIds = resources.map((r) => r.id);
        const extra = await prisma.resource.findMany({
          where: { id: { notIn: [...seenIds, ...moreIds] } },
          select: resourceSelectFields,
          orderBy: { downloadCount: 'desc' },
          take: limit - resources.length,
        });
        resources = [...resources, ...extra];
      }

      return NextResponse.json({
        success: true,
        data: { type: 'personalized', resources },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid type. Use: trending | similar | personalized' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load recommendations' },
      { status: 500 }
    );
  }
}

// Shared select shape for all recommendation types
const resourceSelectFields = {
  id:            true,
  title:         true,
  subject:       true,
  semester:      true,
  department:    true,
  resourceType:  true,
  downloadCount: true,
  averageRating: true,
  totalRatings:  true,
  isPremium:     true,
  thumbnailUrl:  true,
  createdAt:     true,
  uploadedBy:    { select: { id: true, name: true } },
} as const;