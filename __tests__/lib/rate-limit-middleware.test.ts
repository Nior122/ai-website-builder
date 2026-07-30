// =============================================================================
// Rate Limit Middleware Tests
// =============================================================================
// Unit tests for the withRateLimit HOF wrapper.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockCheckRateLimit = vi.fn();
const mockGetRateLimitConfig = vi.fn();
const mockAuth = vi.fn();

vi.mock('@/lib/redis/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRateLimitConfig: (...args: unknown[]) => mockGetRateLimitConfig(...args),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/api-response', () => ({
  tooManyRequests: (retryAfterMs: number) =>
    NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: `Retry in ${retryAfterMs}ms` } },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    ),
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { withRateLimit } from '@/lib/middleware/rate-limit';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeRequest(path = '/api/test'): NextRequest {
  return new NextRequest(new Request(`http://localhost${path}`));
}

const okHandler = async () => NextResponse.json({ ok: true });

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRateLimitConfig.mockReturnValue({ maxRequests: 60, windowMs: 60_000 });
  mockAuth.mockResolvedValue({ userId: 'user_test' });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('withRateLimit', () => {
  it('calls the handler when rate limit is not exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
      retryAfterMs: 0,
    });

    const wrapped = withRateLimit(okHandler);
    const response = await wrapped(makeRequest());

    expect(response.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledOnce();
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
      retryAfterMs: 30_000,
    });

    const wrapped = withRateLimit(okHandler);
    const response = await wrapped(makeRequest());

    expect(response.status).toBe(429);
  });

  it('uses userId for authenticated requests', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
      retryAfterMs: 0,
    });

    const wrapped = withRateLimit(okHandler);
    await wrapped(makeRequest());

    const key = mockCheckRateLimit.mock.calls[0][0] as string;
    expect(key).toContain('user:user_123');
  });

  it('falls back to IP when auth fails', async () => {
    mockAuth.mockRejectedValue(new Error('Not authenticated'));
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
      retryAfterMs: 0,
    });

    const wrapped = withRateLimit(okHandler);
    await wrapped(makeRequest());

    const key = mockCheckRateLimit.mock.calls[0][0] as string;
    expect(key).toContain('ip:');
  });

  it('adds rate limit headers to response', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 42,
      resetAt: Date.now() + 60_000,
      retryAfterMs: 0,
    });

    const wrapped = withRateLimit(okHandler);
    const response = await wrapped(makeRequest());

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('42');
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('resolves tier from function when tier is a callback', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: Date.now() + 60_000,
      retryAfterMs: 0,
    });

    const tierFn = vi.fn().mockReturnValue('enterprise');
    const wrapped = withRateLimit(okHandler, { tier: tierFn });
    await wrapped(makeRequest());

    expect(tierFn).toHaveBeenCalledOnce();
    expect(mockGetRateLimitConfig).toHaveBeenCalledWith('enterprise');
  });

  it('namespaces rate limit key with keyPrefix', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
      retryAfterMs: 0,
    });

    const wrapped = withRateLimit(okHandler, { keyPrefix: 'custom:ns' });
    await wrapped(makeRequest('/api/test'));

    const key = mockCheckRateLimit.mock.calls[0][0] as string;
    expect(key).toMatch(/^custom:ns:user:/);
  });
});
