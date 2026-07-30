// =============================================================================
// Environment Variable Validation
// =============================================================================
// Validates all environment variables at startup using Zod. Import `env`
// anywhere you need guaranteed-safe env access. On invalid/missing vars the
// app throws immediately with a clear error message instead of failing at
// runtime with cryptic "undefined" errors.
//
// Server-only — never import from client components.
// =============================================================================

import { z } from 'zod';

// ─── Schema ──────────────────────────────────────────────────────────────

const serverSchema = z.object({
  // ── Database ──────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection string' }),

  // ── Redis ─────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid Redis connection string' }),

  // ── Auth (Clerk) ─────────────────────────────────────────────────────
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().min(1, 'CLERK_WEBHOOK_SECRET is required'),

  // ── AI ────────────────────────────────────────────────────────────────
  // At least one API key is required (OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY).
  // Validation that at least one is present happens in getServerEnv().
  //
  // Model configuration: use OPENROUTER_MODEL for OpenRouter, AI_MODEL as
  // backward-compat fallback. NEVER hardcode model IDs anywhere — every
  // AI request reads from this env configuration layer.
  OPENROUTER_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().optional(),
  AI_PROVIDER: z.enum(['openrouter', 'anthropic']).default('openrouter'),
  OPENROUTER_MODEL: z.string().default('openrouter/free'),
  OPENROUTER_FALLBACK_MODELS: z.string().default(''),
  AI_MODEL: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_TEMPERATURE: z.string().default('0.7'),
  AI_MAX_TOKENS: z.string().default('8192'),

  // ── App ───────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const serverOptionalSchema = z.object({
  // ── OpenAI (optional — image generation) ──────────────────────────────
  OPENAI_API_KEY: z.string().optional(),

  // ── Stripe (optional — billing) ──────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ── S3 / Object Storage ──────────────────────────────────────────────
  S3_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('ai-website-builder-assets'),
  S3_PUBLIC_URL: z.string().url().optional(),

  // ── Deployment Providers ─────────────────────────────────────────────
  VERCEL_TOKEN: z.string().optional(),
  NETLIFY_AUTH_TOKEN: z.string().optional(),

  // ── Stripe Price IDs ─────────────────────────────────────────────────
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_YEARLY_PRICE_ID: z.string().optional(),

  // ── App Config ────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  APP_HOSTNAME: z.string().optional(),
});

// Client-side env vars (NEXT_PUBLIC_*)
const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
  NEXT_PUBLIC_S3_BUCKET: z.string().optional(),
  NEXT_PUBLIC_S3_PUBLIC_URL: z.string().url().optional(),
});

// ─── Validation ──────────────────────────────────────────────────────────

type ServerEnv = z.infer<typeof serverSchema> & z.infer<typeof serverOptionalSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

let _serverEnv: ServerEnv | null = null;

/**
 * Validate and return server-side environment variables.
 * Throws a descriptive error on first call if validation fails.
 * Result is cached — subsequent calls return the cached value.
 */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const parsed = serverSchema.safeParse(process.env);
  const optional = serverOptionalSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    const missing = Object.entries(formatted)
      .filter(([, v]) => v && '_errors' in v && (v as { _errors: string[] })._errors.length > 0)
      .map(([key, v]) => `  ${key}: ${(v as { _errors: string[] })._errors.join(', ')}`)
      .join('\n');

    throw new Error(
      `❌ Invalid environment variables:\n${missing}\n\n` +
      `Check your .env.local file and ensure all required variables are set.`
    );
  }

  _serverEnv = {
    ...parsed.data,
    ...optional.data,
  } as ServerEnv;

  // Validate that at least one AI API key is present
  const hasAIKey =
    (_serverEnv as any).OPENROUTER_API_KEY ||
    (_serverEnv as any).ANTHROPIC_API_KEY ||
    (_serverEnv as any).OPENAI_API_KEY;
  if (!hasAIKey) {
    // Only throw in production — in development, allow missing keys for testing
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ At least one AI API key is required: OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.\n' +
        'If using OpenRouter, set OPENROUTER_API_KEY in your .env.local file.'
      );
    } else {
      console.warn(
        '⚠️  No AI API key configured. AI generation will fail until OPENROUTER_API_KEY or ANTHROPIC_API_KEY is set.'
      );
    }
  }

  return _serverEnv;
}

/**
 * Validate client-side environment variables.
 * Safe to import from client components.
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    NEXT_PUBLIC_S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET,
    NEXT_PUBLIC_S3_PUBLIC_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
  });

  if (!parsed.success) {
    console.warn('⚠️  Client env validation warnings:', parsed.error.flatten().fieldErrors);
  }

  return parsed.success ? parsed.data : {} as ClientEnv;
}

// ─── Convenience getters ─────────────────────────────────────────────────

/** Shorthand for accessing validated server env. */
export const env = new Proxy({} as ServerEnv, {
  get(_, key: string) {
    return getServerEnv()[key as keyof ServerEnv];
  },
});
