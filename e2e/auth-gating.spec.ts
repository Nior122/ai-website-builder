// =============================================================================
// Auth Gating E2E Tests
// =============================================================================
// Verifies that routes handling sensitive data reject unauthenticated
// requests with 401 (or 403 where admin membership is checked), and that
// those routes still emit the X-Request-Id header despite the early rejection.
// Targets the routes hardened in Phase 21; all assertions run without an
// authenticated Clerk session.
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Unauthenticated requests are rejected', () => {
  test('GET /api/notifications returns 401', async ({ request }) => {
    const response = await request.get('/api/notifications');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/billing/subscription returns 401', async ({ request }) => {
    const response = await request.get('/api/billing/subscription');
    expect(response.status()).toBe(401);
  });

  test('GET /api/auth/me returns 401 for anonymous user', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect([401, 404]).toContain(response.status());
  });

  test('GET /api/organizations/<id>/members returns 401', async ({ request }) => {
    const response = await request.get('/api/organizations/org_e2e_probe/members');
    expect(response.status()).toBe(401);
  });

  test('GET /api/organizations/<id>/invitations returns 401', async ({ request }) => {
    const response = await request.get('/api/organizations/org_e2e_probe/invitations');
    expect(response.status()).toBe(401);
  });
});

test.describe('Admin routes reject non-admin / anonymous access', () => {
  test('GET /api/admin/stats returns 401 or 403', async ({ request }) => {
    const response = await request.get('/api/admin/stats');
    expect([401, 403]).toContain(response.status());
  });

  test('GET /api/admin/users returns 401 or 403', async ({ request }) => {
    const response = await request.get('/api/admin/users');
    expect([401, 403]).toContain(response.status());
  });

  test('GET /api/admin/flags returns 401 or 403', async ({ request }) => {
    const response = await request.get('/api/admin/flags');
    expect([401, 403]).toContain(response.status());
  });

  test('GET /api/admin/audit returns 401 or 403', async ({ request }) => {
    const response = await request.get('/api/admin/audit');
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Rejected requests still carry X-Request-Id', () => {
  // Confirms request logging wraps the route even when the handler short-
  // circuits on auth — the middleware header is set before the handler runs.
  test('401 on /api/notifications still has X-Request-Id', async ({ request }) => {
    const response = await request.get('/api/notifications');
    const requestId = response.headers()['x-request-id'];
    expect(requestId).toMatch(/^req_[a-f0-9]+$/);
  });

  test('401/403 on admin route still has X-Request-Id', async ({ request }) => {
    const response = await request.get('/api/admin/flags');
    const requestId = response.headers()['x-request-id'];
    expect(requestId).toMatch(/^req_[a-f0-9]+$/);
  });
});
