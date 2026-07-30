// =============================================================================
// GET /api/notifications
// =============================================================================
// List notifications for the authenticated user (paginated, newest first).
// Returns notifications array + unread count + pagination metadata.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getNotifications, getUnreadCount } from '@/features/notifications/services/notification.service';
import { ok, errorResponse, unauthorized, badRequest } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import prisma from '@/lib/prisma/client';

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        // Resolve Clerk userId to database User.id (cuid).
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (!dbUser) {
          return ok({ notifications: [], unreadCount: 0, hasMore: false, total: 0 });
        }

        const { searchParams } = new URL(request.url);
        const params = listSchema.parse({
          page: searchParams.get('page') ?? undefined,
          limit: searchParams.get('limit') ?? undefined,
        });

        const result = await getNotifications(dbUser.id, params);

        return ok({
          notifications: result.notifications,
          unreadCount: result.unreadCount,
          hasMore: result.hasMore,
          total: result.total,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return badRequest('Invalid query parameters');
        }
        return errorResponse(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    { tier: 'free' }
  )
);
