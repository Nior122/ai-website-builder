// =============================================================================
// GET /api/notifications — Route Handler Tests
// =============================================================================
// Tests notification listing with pagination.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockGetNotifications = vi.fn();
const mockGetUnreadCount = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/notifications/services/notification.service', () => ({
  getNotifications: (...args: unknown[]) => mockGetNotifications(...args),
  getUnreadCount: (...args: unknown[]) => mockGetUnreadCount(...args),
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

import { GET } from '@/app/api/notifications/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/notifications');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
  mockGetNotifications.mockResolvedValue({
    notifications: [],
    unreadCount: 0,
    hasMore: false,
    total: 0,
  });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns notifications with default pagination', async () => {
    const notifications = [
      { id: 'n1', type: 'generation_complete', title: 'Done', read: false },
      { id: 'n2', type: 'deployment_success', title: 'Deployed', read: true },
    ];
    mockGetNotifications.mockResolvedValue({
      notifications,
      unreadCount: 1,
      hasMore: false,
      total: 2,
    });

    // searchParams.get() returns null for missing params; z.coerce.number() coerces null→0
    // which fails .min(1). Provide explicit params to match real browser behavior.
    const response = await GET(makeGetRequest({ page: '1', limit: '20' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.notifications).toEqual(notifications);
    expect(data.data.unreadCount).toBe(1);
    expect(data.data.hasMore).toBe(false);
    expect(mockGetNotifications).toHaveBeenCalledWith('user_123', { page: 1, limit: 20 });
  });

  it('parses custom pagination params', async () => {
    mockGetNotifications.mockResolvedValue({
      notifications: [],
      unreadCount: 0,
      hasMore: true,
      total: 50,
    });

    const response = await GET(makeGetRequest({ page: '2', limit: '10' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetNotifications).toHaveBeenCalledWith('user_123', { page: 2, limit: 10 });
    expect(data.data.hasMore).toBe(true);
    expect(data.data.total).toBe(50);
  });

  it('uses defaults when params are omitted', async () => {
    // No params → null handled via ?? undefined → Zod default(1) and default(20)
    mockGetNotifications.mockResolvedValue({
      notifications: [],
      unreadCount: 0,
      hasMore: false,
      total: 0,
    });
    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetNotifications).toHaveBeenCalledWith('user_123', { page: 1, limit: 20 });
  });

  it('returns 500 when service throws', async () => {
    mockGetNotifications.mockRejectedValue(new Error('Database timeout'));

    // Must pass valid params so Zod passes and the service error is reached
    const response = await GET(makeGetRequest({ page: '1', limit: '20' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
