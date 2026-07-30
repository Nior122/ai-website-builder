// =============================================================================
// GET + POST /api/deploy — Route Handler Tests
// =============================================================================
// Tests deployment history retrieval and project deployment creation.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockDeployProject = vi.fn();
const mockGetProjectDeployments = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/features/deployment/services/deployment.service', () => ({
  deployProject: (...args: unknown[]) => mockDeployProject(...args),
  getProjectDeployments: (...args: unknown[]) => mockGetProjectDeployments(...args),
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

import { GET, POST } from '@/app/api/deploy/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/deploy');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/deploy', {
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

// ─── GET Tests ─────────────────────────────────────────────────────────

describe('GET /api/deploy', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeGetRequest({ projectId: 'proj_abc' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 when projectId is missing', async () => {
    const response = await GET(makeGetRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns deployments on success', async () => {
    const deployments = [
      { id: 'dep_1', status: 'success', platform: 'vercel' },
      { id: 'dep_2', status: 'pending', platform: 'netlify' },
    ];
    mockGetProjectDeployments.mockResolvedValue(deployments);

    const response = await GET(makeGetRequest({ projectId: 'proj_abc' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deployments).toEqual(deployments);
    expect(mockGetProjectDeployments).toHaveBeenCalledWith('proj_abc', 'user_123');
  });

  it('returns 500 when service throws', async () => {
    mockGetProjectDeployments.mockRejectedValue(new Error('Database error'));

    const response = await GET(makeGetRequest({ projectId: 'proj_abc' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

// ─── POST Tests ────────────────────────────────────────────────────────

describe('POST /api/deploy', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      platform: 'vercel',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns 400 when body is invalid', async () => {
    const response = await POST(makePostRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('deploys project and returns 200', async () => {
    const result = {
      deploymentId: 'dep_new',
      url: 'https://project.vercel.app',
      status: 'success',
    };
    mockDeployProject.mockResolvedValue(result);

    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      platform: 'vercel',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deploymentId).toBe('dep_new');
    expect(data.data.url).toBe('https://project.vercel.app');
    expect(mockDeployProject).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_abc',
        platform: 'vercel',
        userId: 'user_123',
      })
    );
  });

  it('passes optional config fields', async () => {
    mockDeployProject.mockResolvedValue({ deploymentId: 'dep_1', url: 'https://custom.dev', status: 'success' });

    await POST(makePostRequest({
      projectId: 'proj_abc',
      platform: 'netlify',
      customDomain: 'myapp.com',
      branch: 'main',
      environment: 'production',
    }));

    expect(mockDeployProject).toHaveBeenCalledWith(
      expect.objectContaining({
        customDomain: 'myapp.com',
        branch: 'main',
        environment: 'production',
      })
    );
  });

  it('returns 500 when deployment service throws', async () => {
    mockDeployProject.mockRejectedValue(new Error('Vercel API rate limit'));

    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      platform: 'vercel',
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
