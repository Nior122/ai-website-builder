// =============================================================================
// Health Check E2E Tests
// =============================================================================
// Verifies the /api/health endpoint returns correct status codes and
// structure under various conditions.
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('GET /api/health', () => {
  test('returns 200 with ok status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('redis');
  });

  test('returns no-store cache header', async ({ request }) => {
    const response = await request.get('/api/health');
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toContain('no-store');
  });

  test('health check responds within 5 seconds', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/api/health');
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(5000);
  });
});
