// =============================================================================
// Next.js Instrumentation — runs once at server startup
// =============================================================================
// Next.js invokes register() once when the Node.js server boots, before it
// accepts any request. This is the correct place to validate environment
// configuration and fail fast (in production) on missing/invalid secrets.
//
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
// =============================================================================

export async function register() {
  // Only run server-side. register() can also be invoked in the edge runtime for
  // edge route handlers; the startup check touches Node-only process.env, so
  // guard it.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureStartupCheck } = await import('@/lib/startup-check');
    ensureStartupCheck();
  }
}
