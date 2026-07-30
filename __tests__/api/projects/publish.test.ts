// =============================================================================
// POST /api/projects/[id]/publish — Route Handler Tests
// =============================================================================
// Tests project publishing flow. Delegates to publishProject service.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockPublishProject = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/publishing/services/publishing.service', () => ({
  publishProject: (...args: unknown[]) => mockPublishProject(...args),
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

import { POST } from '@/app/api/projects/[id]/publish/route';

// ─── Helpers ───────────────────────────────────────────────────────────

const PROJ_PARAMS = { params: Promise.resolve({ id: 'proj_abc' }) };

function makePostRequest(): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/projects/proj_abc/publish', {
      method: 'POST',
    })
  );
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/projects/[id]/publish', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('publishes project and returns 200 on success', async () => {
    const result = {
      id: 'proj_abc',
      status: 'published',
      publishedAt: new Date().toISOString(),
      version: 1,
    };
    mockPublishProject.mockResolvedValue(result);

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('published');
    expect(mockPublishProject).toHaveBeenCalledWith('proj_abc', 'user_123');
  });

  it('returns 404 when project does not exist', async () => {
    const { NotFoundError } = await import('@/lib/errors');
    mockPublishProject.mockRejectedValue(new NotFoundError('Project not found'));

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 403 when user is not the project owner', async () => {
    const { ForbiddenError } = await import('@/lib/errors');
    mockPublishProject.mockRejectedValue(new ForbiddenError('Not authorized'));

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 500 when service throws unexpected error', async () => {
    mockPublishProject.mockRejectedValue(new Error('Database error'));

    const response = await POST(makePostRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
