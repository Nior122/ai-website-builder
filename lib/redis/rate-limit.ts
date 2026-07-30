// =============================================================================
// Rate Limiting
// =============================================================================
// Token-bucket rate limiter using Redis.
// Supports per-user and per-IP rate limiting with different tiers.
// =============================================================================

import { redis } from './client';
import { RATE_LIMITS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

/**
 * Check and increment rate limit for an identifier.
 * Uses sliding window counter in Redis.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    const pipeline = redis.multi();
    // Remove old entries outside the window
    pipeline.zRemRangeByScore(key, 0, windowStart);
    // Add current request
    pipeline.zAdd(key, { score: now, value: `${now}` });
    // Count requests in window
    pipeline.zCard(key);
    // Set expiry on the key
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const requestCount = (results?.[2] as number) || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const allowed = requestCount <= config.maxRequests;

    // Calculate when the oldest request in the window expires
    const oldest = await redis.zRange(key, 0, 0, { BYSCORE: true } as any);
    const resetAt = oldest.length > 0
      ? Number(oldest[0]) + config.windowMs
      : now + config.windowMs;

    return {
      allowed,
      remaining,
      resetAt,
      retryAfterMs: allowed ? 0 : resetAt - now,
    };
  } catch (err) {
    // If Redis is down, allow the request (fail open)
    logger.error('Rate limit check failed', { error: String(err) });
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
      retryAfterMs: 0,
    };
  }
}

/**
 * Get rate limit config for a plan tier.
 */
export function getRateLimitConfig(tier: 'anonymous' | 'free' | 'pro' | 'enterprise'): RateLimitConfig {
  const limits = RATE_LIMITS[tier];
  return {
    maxRequests: limits.requests,
    windowMs: limits.windowMs,
  };
}

/**
 * Get AI-specific rate limit config.
 */
export function getAIRateLimitConfig(tier: 'free' | 'pro' | 'enterprise'): RateLimitConfig {
  const limits = RATE_LIMITS.ai[tier];
  return {
    maxRequests: limits.requests,
    windowMs: limits.windowMs,
  };
}
