// =============================================================================
// POST /api/projects/[id]/export — Route Handler Tests
// =============================================================================
// Tests project export in various formats.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockGetProjectById = vi.fn();
const mockGenerateExport = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/projects/services/project.service', () => ({
  getProjectById: (...args: unknown[]) => mockGetProjectById(...args),
}));

vi.mock('@/features/export/services/export.service', () => ({
  generateExport: (...args: unknown[]) => mockGenerateExport(...args),
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

import { POST } from '@/app/api/projects/[id]/export/route';

// ─── Helpers ───────────────────────────────────────────────────────────

const PROJ_PARAMS = { params: Promise.resolve({ id: 'proj_abc' }) };

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/projects/proj_abc/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

const sampleProject = {
  id: 'proj_abc',
  ownerId: 'user_123',
  name: 'Test Project',
  pages: [],
};

const sampleFiles = [
  { path: 'index.html', content: '<html><body>Home</body></html>' },
  { path: 'about.html', content: '<html><body>About</body></html>' },
];

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
  mockGetProjectById.mockResolvedValue(sampleProject);
  mockGenerateExport.mockResolvedValue(sampleFiles);
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/projects/[id]/export', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({ format: 'html' }), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('exports project as HTML and returns 200', async () => {
    const response = await POST(makePostRequest({ format: 'html', options: {} }), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.format).toBe('html');
    expect(data.data.files).toEqual(sampleFiles);
    expect(data.data.fileSize).toBe(
      sampleFiles.reduce((acc, f) => acc + f.content.length, 0)
    );
    expect(data.data.id).toMatch(/^exp_/);
    expect(mockGetProjectById).toHaveBeenCalledWith('proj_abc', 'user_123');
    expect(mockGenerateExport).toHaveBeenCalledWith(sampleProject, 'html');
  });

  it('exports project as Next.js format', async () => {
    const response = await POST(makePostRequest({ format: 'nextjs', options: {} }), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.format).toBe('nextjs');
    expect(mockGenerateExport).toHaveBeenCalledWith(sampleProject, 'nextjs');
  });

  it('returns 404 when project does not exist', async () => {
    const { NotFoundError } = await import('@/lib/errors');
    mockGetProjectById.mockRejectedValue(new NotFoundError('Project not found'));

    const response = await POST(makePostRequest({ format: 'html' }), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 400 on invalid export config (missing format)', async () => {
    // Missing format field — ZodError → ValidationError.fromZodError() returns 400
    const response = await POST(makePostRequest({}), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 500 when export service throws', async () => {
    mockGenerateExport.mockRejectedValue(new Error('Export failed'));

    const response = await POST(makePostRequest({ format: 'html', options: {} }), PROJ_PARAMS);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
