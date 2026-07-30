// =============================================================================
// GET /api/templates — Route Handler Tests
// =============================================================================
// Tests listing templates with optional filters (industry, search, featured).
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

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

// Mock template data with known values for filtering tests
vi.mock('@/features/templates/data/template-data', () => ({
  TEMPLATE_DATA: [
    {
      id: 'restaurant-modern',
      name: 'Modern Restaurant',
      description: 'Elegant restaurant template',
      industry: 'restaurant',
      thumbnail: '/templates/restaurant-modern.svg',
      previewUrl: '/preview/restaurant-modern',
      pages: ['home', 'menu'],
      theme: 'luxury',
      tags: ['restaurant', 'food', 'dining'],
      featured: true,
      usageCount: 1250,
    },
    {
      id: 'tech-startup',
      name: 'Tech Startup',
      description: 'Clean template for SaaS companies',
      industry: 'technology',
      thumbnail: '/templates/tech-startup.svg',
      previewUrl: '/preview/tech-startup',
      pages: ['home', 'features'],
      theme: 'modern',
      tags: ['tech', 'saas', 'startup'],
      featured: false,
      usageCount: 800,
    },
    {
      id: 'restaurant-casual',
      name: 'Casual Dining',
      description: 'Relaxed restaurant layout',
      industry: 'restaurant',
      thumbnail: '/templates/restaurant-casual.svg',
      previewUrl: '/preview/restaurant-casual',
      pages: ['home', 'menu'],
      theme: 'warm',
      tags: ['restaurant', 'casual'],
      featured: true,
      usageCount: 500,
    },
  ],
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET } from '@/app/api/templates/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/templates');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(new Request(url.toString(), { method: 'GET' }));
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/templates', () => {
  it('returns all templates when no filters are provided', async () => {
    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3);
  });

  it('filters by industry', async () => {
    const response = await GET(makeGetRequest({ industry: 'restaurant' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data.every((t: { industry: string }) => t.industry === 'restaurant')).toBe(true);
  });

  it('filters by search term (matches name)', async () => {
    const response = await GET(makeGetRequest({ search: 'Tech' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].id).toBe('tech-startup');
  });

  it('filters by search term (matches tag)', async () => {
    const response = await GET(makeGetRequest({ search: 'saas' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].id).toBe('tech-startup');
  });

  it('filters by featured flag', async () => {
    const response = await GET(makeGetRequest({ featured: 'true' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data.every((t: { featured: boolean }) => t.featured === true)).toBe(true);
  });

  it('returns empty array when no templates match filters', async () => {
    const response = await GET(makeGetRequest({ industry: 'nonexistent' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
  });

  it('combines multiple filters correctly', async () => {
    const response = await GET(makeGetRequest({ industry: 'restaurant', featured: 'true' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data.every(
      (t: { industry: string; featured: boolean }) => t.industry === 'restaurant' && t.featured === true
    )).toBe(true);
  });
});
