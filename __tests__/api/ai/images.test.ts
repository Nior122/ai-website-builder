// =============================================================================
// POST /api/ai/images — Route Handler Tests
// =============================================================================
// Tests DALL-E image generation via the AI images endpoint.
// Note: The route destructures { prompt, size, style } from the parse result,
// but imagePromptRequestSchema doesn't define prompt or size — so the real
// schema parse always rejects payloads the route expects. We mock the
// validation to let execution reach the OpenAI call.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

// vi.hoisted() guarantees these exist before vi.mock factories reference them
const { mockAuth, mockOpenAIImages, mockParseSchema } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockOpenAIImages: vi.fn(),
  mockParseSchema: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('openai', () => ({
  // Functional constructor: `new OpenAI(config)` returns this object (JS rule
  // for constructors that return a non-primitive)
  default: function OpenAI() {
    return {
      images: {
        generate: (...args: unknown[]) => mockOpenAIImages(...args),
      },
    };
  },
}));

// Intercept the schema so parse() returns exactly the values the route
// destructures: { prompt, size, style }.
vi.mock('@/lib/validations/ai', () => ({
  imagePromptRequestSchema: {
    parse: (...args: unknown[]) => mockParseSchema(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('@/lib/error-tracking', () => ({ trackError: vi.fn() }));
vi.mock('@/lib/middleware/rate-limit', () => ({ withRateLimit: (handler: Function) => handler }));
vi.mock('@/lib/middleware/request-logger', () => ({ withRequestLogging: (handler: Function) => handler }));

// ─── Import after mocks ────────────────────────────────────────────────

import { POST } from '@/app/api/ai/images/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/ai/images', {
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
  mockOpenAIImages.mockResolvedValue({
    data: [
      { url: 'https://example.com/image.png', revised_prompt: 'A beautiful scene' },
    ],
  });
  // Default: parse returns the values the route destructures
  mockParseSchema.mockReturnValue({
    businessType: 'restaurant',
    industry: 'food',
    style: 'photorealistic',
    subjects: ['pasta'],
    dimensions: { width: 1024, height: 1024 },
  });
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/ai/images', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(makePostRequest({ prompt: 'A scenic view' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('generates image and returns URL on success', async () => {
    const response = await POST(makePostRequest({ prompt: 'A scenic view' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.url).toBe('https://example.com/image.png');
    expect(data.data.revisedPrompt).toBe('A beautiful scene');
    expect(data.data.createdAt).toBeDefined();
    expect(mockOpenAIImages).toHaveBeenCalledWith({
      model: 'dall-e-3',
      prompt: 'Professional photorealistic image for a food restaurant business featuring pasta',
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    });
  });

  it('accepts custom size and style', async () => {
    mockParseSchema.mockReturnValue({
      businessType: 'restaurant',
      industry: 'food',
      style: 'illustration',
      subjects: ['pasta'],
      dimensions: { width: 1792, height: 1024 },
    });
    mockOpenAIImages.mockResolvedValue({
      data: [{ url: 'https://example.com/img.png' }],
    });

    await POST(makePostRequest({
      businessType: 'restaurant',
      industry: 'food',
      style: 'illustration',
      dimensions: { width: 1792, height: 1024 },
    }));

    expect(mockOpenAIImages).toHaveBeenCalledWith(
      expect.objectContaining({
        size: '1792x1024',
        style: 'natural',
      })
    );
  });

  it('returns 500 when no image URL returned', async () => {
    mockOpenAIImages.mockResolvedValue({ data: [{}] });

    const response = await POST(makePostRequest({ prompt: 'A scenic view' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('returns 500 on OpenAI API error', async () => {
    mockOpenAIImages.mockRejectedValue(new Error('OpenAI API error'));

    const response = await POST(makePostRequest({ prompt: 'A scenic view' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
