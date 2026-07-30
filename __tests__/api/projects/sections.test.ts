// =============================================================================
// POST /api/projects/[id]/sections — Route Handler Tests
// =============================================================================
// Tests section creation within a project page.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockSectionCreate = vi.fn();
const mockSectionUpdate = vi.fn();
const mockCacheDelete = vi.fn();
const mockGetDefaultSection = vi.fn();
const mockNanoid = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/prisma/client', () => ({
  default: {
    project: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    page: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    section: {
      create: (...args: unknown[]) => mockSectionCreate(...args),
      update: (...args: unknown[]) => mockSectionUpdate(...args),
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

vi.mock('@/features/json-engine', () => ({
  getDefaultSection: (...args: unknown[]) => mockGetDefaultSection(...args),
}));

vi.mock('nanoid', () => ({
  nanoid: (...args: unknown[]) => mockNanoid(...args),
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { POST } from '@/app/api/projects/[id]/sections/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/projects/proj_abc/sections', {
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
  mockCacheDelete.mockResolvedValue(undefined);
  mockNanoid.mockReturnValue('sec_new123');
  mockGetDefaultSection.mockReturnValue({
    layout: 'full-width',
    content: { heading: 'Default' },
    styles: {},
    animations: {},
    images: {},
    visibility: { desktop: true, mobile: true },
  });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/projects/[id]/sections', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({
      pageId: 'page_1',
      type: 'hero',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when project does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await POST(makePostRequest({
      pageId: 'page_1',
      type: 'hero',
    }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 404 when user does not own the project', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_other' });

    const response = await POST(makePostRequest({
      pageId: 'page_1',
      type: 'hero',
    }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 404 when page does not exist in project', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_123' });
    mockFindFirst.mockResolvedValue(null);

    const response = await POST(makePostRequest({
      pageId: 'page_missing',
      type: 'hero',
    }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('creates section and returns 201 on success', async () => {
    const createdSection = {
      id: 'sec_new123',
      pageId: 'page_1',
      type: 'hero',
      layout: 'full-width',
      content: { heading: 'Default' },
      order: 0,
    };

    mockFindUnique.mockResolvedValue({ ownerId: 'user_123' });
    mockFindFirst.mockResolvedValue({
      id: 'page_1',
      sections: [],
    });
    mockSectionCreate.mockResolvedValue(createdSection);

    const response = await POST(makePostRequest({
      pageId: 'page_1',
      type: 'hero',
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('sec_new123');
    expect(data.data.type).toBe('hero');
    expect(mockSectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pageId: 'page_1',
          type: 'hero',
        }),
      })
    );
  });

  it('invalidates cache after creating section', async () => {
    mockFindUnique.mockResolvedValue({ ownerId: 'user_123' });
    mockFindFirst.mockResolvedValue({ id: 'page_1', sections: [] });
    mockSectionCreate.mockResolvedValue({ id: 'sec_new', pageId: 'page_1' });

    await POST(makePostRequest({ pageId: 'page_1', type: 'hero' }));

    expect(mockCacheDelete).toHaveBeenCalledWith('project:proj_abc');
  });

  it('returns 500 when service throws', async () => {
    mockFindUnique.mockRejectedValue(new Error('Database error'));

    const response = await POST(makePostRequest({
      pageId: 'page_1',
      type: 'hero',
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
