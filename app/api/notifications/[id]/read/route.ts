// =============================================================================
// PATCH /api/notifications/[id]/read
// =============================================================================
// Mark a single notification as read. Verifies ownership.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markAsRead } from '@/features/notifications/services/notification.service';
import { ok, errorResponse, unauthorized, notFound } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import prisma from '@/lib/prisma/client';

export const PATCH = withRequestLogging(
  withRateLimit(
    async (
      _request: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        // Resolve Clerk userId → DB User.id
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (!dbUser) return unauthorized();

        const { id } = await params as { id: string };
        const success = await markAsRead(id, dbUser.id);

        if (!success) {
          return notFound('Notification');
        }

        return ok({ marked: true });
      } catch (err) {
        return errorResponse(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    { tier: 'free' }
  )
);
