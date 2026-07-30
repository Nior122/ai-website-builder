// =============================================================================
// Rate Limit Middleware (HOF)
// =============================================================================
// Higher-order function that wraps API route handlers with rate limiting.
// Uses the existing checkRateLimit() from lib/redis/rate-limit.ts.
//
// Usage:
//   export const GET = withRateLimit(handler)
//   export const POST = withRateLimit(handler, { tier: 'pro' })
//   export const DELETE = withRateLimit(handler, {
//     tier: (req) => isPremiumRoute(req) ? 'enterprise' : 'free'
//   })
// =============================================================================

import type { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, getRateLimitConfig } from '@/lib/redis/rate-limit';
import { tooManyRequests } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type RateLimitTier = 'anonymous' | 'free' | 'pro' | 'enterprise';

interface WithRateLimitOptions {
  tier?: RateLimitTier | ((req: NextRequest) => RateLimitTier);
  /** Custom key prefix to namespace rate limits. Defaults to the route path. */
  keyPrefix?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: any, context?: any) => Promise<NextResponse>;

/**
 * Extract client IP from request headers (Vercel, Cloudflare, or direct).
 */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Wrap an API route handler with rate limiting.
 *
 * For authenticated requests, limits are per-user.
 * For unauthenticated requests, limits are per-IP.
 */
export function withRateLimit(
  handler: RouteHandler,
  options: WithRateLimitOptions = {}
) {
  const { tier = 'free', keyPrefix } = options;

  return async (
    req: any,
    context?: any
  ): Promise<NextResponse> => {
    // Determine the rate limit tier
    const resolvedTier = typeof tier === 'function' ? tier(req) : tier;

    // Get config for this tier
    const config = getRateLimitConfig(resolvedTier);

    // Build the rate limit identifier
    let identifier: string;
    try {
      const { userId } = await auth();
      identifier = userId
        ? `user:${userId}`
        : `ip:${getClientIp(req)}`;
    } catch {
      // auth() can throw if Clerk is misconfigured — fall back to IP
      identifier = `ip:${getClientIp(req)}`;
    }

    const namespace = keyPrefix || new URL(req.url).pathname;
    const rateLimitKey = `${namespace}:${identifier}`;

    // Check rate limit
    const result = await checkRateLimit(rateLimitKey, config);

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        namespace,
        tier: resolvedTier,
        remaining: result.remaining,
      });

      return tooManyRequests(result.retryAfterMs);
    }

    // Add rate limit headers to the response
    const response = await handler(req, context);

    // Don't override headers if the handler already set them
    if (!response.headers.has('X-RateLimit-Limit')) {
      response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set(
        'X-RateLimit-Reset',
        String(Math.ceil(result.resetAt / 1000))
      );
    }

    return response;
  };
}
