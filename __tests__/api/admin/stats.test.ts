// =============================================================================
// GET /api/admin/stats — Route Handler Tests
// =============================================================================
// Tests admin stats endpoint with auth guard and role check.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { ForbiddenError } from '@/lib/errors';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockRequireAdmin = vi.fn();
const mockGetSystemStats = vi.fn();
const mockGetSystemHealth = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/admin/services/auth.service', () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  getSystemStats: (...args: unknown[]) => mockGetSystemStats(...args),
  getSystemHealth: (...args: unknown[]) => mockGetSystemHealth(...args),
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

// ─── Import after mocks ────────────────────────────────────────────────

import { GET } from '@/app/api/admin/stats/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(): NextRequest {
  return new NextRequest(new Request('http://localhost/api/admin/stats'));
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'admin_123' });
  mockRequireAdmin.mockResolvedValue({ role: 'admin' });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  it('returns 403 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 403 when user is not an admin', async () => {
    mockRequireAdmin.mockRejectedValue(new ForbiddenError('Admin access required'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns stats and health on success', async () => {
    const stats = {
      totalUsers: 150,
      totalProjects: 420,
      activeSubscriptions: 85,
      monthlyRevenue: 4250,
    };
    const health = {
      database: 'healthy',
      redis: 'healthy',
      ai: 'healthy',
      uptime: 86400,
    };

    mockGetSystemStats.mockResolvedValue(stats);
    mockGetSystemHealth.mockResolvedValue(health);

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.totalUsers).toBe(150);
    expect(data.data.totalProjects).toBe(420);
    expect(data.data.health).toEqual(health);
    expect(mockRequireAdmin).toHaveBeenCalledWith('admin_123');
  });

  it('returns 500 when stats service throws', async () => {
    mockGetSystemStats.mockRejectedValue(new Error('Service unavailable'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
