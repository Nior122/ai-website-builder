// =============================================================================
// GET/POST/DELETE /api/organizations/[orgId]/invitations — Route Handler Tests
// =============================================================================
// Tests listing, creating, and revoking organization invitations.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockListInvitations = vi.fn();
const mockCreateInvitation = vi.fn();
const mockRevokeInvitation = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/collaboration/services/collaboration.service', () => ({
  listInvitations: (...args: unknown[]) => mockListInvitations(...args),
  createInvitation: (...args: unknown[]) => mockCreateInvitation(...args),
  revokeInvitation: (...args: unknown[]) => mockRevokeInvitation(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('@/lib/error-tracking', () => ({
  trackError: vi.fn(),
}));

import { ForbiddenError, NotFoundError, ConflictError } from '@/lib/errors';

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

import { GET, POST, DELETE } from '@/app/api/organizations/[orgId]/invitations/route';

// ─── Helpers ───────────────────────────────────────────────────────────

const ORG_PARAMS = (orgId: string) => ({ params: Promise.resolve({ orgId }) });

function makeGetRequest(orgId: string): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/organizations/${orgId}/invitations`, {
      method: 'GET',
    })
  );
}

function makePostRequest(orgId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/organizations/${orgId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

function makeDeleteRequest(orgId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/organizations/${orgId}/invitations`, {
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

describe('GET /api/organizations/[orgId]/invitations', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest('org_1'), ORG_PARAMS('org_1'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns invitations on success', async () => {
    const invitations = [
      { id: 'inv_1', email: 'alice@example.com', role: 'member' },
    ];
    mockListInvitations.mockResolvedValue(invitations);

    const response = await GET(makeGetRequest('org_1'), ORG_PARAMS('org_1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(invitations);
    expect(mockListInvitations).toHaveBeenCalledWith('org_1', 'user_123');
  });

  it('returns 403 when user is not a member', async () => {
    mockListInvitations.mockRejectedValue(new ForbiddenError('User is not a member'));

    const response = await GET(makeGetRequest('org_1'), ORG_PARAMS('org_1'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

// ─── POST Tests ────────────────────────────────────────────────────────

describe('POST /api/organizations/[orgId]/invitations', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest('org_1', {
      email: 'new@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('creates invitation on success', async () => {
    const invitation = {
      id: 'inv_new',
      email: 'new@example.com',
      role: 'member',
      organizationId: 'org_1',
    };
    mockCreateInvitation.mockResolvedValue(invitation);

    const response = await POST(makePostRequest('org_1', {
      email: 'new@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('new@example.com');
    expect(mockCreateInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_1',
        email: 'new@example.com',
        invitedBy: 'user_123',
      })
    );
  });

  it('returns 403 when user is not an admin', async () => {
    mockCreateInvitation.mockRejectedValue(new ForbiddenError('Only admins can invite'));

    const response = await POST(makePostRequest('org_1', {
      email: 'new@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 409 when invitation already exists', async () => {
    mockCreateInvitation.mockRejectedValue(new ConflictError('Invitation already exists for this email'));

    const response = await POST(makePostRequest('org_1', {
      email: 'existing@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
  });
});

// ─── DELETE Tests ──────────────────────────────────────────────────────

describe('DELETE /api/organizations/[orgId]/invitations', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await DELETE(makeDeleteRequest('org_1', {
      invitationId: 'inv_1',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('revokes invitation on success', async () => {
    mockRevokeInvitation.mockResolvedValue(undefined);

    const response = await DELETE(makeDeleteRequest('org_1', {
      invitationId: 'inv_1',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.revoked).toBe(true);
    expect(mockRevokeInvitation).toHaveBeenCalledWith('inv_1', 'user_123');
  });

  it('returns 403 when user is not an admin', async () => {
    mockRevokeInvitation.mockRejectedValue(new ForbiddenError('Only admins can revoke'));

    const response = await DELETE(makeDeleteRequest('org_1', {
      invitationId: 'inv_1',
    }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});
