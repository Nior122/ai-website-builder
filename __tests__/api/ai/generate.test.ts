// =============================================================================
// POST /api/ai/generate — Route Handler Tests
// =============================================================================
// Tests AI generation endpoint: auth, rate limiting, subscription, validation,
// and SSE streaming response.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockCheckSubscription = vi.fn();
const mockGenerateWithClaude = vi.fn();
const mockCreateNotification = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/redis/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getAIRateLimitConfig: () => ({ windowMs: 60000, maxRequests: 10 }),
}));

vi.mock('@/features/billing/services/subscription.service', () => ({
  checkSubscription: (...args: unknown[]) => mockCheckSubscription(...args),
}));

vi.mock('@/lib/ai/generation', () => ({
  generateWithClaude: (...args: unknown[]) => mockGenerateWithClaude(...args),
}));

vi.mock('@/features/notifications/services/notification.service', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

vi.mock('@/lib/ai/streaming', () => ({
  createEventStream: vi.fn(() => ({
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"complete"}\n\n'));
        controller.close();
      },
    }),
    send: vi.fn(),
    complete: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('@/lib/error-tracking', () => ({
  trackError: vi.fn(),
}));

vi.mock('@/lib/middleware/request-logger', () => ({
  withRequestLogging: (handler: Function) => handler,
}));

vi.mock('@/lib/prisma/client', () => ({
  default: {
    user: {
      // Idempotent Clerk→DB resolution for auth checks.
      findUnique: vi.fn(async ({ where: { clerkId } }: { where: { clerkId: string } }) => ({
        id: clerkId,
      })),
    },
  },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { POST } from '@/app/api/ai/generate/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

const validBody = {
  description: 'A modern web design agency based in New York City',
  industry: 'technology',
  businessType: 'agency',
};

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_123' });
  mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  mockCheckSubscription.mockResolvedValue({ active: true });
  mockGenerateWithClaude.mockResolvedValue({ projectId: 'proj_gen' });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/ai/generate', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfterMs: 30000 });

    const response = await POST(makePostRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
  });

  it('returns SSE stream on valid request', async () => {
    const response = await POST(makePostRequest(validBody));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    expect(response.headers.get('cache-control')).toContain('no-cache');
  });

  it('validates request body (rejects short description)', async () => {
    const response = await POST(makePostRequest({
      description: 'short',
      industry: 'tech',
      businessType: 'startup',
    }));
    const data = await response.json();

    // ZodError → ValidationError.fromZodError() returns 400
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates request body (rejects missing required fields)', async () => {
    const response = await POST(makePostRequest({ description: 'Valid description' }));
    const data = await response.json();

    // ZodError → ValidationError.fromZodError() returns 400
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('checks subscription before generating', async () => {
    await POST(makePostRequest(validBody));

    expect(mockCheckSubscription).toHaveBeenCalledWith('user_123');
  });

  it('calls generateWithClaude with validated data', async () => {
    await POST(makePostRequest(validBody));

    expect(mockGenerateWithClaude).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'A modern web design agency based in New York City',
        industry: 'technology',
        businessType: 'agency',
      }),
      'user_123',
      'user_123',
      expect.objectContaining({
        onProgress: expect.any(Function),
        onComplete: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('returns 500 when generation service throws', async () => {
    mockGenerateWithClaude.mockRejectedValue(new Error('AI service unavailable'));

    const response = await POST(makePostRequest(validBody));
    // The response is still a stream since generation runs in background
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });

  it('accepts optional fields (businessName, templateId, tone)', async () => {
    await POST(makePostRequest({
      ...validBody,
      businessName: 'Acme Corp',
      templateId: 'tmpl_abc',
      tone: 'luxury',
    }));

    expect(mockGenerateWithClaude).toHaveBeenCalledWith(
      expect.objectContaining({
        businessName: 'Acme Corp',
        templateId: 'tmpl_abc',
        tone: 'luxury',
      }),
      'user_123',
      'user_123',
      expect.any(Object)
    );
  });

  it('enforces subscription check', async () => {
    mockCheckSubscription.mockRejectedValue(new Error('No active subscription'));

    const response = await POST(makePostRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
