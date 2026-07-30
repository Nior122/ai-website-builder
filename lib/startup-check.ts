// =============================================================================
// Startup Environment Check
// =============================================================================
// Runs once at server bootstrap (via instrumentation.ts -> register()) and on
// demand via runStartupCheck(). Validates that required environment variables
// are present and well-formed BEFORE the app accepts traffic, and reports a
// human-readable summary to the log.
//
// Design rules:
//   - NEVER print, log, or expose secret values. Only presence + shape checks.
//   - Hard-fail (throw) only in production for missing required vars. In
//     development, log warnings so the dev server still boots for iteration.
//   - Side-effect-free: read-only over process.env.
// =============================================================================

import { logger } from '@/lib/logger';

export interface StartupCheckResult {
  ok: boolean;
  required: { key: string; status: 'present' | 'missing' | 'invalid'; detail?: string }[];
  optional: { key: string; status: 'present' | 'missing'; detail?: string }[];
  warnings: string[];
  errors: string[];
}

// Keys whose values are secrets -- we must never echo them. We only ever report
// a truncated prefix (first 6 chars) to help confirm the *right* var loaded.
const SECRET_KEYS = new Set([
  'OPENROUTER_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'S3_SECRET_KEY',
]);

function mask(value: string): string {
  if (!value) return '(empty)';
  // Show first 6 chars only -- enough to confirm which value loaded, never enough
  // to use the secret.
  const prefix = value.slice(0, 6);
  return `${prefix}...(${value.length} chars)`;
}

/**
 * Inspect process.env and return a structured startup-check result.
 * Does not throw -- classification is left to the caller.
 */
export function inspectEnv(env: Record<string, string | undefined> = process.env): StartupCheckResult {
  const required: StartupCheckResult['required'] = [];
  const optional: StartupCheckResult['optional'] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // --- Required for the app to function at all -----------------------------
  const requiredKeys: { key: string; validate?: (v: string) => string | null }[] = [
    { key: 'DATABASE_URL', validate: (v) => (v.startsWith('postgresql://') ? null : 'must start with postgresql://') },
    { key: 'REDIS_URL', validate: (v) => (v.startsWith('redis://') || v.startsWith('rediss://') ? null : 'must start with redis:// or rediss://') },
    { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', validate: (v) => (v.startsWith('pk_') ? null : 'must start with pk_') },
    { key: 'CLERK_SECRET_KEY', validate: (v) => (v.startsWith('sk_') ? null : 'must start with sk_') },
  ];

  for (const { key, validate } of requiredKeys) {
    const raw = (env[key] ?? '').trim();
    if (!raw) {
      required.push({ key, status: 'missing' });
      errors.push(`Required environment variable ${key} is missing.`);
      continue;
    }
    const detail = validate?.(raw);
    if (detail) {
      required.push({ key, status: 'invalid', detail });
      errors.push(`Required environment variable ${key} is invalid: ${detail}`);
    } else {
      required.push({ key, status: 'present', detail: SECRET_KEYS.has(key) ? mask(raw) : undefined });
    }
  }

  // --- AI provider config -- at least one key required; OpenRouter preferred ---
  // Strip surrounding quotes that may have leaked from .env.local parsing.
  const stripQ = (s: string) => s.replace(/^["']|["']$/g, '').trim();
  const openrouterKey = stripQ(env.OPENROUTER_API_KEY ?? '');
  const anthropicKey = stripQ(env.ANTHROPIC_API_KEY ?? '');
  const openaiKey = stripQ(env.OPENAI_API_KEY ?? '');
  const provider = (env.AI_PROVIDER ?? 'openrouter').trim();

  const hasAnyAIKey = Boolean(openrouterKey || anthropicKey || openaiKey);
  if (!hasAnyAIKey) {
    errors.push(
      'No AI provider API key configured. AI generation will fail. Set OPENROUTER_API_KEY (preferred), ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env.local.'
    );
  } else {
    // Validate the OpenRouter key shape if it's the configured/primary provider.
    if (provider === 'openrouter' && openrouterKey && !openrouterKey.startsWith('sk-or-')) {
      warnings.push(
        `OPENROUTER_API_KEY does not start with "sk-or-" (prefix=${openrouterKey.slice(0, 6)}). The key may be malformed or a different provider's key was placed here.`
      );
    }
    if (provider === 'openrouter' && !openrouterKey && anthropicKey) {
      warnings.push(
        'AI_PROVIDER=openrouter but OPENROUTER_API_KEY is missing -- falling back to ANTHROPIC_API_KEY. This will likely fail against the OpenRouter endpoint unless ANTHROPIC_API_KEY is itself an OpenRouter key.'
      );
    }
    // Internal whitespace in the RAW (untrimmed) value is a classic 401 cause.
    // Test whichever key(s) are actually present, against the untrimmed raw env.
    const keysToCheckForWhitespace = [
      ['OPENROUTER_API_KEY', openrouterKey],
      ['ANTHROPIC_API_KEY', anthropicKey],
      ['OPENAI_API_KEY', openaiKey],
    ] as const;
    for (const [keyName, trimmedVal] of keysToCheckForWhitespace) {
      if (trimmedVal && env[keyName] !== trimmedVal) {
        warnings.push(
          `${keyName} contains leading/trailing whitespace -- this commonly causes HTTP 401 "Invalid API key". Remove any spaces/tabs from the key value in .env.local.`
        );
      }
    }
  }

  const aiModel = ((env as any).OPENROUTER_MODEL || env.AI_MODEL || '').trim();
  warnings.push(`AI provider configured: ${provider}, model: ${aiModel}`);

  // --- Optional integrations -----------------------------------------------
  const optionalKeys = ['STRIPE_SECRET_KEY', 'S3_ENDPOINT', 'NEXT_PUBLIC_APP_URL'];
  for (const key of optionalKeys) {
    const raw = (env[key] ?? '').trim();
    optional.push({ key, status: raw ? 'present' : 'missing' });
  }

  return {
    ok: errors.length === 0,
    required,
    optional,
    warnings,
    errors,
  };
}

/**
 * Run the startup check and log the result. In production, throw on missing
 * required config so the process fails fast. In development, only warn.
 */
export function runStartupCheck(): StartupCheckResult {
  const result = inspectEnv();

  logger.info('Startup environment check', {
    ok: result.ok,
    required: result.required.map((r) => ({ key: r.key, status: r.status, detail: r.detail })),
    optional: result.optional,
  });

  for (const w of result.warnings) logger.warn(`Startup check: ${w}`);
  for (const e of result.errors) logger.error(`Startup check: ${e}`);

  if (!result.ok && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Startup environment check failed -- refusing to accept requests:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  return result;
}

let _ran = false;
/**
 * Idempotent wrapper -- safe to call from multiple entry points. Runs once.
 */
export function ensureStartupCheck(): StartupCheckResult {
  if (_ran) {
    // Return a cheap re-run without re-logging the full report.
    return inspectEnv();
  }
  _ran = true;
  return runStartupCheck();
}