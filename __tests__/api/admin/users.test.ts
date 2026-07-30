// =============================================================================
// GET /api/admin/users — Route Handler Tests
// =============================================================================
// Tests paginated user management endpoint with admin role check.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockRequireAdmin = vi.fn();
const mockGetUsers = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/admin/services/auth.service', () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  getUsers: (...args: unknown[]) => mockGetUsers(...args),
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

import { GET } from '@/app/api/admin/users/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/admin/users');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(new Request(url.toString(), { method: 'GET' }));
}

const sampleUsers = [
  {
    id: 'u1',
    email: 'alice@example.com',
    name: 'Alice',
    plan: 'pro',
    projectCount: 5,
    createdAt: '2024-01-15T00:00:00Z',
    lastActiveAt: '2024-06-01T00:00:00Z',
    status: 'active',
  },
  {
    id: 'u2',
    email: 'bob@example.com',
    name: 'Bob',
    plan: 'free',
    projectCount: 1,
    createdAt: '2024-03-20T00:00:00Z',
    lastActiveAt: '2024-05-15T00:00:00Z',
    status: 'active',
  },
];

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'admin_123' });
  mockRequireAdmin.mockResolvedValue({ id: 'u_admin', role: 'admin' });
  mockGetUsers.mockResolvedValue({
    users: sampleUsers,
    totalCount: 2,
    page: 1,
    pageSize: 20,
  });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('returns 403 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 403 when user is not an admin', async () => {
    const { ForbiddenError } = await import('@/lib/errors');
    mockRequireAdmin.mockRejectedValue(new ForbiddenError('Admin access required'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns paginated users on success', async () => {
    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.meta.total).toBe(2);
    expect(data.meta.page).toBe(1);
    expect(mockRequireAdmin).toHaveBeenCalledWith('admin_123');
    expect(mockGetUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
    });
  });

  it('passes search parameter to service', async () => {
    await GET(makeGetRequest({ search: 'alice' }));

    expect(mockGetUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: 'alice',
    });
  });

  it('respects custom pagination params', async () => {
    await GET(makeGetRequest({ page: '2', limit: '10' }));

    expect(mockGetUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: undefined,
    });
  });

  it('returns 500 when service throws unexpected error', async () => {
    mockGetUsers.mockRejectedValue(new Error('Database error'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
