// =============================================================================
// GET /api/billing/subscription — Route Handler Tests
// =============================================================================
// Tests subscription retrieval endpoint.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockGetSubscription = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/billing/services/subscription.service', () => ({
  getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('@/lib/error-tracking', () => ({
  trackError: vi.fn(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  withRateLimit: (handler: Function) => handler,
}));

vi.mock('@/lib/middleware/request-logger', () => ({
  withRequestLogging: (handler: Function) => handler,
}));

vi.mock('@/lib/prisma/client', () => ({
  default: {
    user: {
      // Idempotent Clerk→DB resolution: user_xxx maps to itself.
      findUnique: vi.fn(async ({ where: { clerkId } }: { where: { clerkId: string } }) => ({
        id: clerkId,
      })),
    },
  },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET } from '@/app/api/billing/subscription/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(): NextRequest {
  return new NextRequest(new Request('http://localhost/api/billing/subscription'));
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/billing/subscription', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns subscription details on success', async () => {
    const subscription = {
      plan: 'pro',
      status: 'active',
      currentPeriodStart: '2025-01-01T00:00:00Z',
      currentPeriodEnd: '2025-02-01T00:00:00Z',
      cancelAtPeriodEnd: false,
    };
    mockGetSubscription.mockResolvedValue(subscription);

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.plan).toBe('pro');
    expect(data.data.status).toBe('active');
    expect(mockGetSubscription).toHaveBeenCalledWith('user_123');
  });

  it('returns free plan subscription', async () => {
    mockGetSubscription.mockResolvedValue({
      plan: 'free',
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.plan).toBe('free');
  });

  it('returns 500 when service throws', async () => {
    mockGetSubscription.mockRejectedValue(new Error('Stripe API error'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
