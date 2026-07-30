// =============================================================================
// GET/POST /api/projects/[id]/blog — Route Handler Tests
// =============================================================================
// Tests listing and generating blog posts for a project.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockListBlogPosts = vi.fn();
const mockGenerateBlogPost = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));
vi.mock('@/features/blog/services/blog.service', () => ({
  listBlogPosts: (...args: unknown[]) => mockListBlogPosts(...args),
  generateBlogPost: (...args: unknown[]) => mockGenerateBlogPost(...args),
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
      const segments = request.nextUrl.pathname.split('/');
      const id = segments[3];
      return handler(request, { body, query: {}, params: { id } });
    },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET, POST } from '@/app/api/projects/[id]/blog/route';

// ─── Helpers ───────────────────────────────────────────────────────────

const PROJ_PARAMS = { params: Promise.resolve({ id: 'proj_abc' }) };

function makeGetRequest(searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/projects/proj_abc/blog');
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(new Request(url.toString(), { method: 'GET' }));
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/projects/proj_abc/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

const samplePosts = [
  { id: 'post_1', title: 'Getting Started', status: 'published' as const, createdAt: new Date().toISOString() },
  { id: 'post_2', title: 'Draft Post', status: 'draft' as const, createdAt: new Date().toISOString() },
];

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
});

// ─── GET Tests ─────────────────────────────────────────────────────────

describe('GET /api/projects/[id]/blog', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns blog posts on success', async () => {
    mockListBlogPosts.mockResolvedValue(samplePosts);

    const response = await GET(makeGetRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(mockListBlogPosts).toHaveBeenCalledWith({
      projectId: 'proj_abc',
      userId: 'user_123',
      status: null, // searchParams.get() returns null for missing params
      page: 1,
      limit: 20,
    });
  });

  it('filters by status when provided', async () => {
    mockListBlogPosts.mockResolvedValue([samplePosts[0]]);

    await GET(makeGetRequest({ status: 'published' }), PROJ_PARAMS);

    expect(mockListBlogPosts).toHaveBeenCalledWith({
      projectId: 'proj_abc',
      userId: 'user_123',
      status: 'published',
      page: 1,
      limit: 20,
    });
  });

  it('returns empty array when no posts', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    const response = await GET(makeGetRequest(), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it('returns 500 when service throws (errorResponse misuse)', async () => {
    mockListBlogPosts.mockRejectedValue(new Error('Database error'));

    const response = await GET(makeGetRequest(), PROJ_PARAMS);
    const data = await response.json();

    // errorResponse(message, 500) returns 500
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

// ─── POST Tests ────────────────────────────────────────────────────────

describe('POST /api/projects/[id]/blog', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({ topic: 'New Post' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('generates blog post on success', async () => {
    const newPost = {
      id: 'post_new',
      title: 'New Post',
      topic: 'New Post',
      status: 'draft' as const,
    };
    mockGenerateBlogPost.mockResolvedValue(newPost);

    const response = await POST(makePostRequest({ topic: 'New Post' }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.topic).toBe('New Post');
    expect(mockGenerateBlogPost).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'New Post' }),
      'proj_abc',
      'user_123'
    );
  });

  it('returns 500 when service throws (errorResponse misuse)', async () => {
    mockGenerateBlogPost.mockRejectedValue(new Error('Failed to generate'));

    const response = await POST(makePostRequest({ topic: 'New Post' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
