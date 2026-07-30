// =============================================================================
// GET /api/projects/stats
// =============================================================================
// Returns dashboard stats: total projects, published count, AI generations
// used/limit, and exports used/limit for the authenticated user.
//
// CRITICAL: Resolves Clerk userId to DB User.id before any Prisma queries.
// =============================================================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma/client';
import { ok, errorResponse, unauthorized } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { checkSubscription } from '@/features/billing/services/subscription.service';

async function resolveDbUserId(clerkUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) throw new Error('User not found — please sign in again.');
  return user.id;
}

export const GET = withRequestLogging(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();

      const dbUserId = await resolveDbUserId(userId);

      // Get plan limits
      const { limits } = await checkSubscription(dbUserId);

      // Count in parallel
      const [totalProjects, publishedProjects, aiGenerationsUsed, exportsUsed] =
        await Promise.all([
          prisma.project.count({ where: { ownerId: dbUserId } }),
          prisma.project.count({ where: { ownerId: dbUserId, status: 'published' } }),
          prisma.aIGeneration.count({ where: { userId: dbUserId } }),
          prisma.export.count({ where: { userId: dbUserId } }),
        ]);

      return ok({
        totalProjects,
        publishedProjects,
        aiGenerationsUsed,
        aiGenerationsLimit: limits.aiGenerations,
        exportsUsed,
        exportsLimit: limits.exports,
      });
    } catch (err) {
      return errorResponse(err instanceof Error ? err : new Error(String(err)));
    }
  }, { tier: 'free' })
);
