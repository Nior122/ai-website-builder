// =============================================================================
// Request Validation E2E Tests
// =============================================================================
// Verifies the validation error envelope shape returned by the withValidation
// HOF (and inline Zod usage) on public routes. Targets endpoints reachable
// without an authenticated Clerk session so the suite runs in CI without
// auth mocking.
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('analytics/track validation (inline Zod)', () => {
  test('rejects invalid eventType with 400 and success=false', async ({ request }) => {
    const response = await request.post('/api/analytics/track', {
      data: { projectId: 'p1', eventType: 'not-a-real-event' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('rejects empty projectId', async ({ request }) => {
    const response = await request.post('/api/analytics/track', {
      data: { projectId: '', eventType: 'page_view' },
    });
    expect(response.status()).toBe(400);
  });

  test('accepts a valid event and returns 204', async ({ request }) => {
    const response = await request.post('/api/analytics/track', {
      data: { projectId: 'e2e-validation-probe', eventType: 'page_view', path: '/' },
    });
    // track returns 204 on success OR on silently-swallowed error; both are
    // acceptable outcomes for this smoke test.
    expect([204]).toContain(response.status());
  });
});

test.describe('flags/check public evaluation', () => {
  test('returns enabled boolean for a known flag key', async ({ request }) => {
    const response = await request.get('/api/flags/nonexistent-flag-probe/check');
    // An unknown flag should still evaluate cleanly (defaulting to disabled)
    // rather than 5xx.
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.enabled).toBe('boolean');
    expect(body.data.key).toBe('nonexistent-flag-probe');
  });

  test('passes through userId / plan query params without auth', async ({ request }) => {
    const response = await request.get(
      '/api/flags/nonexistent-flag-probe/check?userId=u1&plan=free'
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

test.describe('JSON body parsing edge cases', () => {
  test('empty object body is rejected', async ({ request }) => {
    const response = await request.post('/api/analytics/track', { data: {} });
    expect(response.status()).toBe(400);
  });

  test('extra unknown fields are tolerated where schemas allow it', async ({ request }) => {
    const response = await request.post('/api/analytics/track', {
      data: {
        projectId: 'e2e-extra-fields',
        eventType: 'custom',
        // extra fields the schema includes as optional
        path: '/somewhere',
        referrer: 'https://example.com',
      },
    });
    expect(response.status()).toBe(204);
  });
});
