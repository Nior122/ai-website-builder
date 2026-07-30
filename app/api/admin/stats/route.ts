// =============================================================================
// GET /api/admin/stats
// =============================================================================
// System-wide stats for the admin dashboard. Returns aggregated counts from
// users, projects, deployments, AI usage, and revenue — plus system health.
// Requires admin role.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireAdmin } from '@/features/admin/services/auth.service';
import { getSystemStats, getSystemHealth } from '@/features/admin/services/admin.service';
import { ok, errorResponse, forbidden } from '@/lib/api-response';
import { ForbiddenError } from '@/lib/errors';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (_request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return forbidden('Authentication required');

        await requireAdmin(userId);

        const [stats, health] = await Promise.all([
          getSystemStats(),
          getSystemHealth(),
        ]);

        return ok({ ...stats, health });
      } catch (err) {
        if (err instanceof ForbiddenError) {
          return forbidden(err.message);
        }
        return errorResponse(err as Error);
      }
    },
    { tier: 'enterprise' }
  )
);
