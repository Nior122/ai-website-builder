// =============================================================================
// GET /api/flags/[key]/check
// =============================================================================
// Public endpoint for checking whether a feature flag is enabled. Clients
// pass their userId and plan to get a personalized evaluation. No auth
// required — the flag evaluation itself handles the access control.
// =============================================================================

import type { NextRequest } from 'next/server';
import { isEnabled } from '@/features/admin/services/feature-flag.service';
import { ok, errorResponse } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (
      request: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ) => {
      try {
        const { key } = await params as { key: string };
        const { searchParams } = new URL(request.url);

        const userId = searchParams.get('userId') ?? undefined;
        const plan = searchParams.get('plan') ?? undefined;

        const enabled = await isEnabled(key, { userId, plan });

        return ok({ enabled, key });
      } catch (err) {
        return errorResponse(err as Error);
      }
    },
    { tier: 'anonymous' }
  )
);
