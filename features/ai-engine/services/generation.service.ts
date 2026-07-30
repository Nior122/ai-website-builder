// =============================================================================
// Generation Service
// =============================================================================
// Server-side service that wraps the AI generation pipeline and
// persists results. Used by the API route and server actions.
// =============================================================================

import { generateWithClaude } from '@/lib/ai/generation';
import { checkRateLimit, getAIRateLimitConfig } from '@/lib/redis/rate-limit';
import { checkPlanLimits } from '@/features/billing/services/subscription.service';
import { RateLimitError, PlanLimitExceededError, AIGenerationError } from '@/lib/errors';
import type { GenerateRequest } from '@/types';
import type { AIGenerationResult } from '../types';

/**
 * Execute a generation with all pre-checks (rate limits, plan limits).
 *
 * @param request   - Validated generation request
 * @param clerkUserId - Clerk user_xxx string (for rate-limit keys only — not used in DB queries)
 * @param dbUserId  - Database User.id (cuid) — used for all Prisma writes and lookups
 */
export async function executeGeneration(
  request: GenerateRequest,
  clerkUserId: string,
  dbUserId: string,
  callbacks: {
    onProgress: (progress: { phase: string; message: string; progress: number }) => void;
    onComplete: (result: AIGenerationResult) => void;
    onError: (message: string) => void;
  }
): Promise<void> {
  // Rate limit check (Clerk ID as cache key is fine — no DB query involved)
  const rateLimit = await checkRateLimit(`ai:generate:${clerkUserId}`, getAIRateLimitConfig('pro'));
  if (!rateLimit.allowed) {
    throw new RateLimitError(rateLimit.retryAfterMs || 60000);
  }

  // Plan limit check (needs DB user ID, not Clerk ID)
  const { allowed, current, limit } = await checkPlanLimits(dbUserId, 'aiGenerations');
  if (!allowed) {
    throw new PlanLimitExceededError('AI generations', current, limit);
  }

  // Execute generation (passes both IDs — dbUserId for DB writes, clerkUserId unused by pipeline)
  return generateWithClaude(request, clerkUserId, dbUserId, callbacks);
}
