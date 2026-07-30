// =============================================================================
// Generation Service Tests
// =============================================================================
// Tests for the AI generation pipeline orchestration (rate limits, plan
// limits, Claude generation handoff).
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGeneration } from '@/features/ai-engine/services/generation.service';
import { RateLimitError, PlanLimitExceededError } from '@/lib/errors';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/ai/generation', () => ({
  generateWithClaude: vi.fn(),
}));

vi.mock('@/lib/redis/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getAIRateLimitConfig: vi.fn(() => ({
    maxRequests: 50,
    windowMs: 60000,
  })),
}));

vi.mock('@/features/billing/services/subscription.service', () => ({
  checkPlanLimits: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() };
  logger.child.mockReturnValue(logger);
  return { logger };
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCallbacks = {
    onProgress: vi.fn(),
    onComplete: vi.fn(),
    onError: vi.fn(),
  };

  const baseRequest = {
    prompt: 'Build a modern SaaS landing page',
    businessType: 'startup',
    industry: 'technology',
    template: 'modern',
    style: 'professional',
  } as any;

  it('should execute generation when all checks pass', async () => {
    const { checkRateLimit } = await import('@/lib/redis/rate-limit');
    const { checkPlanLimits } = await import('@/features/billing/services/subscription.service');
    const { generateWithClaude } = await import('@/lib/ai/generation');

    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    (checkPlanLimits as any).mockResolvedValue({ allowed: true, current: 5, limit: 50 });
    (generateWithClaude as any).mockResolvedValue(undefined);

    await executeGeneration(baseRequest, 'clerk_user_xxx', 'db_user_id_cuid', mockCallbacks);

    expect(generateWithClaude).toHaveBeenCalledWith(baseRequest, 'clerk_user_xxx', 'db_user_id_cuid', mockCallbacks);
  });

  it('should throw RateLimitError when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/redis/rate-limit');

    (checkRateLimit as any).mockResolvedValue({
      allowed: false,
      retryAfterMs: 30000,
    });

    await expect(
      executeGeneration(baseRequest, 'clerk_user_xxx', 'db_user_id_cuid', mockCallbacks)
    ).rejects.toThrow(RateLimitError);
  });

  it('should throw PlanLimitExceededError when plan limit exceeded', async () => {
    const { checkRateLimit } = await import('@/lib/redis/rate-limit');
    const { checkPlanLimits } = await import('@/features/billing/services/subscription.service');

    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    (checkPlanLimits as any).mockResolvedValue({
      allowed: false,
      current: 50,
      limit: 50,
    });

    await expect(
      executeGeneration(baseRequest, 'clerk_user_xxx', 'db_user_id_cuid', mockCallbacks)
    ).rejects.toThrow(PlanLimitExceededError);
  });

  it('should not call generateWithClaude when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/redis/rate-limit');
    const { generateWithClaude } = await import('@/lib/ai/generation');

    (checkRateLimit as any).mockResolvedValue({ allowed: false, retryAfterMs: 60000 });

    await expect(
      executeGeneration(baseRequest, 'clerk_user_xxx', 'db_user_id_cuid', mockCallbacks)
    ).rejects.toThrow();

    expect(generateWithClaude).not.toHaveBeenCalled();
  });

  it('should not call generateWithClaude when plan limit exceeded', async () => {
    const { checkRateLimit } = await import('@/lib/redis/rate-limit');
    const { checkPlanLimits } = await import('@/features/billing/services/subscription.service');
    const { generateWithClaude } = await import('@/lib/ai/generation');

    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    (checkPlanLimits as any).mockResolvedValue({ allowed: false, current: 100, limit: 100 });

    await expect(
      executeGeneration(baseRequest, 'clerk_user_xxx', 'db_user_id_cuid', mockCallbacks)
    ).rejects.toThrow();

    expect(generateWithClaude).not.toHaveBeenCalled();
  });

  it('should pass correct rate limit key for the user', async () => {
    const { checkRateLimit } = await import('@/lib/redis/rate-limit');
    const { checkPlanLimits } = await import('@/features/billing/services/subscription.service');
    const { generateWithClaude } = await import('@/lib/ai/generation');

    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    (checkPlanLimits as any).mockResolvedValue({ allowed: true, current: 0, limit: 50 });
    (generateWithClaude as any).mockResolvedValue(undefined);

    await executeGeneration(baseRequest, 'specific-user-id', 'db_user_id_cuid', mockCallbacks);

    expect(checkRateLimit).toHaveBeenCalledWith(
      'ai:generate:specific-user-id',
      expect.anything()
    );
  });

  it('should pass plan limits check for aiGenerations', async () => {
    const { checkRateLimit } = await import('@/lib/redis/rate-limit');
    const { checkPlanLimits } = await import('@/features/billing/services/subscription.service');
    const { generateWithClaude } = await import('@/lib/ai/generation');

    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    (checkPlanLimits as any).mockResolvedValue({ allowed: true, current: 10, limit: 50 });
    (generateWithClaude as any).mockResolvedValue(undefined);

    await executeGeneration(baseRequest, 'clerk_user_xxx', 'db_user_id_cuid', mockCallbacks);

    expect(checkPlanLimits).toHaveBeenCalledWith('db_user_id_cuid', 'aiGenerations');
  });
});
