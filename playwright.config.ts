// =============================================================================
// Playwright E2E Test Configuration
// =============================================================================
// End-to-end tests for critical user flows. Run against the local dev server
// or a deployed preview. CI uses `test:e2e` script (playwright test).
// =============================================================================

import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

// Clerk rejects plainly-invalid placeholder publishable keys at runtime
// ("Publishable key not valid") while the E2E tests only need the auth
// machinery to run in its signed-out state. Inject a syntactically valid
// test key (pk_test_ + base64 of "clerk.test.example$") so middleware and
// the browser ClerkProvider boot without a real Clerk account.
const VALID_TEST_PUBLISHABLE_KEY = 'pk_test_Y2xlcmsudGVzdC5leGFtcGxlJA==';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'html',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: CI ? 'retain-on-failure' : 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Force IPv4 loopback: on runners without working IPv6 (GitHub
        // Actions, some sandboxes) Chromium resolves localhost to ::1 and
        // fails with ERR_NAME_NOT_RESOLVED instead of falling back.
        launchOptions: { args: ['--host-resolver-rules=MAP localhost 127.0.0.1'] },
      },
    },
  ],

  // Serve the PRODUCTION build for tests — the dev server is too flaky for
  // E2E (cold compiles, dev-only 500 pages) and its health check needs a 2xx.
  // `npm run build && npm run start` keeps CI self-contained (no artifact
  // sharing between jobs).
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !CI,
    timeout: 300_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: VALID_TEST_PUBLISHABLE_KEY,
    },
  },
});
