// =============================================================================
// Rate Limiting E2E Tests
// =============================================================================
// Verifies that rate-limited routes expose the standard X-RateLimit-* header
// set and that the anonymous tier actually throttles sustained bursts. Targets
// public routes (templates, flags/check) so no auth is required.
// =============================================================================

import { test, expect } from '@playwright/test';
import { createClient } from 'redis';

/**
 * The burst test intentionally exhausts the anonymous window; sweep the
 * rate-limit keys afterwards so later tests are not throttled.
 */
async function sweepRateLimitKeys(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) return;
  const client = createClient({ url });
  try {
    await client.connect();
    const keys: string[] = [];
    for await (const key of client.scanIterator({ MATCH: 'ratelimit:*' })) {
      keys.push(key);
    }
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch {
    // Redis may be unavailable — nothing to sweep.
  } finally {
    await client.quit().catch(() => undefined);
  }
}

test.describe('Rate limit headers', () => {
  test('templates (anonymous tier) emits X-RateLimit-Limit / Remaining / Reset', async ({ request }) => {
    const response = await request.get('/api/templates');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBeTruthy();
    expect(Number(headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    expect(headers['x-ratelimit-remaining']).toBeDefined();
    expect(Number(headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
    expect(headers['x-ratelimit-reset']).toBeDefined();
    expect(Number(headers['x-ratelimit-reset'])).toBeGreaterThan(0);
  });

  test('Remaining counter decreases across sequential requests', async ({ request }) => {
    const first = await request.get('/api/templates');
    const second = await request.get('/api/templates');

    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);

    const firstRemaining = Number(first.headers()['x-ratelimit-remaining']);
    const secondRemaining = Number(second.headers()['x-ratelimit-remaining']);
    // The second request should have a strictly lower (or equal after reset)
    // remaining count than the first.
    expect(secondRemaining).toBeLessThanOrEqual(firstRemaining);
  });
});

test.describe('Anonymous tier throttling', () => {
  test.afterEach(async () => {
    await sweepRateLimitKeys();
  });
  // The anonymous tier is configured to a finite per-minute cap. We fire a
  // burst well above it and assert that we eventually receive a 429 with a
  // Retry-After header. This guards against regressions where a route loses
  // its withRateLimit wrapper or the limiter silently no-ops.
  //
  // We use a generous upper bound of requests so the test is robust to the
  // exact tier config without hard-coding it.
  test('sustained burst eventually returns 429 with Retry-After', async ({ request }) => {
    const MAX_ATTEMPTS = 200;
    let saw429 = false;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const response = await request.get('/api/templates');
      const status = response.status();

      if (status === 429) {
        saw429 = true;
        const retryAfter = response.headers()['retry-after'];
        expect(retryAfter).toBeDefined();
        expect(Number(retryAfter)).toBeGreaterThan(0);

        const body = await response.json().catch(() => null);
        expect(body?.success).toBe(false);
        expect(body?.error?.code).toBe('RATE_LIMIT_EXCEEDED');
        break;
      }

      // A 200 keeps the burst going; anything else (5xx) means the server is
      // broken and we should stop rather than loop pointlessly.
      expect([200]).toContain(status);
    }

    expect(saw429).toBe(true);
  });
});
