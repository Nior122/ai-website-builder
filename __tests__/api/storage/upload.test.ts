// =============================================================================
// POST /api/storage/upload — Route Handler Tests
// =============================================================================
// Tests presigned URL generation for file uploads.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockGetPresignedUploadUrl = vi.fn();
const mockProjectAssetKey = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/s3/client', () => ({
  getPresignedUploadUrl: (...args: unknown[]) => mockGetPresignedUploadUrl(...args),
  projectAssetKey: (...args: unknown[]) => mockProjectAssetKey(...args),
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

import { POST } from '@/app/api/storage/upload/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/storage/upload', {
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
  mockProjectAssetKey.mockReturnValue('uploads/proj_abc/1234567890-photo.jpg');
  mockGetPresignedUploadUrl.mockResolvedValue('https://s3.example.com/upload?signed=true');
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/storage/upload', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns error when body is invalid (missing required fields)', async () => {
    const response = await POST(makePostRequest({}));
    const data = await response.json();

    // ZodError → ValidationError.fromZodError() returns 400
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('rejects disallowed file type', async () => {
    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      filename: 'script.exe',
      contentType: 'application/x-executable',
    }));
    const data = await response.json();

    // badRequest() returns 400 directly
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns presigned URL on success', async () => {
    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.uploadUrl).toBe('https://s3.example.com/upload?signed=true');
    expect(data.data.key).toBe('uploads/proj_abc/1234567890-photo.jpg');
    expect(data.data.expiresIn).toBe(3600);
    expect(mockProjectAssetKey).toHaveBeenCalledWith(
      'proj_abc',
      expect.stringContaining('photo.jpg'),
      'uploads'
    );
    expect(mockGetPresignedUploadUrl).toHaveBeenCalledWith(
      'uploads/proj_abc/1234567890-photo.jpg',
      'image/jpeg',
      3600
    );
  });

  it('accepts image/png content type', async () => {
    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      filename: 'logo.png',
      contentType: 'image/png',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('accepts image/webp content type', async () => {
    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      filename: 'banner.webp',
      contentType: 'image/webp',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('accepts image/svg+xml content type', async () => {
    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      filename: 'icon.svg',
      contentType: 'image/svg+xml',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 500 when S3 service throws', async () => {
    mockGetPresignedUploadUrl.mockRejectedValue(new Error('S3 connection failed'));

    const response = await POST(makePostRequest({
      projectId: 'proj_abc',
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
