// =============================================================================
// Request Validation Middleware Tests
// =============================================================================
// Unit tests for the withValidation HOF wrapper.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  createRequestLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { withValidation } from '@/lib/middleware/validate';

// ─── Schemas ────────────────────────────────────────────────────────────

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const paramsSchema = z.object({
  id: z.string().min(1),
});

// ─── Helpers ────────────────────────────────────────────────────────────

function makeRequest(path = '/api/test', options?: RequestInit): NextRequest {
  return new NextRequest(new Request(`http://localhost${path}`, options));
}

function makePostRequest(path: string, body: unknown): NextRequest {
  return makeRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(path: string): NextRequest {
  return makeRequest(path);
}

const okHandler = async (
  _req: NextRequest,
  ctx?: { body: unknown; query: unknown; params: Record<string, string> }
) => {
  return NextResponse.json({ ok: true, body: ctx?.body, query: ctx?.query, params: ctx?.params });
};

// ─── Tests ──────────────────────────────────────────────────────────────

describe('withValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Body validation ─────────────────────────────────────────────────

  it('passes validated body to handler', async () => {
    const wrapped = withValidation(okHandler, { body: bodySchema });
    const response = await wrapped(makePostRequest('/api/test', { name: 'Alice', email: 'alice@test.com' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.body.name).toBe('Alice');
    expect(data.body.email).toBe('alice@test.com');
  });

  it('returns 400 with validation details on invalid body', async () => {
    const wrapped = withValidation(okHandler, { body: bodySchema });
    const response = await wrapped(makePostRequest('/api/test', { name: '', email: 'not-an-email' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
    expect(Object.keys(data.error.details).length).toBeGreaterThan(0);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const wrapped = withValidation(okHandler, { body: bodySchema });
    const req = new NextRequest(
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
    );

    // This will throw a syntax error when parsing JSON
    const response = await wrapped(req);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('applies defaults from Zod schema', async () => {
    const wrapped = withValidation(okHandler, { body: bodySchema });
    const response = await wrapped(makePostRequest('/api/test', { name: 'Bob', email: 'bob@test.com' }));
    const data = await response.json();

    // age is optional, should not be present if not provided
    expect(data.body.age).toBeUndefined();
  });

  // ── Query validation ────────────────────────────────────────────────

  it('passes validated query params to handler', async () => {
    const wrapped = withValidation(okHandler, { query: querySchema });
    const response = await wrapped(makeGetRequest('/api/test?page=2&limit=10'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query.page).toBe(2);
    expect(data.query.limit).toBe(10);
  });

  it('applies defaults for missing query params', async () => {
    const wrapped = withValidation(okHandler, { query: querySchema });
    const response = await wrapped(makeGetRequest('/api/test'));
    const data = await response.json();

    expect(data.query.page).toBe(1);
    expect(data.query.limit).toBe(20);
  });

  it('returns 400 for invalid query params', async () => {
    const wrapped = withValidation(okHandler, { query: querySchema });
    const response = await wrapped(makeGetRequest('/api/test?page=-1'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  // ── Combined validation ─────────────────────────────────────────────

  it('validates both body and query simultaneously', async () => {
    const schema = z.object({ value: z.string() });
    const qSchema = z.object({ lang: z.string().default('en') });

    const wrapped = withValidation(okHandler, { body: schema, query: qSchema });
    const response = await wrapped(
      makePostRequest('/api/test?lang=fr', { value: 'hello' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.body.value).toBe('hello');
    expect(data.query.lang).toBe('fr');
  });

  // ── Error handling ──────────────────────────────────────────────────

  it('propagates non-Zod errors from handler', async () => {
    const failingHandler = async () => {
      throw new Error('Database connection failed');
    };

    const wrapped = withValidation(failingHandler as any, { body: bodySchema });
    await expect(
      wrapped(makePostRequest('/api/test', { name: 'test', email: 'test@test.com' }))
    ).rejects.toThrow('Database connection failed');
  });

  it('returns structured error with field-level details', async () => {
    const wrapped = withValidation(okHandler, { body: bodySchema });
    const response = await wrapped(makePostRequest('/api/test', {}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.details).toHaveProperty('name');
    expect(data.error.details).toHaveProperty('email');
    expect(Array.isArray(data.error.details.name)).toBe(true);
    expect(Array.isArray(data.error.details.email)).toBe(true);
  });
});
