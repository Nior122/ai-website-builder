// =============================================================================
// Environment Validation Tests
// =============================================================================
// Unit tests for the Zod-based env validation schema.
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock logger to avoid noise ──────────────────────────────────────────

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

// ─── Save original env ───────────────────────────────────────────────────

const originalEnv = { ...process.env };

beforeEach(() => {
  // Reset the cached env by re-importing
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// ─── Tests ───────────────────────────────────────────────────────────────

describe('getServerEnv', () => {
  const REQUIRED_VARS = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_abc',
    CLERK_SECRET_KEY: 'sk_test_abc',
    CLERK_WEBHOOK_SECRET: 'whsec_abc',
    ANTHROPIC_API_KEY: 'sk-ant-abc',
    STRIPE_SECRET_KEY: 'sk_test_abc',
    STRIPE_WEBHOOK_SECRET: 'whsec_abc',
  };

  it('returns validated env when all required vars are set', async () => {
    process.env = { ...originalEnv, ...REQUIRED_VARS };

    const { getServerEnv } = await import('@/lib/env');
    const env = getServerEnv();

    expect(env.DATABASE_URL).toBe(REQUIRED_VARS.DATABASE_URL);
    expect(env.REDIS_URL).toBe(REQUIRED_VARS.REDIS_URL);
    expect(env.ANTHROPIC_API_KEY).toBe(REQUIRED_VARS.ANTHROPIC_API_KEY);
    expect(env.NODE_ENV).toBeDefined();
  });

  it('throws when required vars are missing', async () => {
    process.env = { ...originalEnv };
    // Remove all required vars
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.ANTHROPIC_API_KEY;

    const { getServerEnv } = await import('@/lib/env');
    expect(() => getServerEnv()).toThrow('Invalid environment variables');
  });

  it('caches result after first call', async () => {
    process.env = { ...originalEnv, ...REQUIRED_VARS };

    const { getServerEnv } = await import('@/lib/env');
    const first = getServerEnv();
    const second = getServerEnv();

    // Same reference — cached
    expect(first).toBe(second);
  });

  it('applies defaults for optional vars', async () => {
    process.env = { ...originalEnv, ...REQUIRED_VARS };
    delete process.env.S3_REGION;

    const { getServerEnv } = await import('@/lib/env');
    const env = getServerEnv();

    expect(env.S3_REGION).toBe('us-east-1');
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('rejects invalid DATABASE_URL format', async () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED_VARS,
      DATABASE_URL: 'not-a-url',
    };

    const { getServerEnv } = await import('@/lib/env');
    expect(() => getServerEnv()).toThrow('Invalid environment variables');
  });
});

describe('getClientEnv', () => {
  it('returns client env vars with defaults', async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_abc',
    };

    const { getClientEnv } = await import('@/lib/env');
    const env = getClientEnv();

    expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe('pk_test_abc');
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('does not throw on missing client vars (warns instead)', async () => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    const { getClientEnv } = await import('@/lib/env');
    // Should not throw
    expect(() => getClientEnv()).not.toThrow();
  });
});
