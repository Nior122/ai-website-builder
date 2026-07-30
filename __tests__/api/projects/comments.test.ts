// =============================================================================
// GET/POST /api/projects/[id]/comments — Route Handler Tests
// =============================================================================
// Tests listing and creating comments on a project.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockListComments = vi.fn();
const mockCreateComment = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/collaboration/services/collaboration.service', () => ({
  listComments: (...args: unknown[]) => mockListComments(...args),
  createComment: (...args: unknown[]) => mockCreateComment(...args),
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
      // Extract params from URL path: /api/projects/[id]/comments
      const segments = request.nextUrl.pathname.split('/');
      const id = segments[3]; // 'proj_abc'
      return handler(request, { body, query: {}, params: { id } });
    },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET, POST } from '@/app/api/projects/[id]/comments/route';

// ─── Helpers ───────────────────────────────────────────────────────────

const PROJ_PARAMS = { params: Promise.resolve({ id: 'proj_abc' }) };

function makeGetRequest(searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/projects/proj_abc/comments');
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(new Request(url.toString(), { method: 'GET' }));
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/projects/proj_abc/comments', {
      method: 'POST',
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

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/projects/[id]/comments', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns comments on success', async () => {
    const comments = [
      { id: 'c1', content: 'Great section!', author: { firstName: 'Jane' } },
      { id: 'c2', content: 'Needs work', author: { firstName: 'John' } },
    ];
    mockListComments.mockResolvedValue(comments);

    const response = await GET(makeGetRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(comments);
    expect(mockListComments).toHaveBeenCalledWith('proj_abc', 'user_123', undefined);
  });

  it('passes sectionId filter when provided', async () => {
    mockListComments.mockResolvedValue([]);

    await GET(makeGetRequest({ sectionId: 'sec_123' }), PROJ_PARAMS);

    expect(mockListComments).toHaveBeenCalledWith('proj_abc', 'user_123', 'sec_123');
  });
});

describe('POST /api/projects/[id]/comments', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({ content: 'Nice!' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('creates comment and returns 201', async () => {
    const comment = {
      id: 'c_new',
      content: 'Nice work!',
      projectId: 'proj_abc',
      authorId: 'user_123',
    };
    mockCreateComment.mockResolvedValue(comment);

    const response = await POST(makePostRequest({ content: 'Nice work!' }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.content).toBe('Nice work!');
    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_abc',
        authorId: 'user_123',
        content: 'Nice work!',
      })
    );
  });

  it('returns 500 when service throws', async () => {
    mockCreateComment.mockRejectedValue(new Error('Project not found'));

    const response = await POST(makePostRequest({ content: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
