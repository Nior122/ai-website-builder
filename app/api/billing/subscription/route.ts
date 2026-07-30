// =============================================================================
// GET /api/billing/subscription
// =============================================================================
// Returns the current user's subscription details.
// Resolves the Clerk userId to DB User.id before querying.
// =============================================================================

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSubscription } from '@/features/billing/services/subscription.service';
import { ok, unauthorized, errorResponse } from '@/lib/api-response';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import prisma from '@/lib/prisma/client';

export const GET = withRequestLogging(
  withRateLimit(
    async () => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        // Resolve Clerk userId to database User.id — all Prisma relations
        // reference User.id (cuid), NOT User.clerkId (user_xxx string).
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (!dbUser) return ok({ plan: 'free', status: 'active', currentPeriodStart: null, currentPeriodEnd: null, limits: {} });

        const subscription = await getSubscription(dbUser.id);
        return ok(subscription);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
