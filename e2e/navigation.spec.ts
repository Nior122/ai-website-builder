// =============================================================================
// Navigation E2E Tests
// =============================================================================
// Tests for public page rendering, 404 handling, and redirect behavior.
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/');
    // Should not show 404 or error
    await expect(page).not.toHaveTitle(/not found/i);
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz');
    expect(response?.status()).toBe(404);

    // Should show the custom 404 content
    await expect(page.locator('text=Page not found')).toBeVisible();
  });

  test('404 page has link back to home', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
  });
});

test.describe('Redirects', () => {
  test('/dashboard redirects to /dashboard/projects', async ({ request }) => {
    const response = await request.get('/dashboard', {
      maxRedirects: 0,
    });
    // Next.js redirects return 307/308
    expect([307, 308]).toContain(response.status());
    const location = response.headers()['location'];
    expect(location).toContain('/dashboard/projects');
  });
});

test.describe('Security Headers', () => {
  test('returns security headers on all pages', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['strict-transport-security']).toContain('max-age=');
  });

  test('CSP header is present', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
  });
});
