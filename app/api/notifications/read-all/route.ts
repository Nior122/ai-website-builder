// =============================================================================
// PATCH /api/notifications/read-all
// =============================================================================
// Mark all of the authenticated user's notifications as read.
// Resolves Clerk userId to DB User.id before querying.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markAllAsRead } from '@/features/notifications/services/notification.service';
import { ok, errorResponse, unauthorized } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import prisma from '@/lib/prisma/client';

export const PATCH = withRequestLogging(
  withRateLimit(
    async (_request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        // Resolve Clerk userId to database User.id (cuid).
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (!dbUser) return ok({ marked: 0 });

        const count = await markAllAsRead(dbUser.id);

        return ok({ marked: count });
      } catch (err) {
        return errorResponse(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    { tier: 'free' }
  )
);
