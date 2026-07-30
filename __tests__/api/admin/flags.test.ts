// =============================================================================
// GET/POST /api/admin/flags — Route Handler Tests
// =============================================================================
// Tests listing and creating feature flags with admin authorization.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockRequireAdmin = vi.fn();
const mockGetAllFlags = vi.fn();
const mockCreateFlag = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));
vi.mock('@/features/admin/services/auth.service', () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));
vi.mock('@/features/admin/services/feature-flag.service', () => ({
  getAllFlags: (...args: unknown[]) => mockGetAllFlags(...args),
  createFlag: (...args: unknown[]) => mockCreateFlag(...args),
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('@/lib/error-tracking', () => ({ trackError: vi.fn() }));
vi.mock('@/lib/middleware/rate-limit', () => ({ withRateLimit: (handler: Function) => handler }));
vi.mock('@/lib/middleware/request-logger', () => ({ withRequestLogging: (handler: Function) => handler }));
vi.mock('@/lib/middleware/validate', () => ({
  withValidation: (handler: Function, _schemas: unknown) =>
    async (request: NextRequest) => {
      let body: Record<string, unknown> = {};
      try { body = await request.json(); } catch { /* no body */ }
      return handler(request, { body, query: {}, params: {} });
    },
}));
vi.mock('@/lib/validations', () => ({
  createFlagSchema: { /* passthrough — validation mocked away */ },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET, POST } from '@/app/api/admin/flags/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(): NextRequest {
  return new NextRequest(new Request('http://localhost/api/admin/flags', { method: 'GET' }));
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/admin/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

const sampleFlags = [
  { key: 'new-dashboard', enabled: true, description: 'New dashboard UI' },
  { key: 'dark-mode', enabled: false, description: 'Dark mode support' },
];

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'admin_1' });
  mockRequireAdmin.mockResolvedValue(undefined);
});

// ─── GET Tests ─────────────────────────────────────────────────────────

describe('GET /api/admin/flags', () => {
  it('returns 403 when user is not authenticated (route uses forbidden())', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest());
    const data = await response.json();

    // The route uses forbidden('Authentication required') instead of unauthorized()
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 500 when user is not an admin (plain Error, not ForbiddenError)', async () => {
    // requireAdmin rejects with Error, not ForbiddenError → caught by errorResponse → 500
    mockRequireAdmin.mockRejectedValue(new Error('Forbidden: Admin access required'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('returns flags on success', async () => {
    mockGetAllFlags.mockResolvedValue(sampleFlags);

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(sampleFlags);
  });

  it('returns 500 when service throws', async () => {
    mockGetAllFlags.mockRejectedValue(new Error('Database error'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

// ─── POST Tests ────────────────────────────────────────────────────────

describe('POST /api/admin/flags', () => {
  it('returns 403 when user is not authenticated (route uses forbidden())', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({ key: 'test', enabled: true }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 500 when user is not an admin (plain Error, not ForbiddenError)', async () => {
    // requireAdmin rejects with Error → errorResponse returns 500
    mockRequireAdmin.mockRejectedValue(new Error('Forbidden: Admin access required'));

    const response = await POST(makePostRequest({ key: 'test', enabled: true }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('creates flag on success', async () => {
    const newFlag = { key: 'test-flag', enabled: true, description: 'Test' };
    mockCreateFlag.mockResolvedValue(newFlag);

    const response = await POST(makePostRequest({ key: 'test-flag', enabled: true }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.key).toBe('test-flag');
    expect(mockCreateFlag).toHaveBeenCalledWith(expect.objectContaining({ key: 'test-flag' }));
  });

  it('returns 500 when service throws on create', async () => {
    mockCreateFlag.mockRejectedValue(new Error('Database error'));

    const response = await POST(makePostRequest({ key: 'test', enabled: true }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
