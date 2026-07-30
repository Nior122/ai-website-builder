// =============================================================================
// POST /api/projects/[id]/unpublish — Route Handler Tests
// =============================================================================
// Tests project unpublishing flow. Delegates to unpublishProject service.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockUnpublishProject = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));
vi.mock('@/features/publishing/services/publishing.service', () => ({
  unpublishProject: (...args: unknown[]) => mockUnpublishProject(...args),
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('@/lib/error-tracking', () => ({ trackError: vi.fn() }));
vi.mock('@/lib/middleware/rate-limit', () => ({ withRateLimit: (handler: Function) => handler }));
vi.mock('@/lib/middleware/request-logger', () => ({ withRequestLogging: (handler: Function) => handler }));

// ─── Import after mocks ────────────────────────────────────────────────

import { POST } from '@/app/api/projects/[id]/unpublish/route';

// ─── Helpers ───────────────────────────────────────────────────────────

const PROJ_PARAMS = { params: Promise.resolve({ id: 'proj_abc' }) };

function makePostRequest(): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/projects/proj_abc/unpublish', { method: 'POST' })
  );
}

const sampleResult = {
  id: 'proj_abc',
  status: 'draft' as const,
  unpublishedAt: new Date().toISOString(),
};

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/projects/[id]/unpublish', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('unpublishes project and returns 200 on success', async () => {
    mockUnpublishProject.mockResolvedValue(sampleResult);

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('draft');
    expect(mockUnpublishProject).toHaveBeenCalledWith('proj_abc', 'user_123');
  });

  it('returns 404 when project does not exist', async () => {
    const { NotFoundError } = await import('@/lib/errors');
    mockUnpublishProject.mockRejectedValue(new NotFoundError('Project not found'));

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 403 when user is not the owner', async () => {
    const { ForbiddenError } = await import('@/lib/errors');
    mockUnpublishProject.mockRejectedValue(new ForbiddenError('Not authorized'));

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    // ForbiddenError → errorResponse → returns 403 via AppError handling
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 500 when service throws unexpected error', async () => {
    mockUnpublishProject.mockRejectedValue(new Error('Database error'));

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
