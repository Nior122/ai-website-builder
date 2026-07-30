// =============================================================================
// POST /api/stripe/checkout
// =============================================================================
// Create a Stripe checkout session for subscription upgrade.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/lib/stripe/client';
import { ok, errorResponse, unauthorized } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

const checkoutSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const POST = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const body = await request.json();
        const { priceId, successUrl, cancelUrl } = checkoutSchema.parse(body);

        const session = await createCheckoutSession({
          customerId: userId,
          priceId,
          successUrl,
          cancelUrl,
          trialDays: 14,
        });

        return ok({ sessionId: session.id, url: session.url });
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
