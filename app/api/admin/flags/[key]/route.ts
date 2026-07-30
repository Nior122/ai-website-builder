// =============================================================================
// PATCH /api/admin/flags/[key] — Update a feature flag
// DELETE /api/admin/flags/[key] — Delete a feature flag
// =============================================================================
// Admin-only endpoints for updating or removing individual feature flags.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireAdmin } from '@/features/admin/services/auth.service';
import { updateFlag, deleteFlag, type FeatureFlagInput } from '@/features/admin/services/feature-flag.service';
import { ok, noContent, errorResponse, forbidden, badRequest, notFound } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { withValidation } from '@/lib/middleware/validate';
import { updateFlagSchema } from '@/lib/validations';
import { ForbiddenError } from '@/lib/errors';
import { ZodError } from 'zod';

export const PATCH = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request, { body, params }) => {
        try {
          const { userId } = await auth();
          if (!userId) return forbidden('Authentication required');

          await requireAdmin(userId);

          const flag = await updateFlag(params.key, body as Partial<FeatureFlagInput>);
          return ok(flag);
        } catch (err) {
          if (err instanceof ForbiddenError) {
            return forbidden(err.message);
          }
          if ((err as Error).message?.includes('Record to update not found')) {
            return notFound('Feature flag');
          }
          return errorResponse(err as Error);
        }
      },
      { body: updateFlagSchema }
    ),
    { tier: 'enterprise' }
  )
);

export const DELETE = withRequestLogging(
  withRateLimit(
    async (
      _request: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return forbidden('Authentication required');

        await requireAdmin(userId);

        const { key } = await params as { key: string };
        const deleted = await deleteFlag(key);

        if (!deleted) {
          return notFound('Feature flag');
        }

        return noContent();
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
