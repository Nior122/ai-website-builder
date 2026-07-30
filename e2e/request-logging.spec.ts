// =============================================================================
// Request Logging E2E Tests
// =============================================================================
// Verifies that routes wrapped with withRequestLogging attach an
// X-Request-Id response header and return well-formed responses. Targets
// public routes that don't require authentication so the suite runs without
// mocked Clerk sessions.
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('X-Request-Id header', () => {
  test('templates route returns a unique X-Request-Id per request', async ({ request }) => {
    const first = await request.get('/api/templates');
    expect(first.status()).toBe(200);

    const firstId = first.headers()['x-request-id'];
    expect(firstId).toBeTruthy();
    expect(firstId).toMatch(/^req_[a-f0-9]+$/);

    const second = await request.get('/api/templates');
    const secondId = second.headers()['x-request-id'];
    expect(secondId).toBeTruthy();
    // Each request gets its own id — never reused
    expect(secondId).not.toBe(firstId);
  });

  test('health route also carries an X-Request-Id', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const requestId = response.headers()['x-request-id'];
    expect(requestId).toBeTruthy();
    expect(requestId).toMatch(/^req_[a-f0-9]+$/);
  });

  test('X-Request-Id is present even on error responses', async ({ request }) => {
    // unauthorized endpoint — still wrapped with request logging
    const response = await request.get('/api/notifications');
    expect([401, 403]).toContain(response.status());
    const requestId = response.headers()['x-request-id'];
    expect(requestId).toMatch(/^req_[a-f0-9]+$/);
  });
});

test.describe('Request logging does not corrupt response bodies', () => {
  test('templates list returns success envelope with array data', async ({ request }) => {
    const response = await request.get('/api/templates');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('templates filtering by featured returns only featured templates', async ({ request }) => {
    const response = await request.get('/api/templates?featured=true');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      expect(body.data.every((t: { featured?: boolean }) => t.featured === true)).toBe(true);
    }
  });
});
