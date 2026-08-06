// =============================================================================
// Playwright Global Setup — provision the test database schema
// =============================================================================
// CI provides Postgres + Redis services but never runs migrations, so
// DB-backed routes would 500 on missing tables. Apply the Prisma schema
// before the suite starts (idempotent; only touches the DATABASE_URL target).
// =============================================================================

import { execSync } from 'child_process';

export default function globalSetup(): void {
  if (!process.env.DATABASE_URL) {
    console.warn('[globalSetup] DATABASE_URL not set — skipping schema provisioning.');
    return;
  }
  console.log('[globalSetup] Applying Prisma schema to test database…');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log('[globalSetup] Schema ready.');
}
