// =============================================================================
// POST /api/stripe/portal
// =============================================================================
// Create a Stripe customer portal session for managing subscriptions.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createPortalSession } from '@/lib/stripe/client';
import { ok, errorResponse, unauthorized } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

const portalSchema = z.object({
  returnUrl: z.string().url(),
});

export const POST = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const body = await request.json();
        const { returnUrl } = portalSchema.parse(body);

        const session = await createPortalSession(userId, returnUrl);

        return ok({ url: session.url });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return errorResponse(ValidationError.fromZodError(err));
        }
        return errorResponse(err instanceof Error ? err : new Error(String(err)));
      }
    },
    { tier: 'free' }
  )
);
