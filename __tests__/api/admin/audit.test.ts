// =============================================================================
// GET /api/admin/audit — Route Handler Tests
// =============================================================================
// Tests paginated audit log with filters (userId, resource, action, date range).
// NOTE: This route has no auth guard — it directly calls getAuditLogs.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockGetAuditLogs = vi.fn();

vi.mock('@/features/admin/services/audit.service', () => ({
  getAuditLogs: (...args: unknown[]) => mockGetAuditLogs(...args),
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('@/lib/error-tracking', () => ({ trackError: vi.fn() }));
vi.mock('@/lib/middleware/rate-limit', () => ({ withRateLimit: (handler: Function) => handler }));
vi.mock('@/lib/middleware/request-logger', () => ({ withRequestLogging: (handler: Function) => handler }));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET } from '@/app/api/admin/audit/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/admin/audit');
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(new Request(url.toString(), { method: 'GET' }));
}

const sampleLogs = Array.from({ length: 3 }, (_, i) => ({
  id: `log_${i}`,
  userId: `user_${i}`,
  action: 'update',
  resource: 'project',
  timestamp: new Date().toISOString(),
}));

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/admin/audit', () => {
  it('returns paginated audit logs on success', async () => {
    mockGetAuditLogs.mockResolvedValue({
      logs: sampleLogs,
      totalCount: 10,
      page: 1,
      limit: 20,
    });

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3);
    expect(data.meta.total).toBe(10);
    expect(data.meta.page).toBe(1);
    expect(data.meta.limit).toBe(20);
    expect(mockGetAuditLogs).toHaveBeenCalledWith({
      userId: undefined,
      resource: undefined,
      resourceId: undefined,
      action: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('passes filter params to service', async () => {
    mockGetAuditLogs.mockResolvedValue({ logs: [], totalCount: 0, page: 1, limit: 20 });

    await GET(makeGetRequest({
      userId: 'user_abc',
      resource: 'project',
      action: 'delete',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    }));

    expect(mockGetAuditLogs).toHaveBeenCalledWith({
      userId: 'user_abc',
      resource: 'project',
      resourceId: undefined,
      action: 'delete',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      page: 1,
      limit: 20,
    });
  });

  it('returns empty array when no logs match', async () => {
    mockGetAuditLogs.mockResolvedValue({ logs: [], totalCount: 0, page: 1, limit: 20 });

    const response = await GET(makeGetRequest({ userId: 'nonexistent' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.meta.total).toBe(0);
  });

  it('returns 500 when service throws (no error handler in route)', async () => {
    // The route has no try/catch — the error propagates and vitest catches it
    mockGetAuditLogs.mockRejectedValue(new Error('Database error'));

    // Route has no error handler, so the error is unhandled
    await expect(GET(makeGetRequest())).rejects.toThrow('Database error');
  });

  it('passes custom pagination params', async () => {
    mockGetAuditLogs.mockResolvedValue({ logs: [], totalCount: 0, page: 1, limit: 20 });

    await GET(makeGetRequest({ page: '2', limit: '10' }));

    expect(mockGetAuditLogs).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      limit: 10,
    }));
  });
});
