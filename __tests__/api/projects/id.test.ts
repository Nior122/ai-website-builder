// =============================================================================
// PATCH /api/projects/[id] — Route Handler Tests
// =============================================================================
// Integration tests for the project update endpoint. Mocks auth, Prisma,
// Redis, and middleware to test handler logic in isolation.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCacheDelete = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/prisma/client', () => ({
  default: {
    project: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    user: {
      findUnique: vi.fn(async ({ where: { clerkId } }: { where: { clerkId: string } }) => ({
        id: clerkId,
      })),
    },
  },
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheDelete: (...args: unknown[]) => mockCacheDelete(...args),
  cacheKeys: {
    project: (id: string) => `project:${id}`,
    projectBySlug: (slug: string) => `project:slug:${slug}`,
  },
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

vi.mock('@/lib/middleware/validate', () => ({
  withValidation: (handler: Function, _schemas: unknown) =>
    async (request: NextRequest) => {
      let body: Record<string, unknown> = {};
      try {
        body = await request.json();
      } catch {
        // no body
      }
      return handler(request, { body, query: {}, params: {} });
    },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { PATCH } from '@/app/api/projects/[id]/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makePatchRequest(
  projectId: string,
  body: Record<string, unknown>
): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
  mockCacheDelete.mockResolvedValue(undefined);
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('PATCH /api/projects/[id]', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await PATCH(makePatchRequest('proj_abc', { name: 'New Name' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when project does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await PATCH(makePatchRequest('proj_missing', { name: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when user does not own the project', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_other' });

    const response = await PATCH(makePatchRequest('proj_abc', { name: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('updates project and returns 200 on success', async () => {
    const project = { ownerId: 'user_123' };
    const updated = { id: 'proj_abc', name: 'Updated Name', slug: 'updated-name' };

    mockFindUnique.mockResolvedValue(project);
    mockUpdate.mockResolvedValue(updated);

    const response = await PATCH(makePatchRequest('proj_abc', { name: 'Updated Name' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated Name');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'proj_abc' },
      data: { name: 'Updated Name' },
    });
  });

  it('invalidates caches after successful update', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_123' });
    mockUpdate.mockResolvedValue({ id: 'proj_abc', slug: 'my-project' });

    await PATCH(makePatchRequest('proj_abc', { description: 'New desc' }));

    expect(mockCacheDelete).toHaveBeenCalledWith('project:proj_abc');
    expect(mockCacheDelete).toHaveBeenCalledWith('project:slug:my-project');
  });

  it('returns error when no valid fields are provided', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_123' });

    // Empty body — all fields undefined after filtering
    const response = await PATCH(makePatchRequest('proj_abc', {}));
    const data = await response.json();

    // badRequest() returns 400 directly
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('handles multiple field updates', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_123' });
    mockUpdate.mockResolvedValue({ id: 'proj_abc', slug: 'test' });

    const response = await PATCH(
      makePatchRequest('proj_abc', {
        name: 'New Name',
        description: 'New Description',
        status: 'published',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'proj_abc' },
      data: {
        name: 'New Name',
        description: 'New Description',
        status: 'published',
      },
    });
  });

  it('returns 500 when Prisma throws an unexpected error', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_123' });
    mockUpdate.mockRejectedValue(new Error('Database connection lost'));

    const response = await PATCH(makePatchRequest('proj_abc', { name: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
