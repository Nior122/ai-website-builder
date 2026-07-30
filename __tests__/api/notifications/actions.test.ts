// =============================================================================
// PATCH /api/notifications/read-all + PATCH /api/notifications/[id]/read
// =============================================================================
// Tests marking notifications as read (bulk and single).
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockMarkAsRead = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));
vi.mock('@/features/notifications/services/notification.service', () => ({
  markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
  markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('@/lib/error-tracking', () => ({ trackError: vi.fn() }));
vi.mock('@/lib/middleware/rate-limit', () => ({ withRateLimit: (handler: Function) => handler }));
vi.mock('@/lib/middleware/request-logger', () => ({ withRequestLogging: (handler: Function) => handler }));

vi.mock('@/lib/prisma/client', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where: { clerkId } }: { where: { clerkId: string } }) => ({
        id: clerkId,
      })),
    },
  },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { PATCH as ReadAll } from '@/app/api/notifications/read-all/route';
import { PATCH as ReadOne } from '@/app/api/notifications/[id]/read/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeRequest(): NextRequest {
  return new NextRequest(new Request('http://localhost/api/notifications/read-all', { method: 'PATCH' }));
}

const NOTIF_PARAMS = (id: string) => ({ params: Promise.resolve({ id }) });

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
});

// ─── Read-All Tests ────────────────────────────────────────────────────

describe('PATCH /api/notifications/read-all', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await ReadAll(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('marks all as read and returns count', async () => {
    mockMarkAllAsRead.mockResolvedValue(5);

    const response = await ReadAll(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.marked).toBe(5);
    expect(mockMarkAllAsRead).toHaveBeenCalledWith('user_123');
  });

  it('returns 0 when no unread notifications', async () => {
    mockMarkAllAsRead.mockResolvedValue(0);

    const response = await ReadAll(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.marked).toBe(0);
  });

  it('returns 500 when service throws', async () => {
    mockMarkAllAsRead.mockRejectedValue(new Error('Database error'));

    const response = await ReadAll(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

// ─── Read-One Tests ────────────────────────────────────────────────────

describe('PATCH /api/notifications/[id]/read', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await ReadOne(makeRequest(), NOTIF_PARAMS('notif_1'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('marks notification as read and returns 200', async () => {
    mockMarkAsRead.mockResolvedValue(true);

    const response = await ReadOne(makeRequest(), NOTIF_PARAMS('notif_1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.marked).toBe(true);
    expect(mockMarkAsRead).toHaveBeenCalledWith('notif_1', 'user_123');
  });

  it('returns 404 when notification does not exist', async () => {
    mockMarkAsRead.mockResolvedValue(false);

    const response = await ReadOne(makeRequest(), NOTIF_PARAMS('notif_missing'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 500 when service throws', async () => {
    mockMarkAsRead.mockRejectedValue(new Error('Database error'));

    const response = await ReadOne(makeRequest(), NOTIF_PARAMS('notif_1'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
