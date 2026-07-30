// =============================================================================
// GET/PATCH/DELETE /api/organizations/[orgId]/members — Route Handler Tests
// =============================================================================
// Tests listing, updating roles, and removing organization members.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockListMembers = vi.fn();
const mockUpdateMemberRole = vi.fn();
const mockRemoveMember = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/collaboration/services/collaboration.service', () => ({
  listMembers: (...args: unknown[]) => mockListMembers(...args),
  updateMemberRole: (...args: unknown[]) => mockUpdateMemberRole(...args),
  removeMember: (...args: unknown[]) => mockRemoveMember(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('@/lib/error-tracking', () => ({
  trackError: vi.fn(),
}));

import { ForbiddenError, NotFoundError } from '@/lib/errors';

vi.mock('@/lib/middleware/rate-limit', () => ({
  withRateLimit: (handler: Function) => handler,
}));

vi.mock('@/lib/middleware/request-logger', () => ({
  withRequestLogging: (handler: Function) => handler,
}));

vi.mock('@/lib/middleware/validate', () => ({
  withValidation: (handler: Function, _schemas: unknown) =>
    async (request: NextRequest) => {
      let body: Record<string, unknown> = {};
      try {
        body = await request.json();
      } catch {
        // no body
      }
      const segments = request.nextUrl.pathname.split('/');
      const orgId = segments[3];
      return handler(request, { body, query: {}, params: { orgId } });
    },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET, PATCH, DELETE } from '@/app/api/organizations/[orgId]/members/route';

// ─── Helpers ───────────────────────────────────────────────────────────

const ORG_PARAMS = (orgId: string) => ({ params: Promise.resolve({ orgId }) });

function makeGetRequest(orgId: string): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/organizations/${orgId}/members`, {
      method: 'GET',
    })
  );
}

function makePatchRequest(orgId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/organizations/${orgId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

function makeDeleteRequest(orgId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/organizations/${orgId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
});

// ─── GET Tests ─────────────────────────────────────────────────────────

describe('GET /api/organizations/[orgId]/members', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest('org_1'), ORG_PARAMS('org_1'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns members on success', async () => {
    const members = [
      { id: 'm1', userId: 'u1', role: 'admin', user: { firstName: 'Alice' } },
      { id: 'm2', userId: 'u2', role: 'member', user: { firstName: 'Bob' } },
    ];
    mockListMembers.mockResolvedValue(members);

    const response = await GET(makeGetRequest('org_1'), ORG_PARAMS('org_1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(members);
    expect(mockListMembers).toHaveBeenCalledWith('org_1', 'user_123');
  });

  it('returns 403 when user is not a member', async () => {
    mockListMembers.mockRejectedValue(new ForbiddenError('User is not a member of this organization'));

    const response = await GET(makeGetRequest('org_1'), ORG_PARAMS('org_1'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

// ─── PATCH Tests ───────────────────────────────────────────────────────

describe('PATCH /api/organizations/[orgId]/members', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await PATCH(makePatchRequest('org_1', {
      userId: 'u2',
      role: 'admin',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('updates member role on success', async () => {
    const updated = { id: 'm2', userId: 'u2', role: 'admin' };
    mockUpdateMemberRole.mockResolvedValue(updated);

    const response = await PATCH(makePatchRequest('org_1', {
      userId: 'u2',
      role: 'admin',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.role).toBe('admin');
    expect(mockUpdateMemberRole).toHaveBeenCalledWith('org_1', 'u2', 'admin', 'user_123');
  });

  it('returns 403 when user lacks permission', async () => {
    mockUpdateMemberRole.mockRejectedValue(new ForbiddenError('Only the owner can change roles'));

    const response = await PATCH(makePatchRequest('org_1', {
      userId: 'u2',
      role: 'admin',
    }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

// ─── DELETE Tests ──────────────────────────────────────────────────────

describe('DELETE /api/organizations/[orgId]/members', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await DELETE(makeDeleteRequest('org_1', { userId: 'u2' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('removes member on success', async () => {
    mockRemoveMember.mockResolvedValue(undefined);

    const response = await DELETE(makeDeleteRequest('org_1', { userId: 'u2' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.removed).toBe(true);
    expect(mockRemoveMember).toHaveBeenCalledWith('org_1', 'u2', 'user_123');
  });

  it('returns 403 when user lacks permission', async () => {
    mockRemoveMember.mockRejectedValue(new ForbiddenError('Insufficient permissions'));

    const response = await DELETE(makeDeleteRequest('org_1', { userId: 'u2' }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});
