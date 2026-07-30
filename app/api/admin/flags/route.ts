// =============================================================================
// GET /api/admin/flags — List all feature flags
// POST /api/admin/flags — Create a new feature flag
// =============================================================================
// Admin-only endpoints for managing feature flags. GET returns all flags,
// POST creates a new one with validation via Zod.
// =============================================================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireAdmin } from '@/features/admin/services/auth.service';
import { getAllFlags, createFlag, type FeatureFlagInput } from '@/features/admin/services/feature-flag.service';
import { ok, created, errorResponse, forbidden } from '@/lib/api-response';
import { ForbiddenError } from '@/lib/errors';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { createFlagSchema } from '@/lib/validations';

export const GET = withRequestLogging(
  withRateLimit(
    async () => {
      try {
        const { userId } = await auth();
        if (!userId) return forbidden('Authentication required');

        await requireAdmin(userId);

        const flags = await getAllFlags();
        return ok(flags);
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

export const POST = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request, { body }) => {
        try {
          const { userId } = await auth();
          if (!userId) return forbidden('Authentication required');

          await requireAdmin(userId);

          const flag = await createFlag(body as FeatureFlagInput);

          return created(flag);
        } catch (err) {
          if (err instanceof ForbiddenError) {
            return forbidden(err.message);
          }
          return errorResponse(err as Error);
        }
      },
      { body: createFlagSchema }
    ),
    { tier: 'enterprise' }
  )
);
