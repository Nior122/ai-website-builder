// =============================================================================
// Next.js Middleware — Merged Clerk + Security Headers + Custom Domain Routing
// =============================================================================
// Single middleware handling:
//   1. Clerk authentication (public vs protected routes)
//   2. Custom domain routing (rewrites custom hostnames to /site/[slug])
//   3. Security headers
//
// Custom domain flow: when the request hostname doesn't match the app's own
// hostname, we look up `Project.customDomain === hostname` and rewrite to
// `/site/<slug>` so the public site renders correctly. This lookup hits Redis
// (via the public-site service cache) — no extra DB call per request.
// =============================================================================

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route Matchers ─────────────────────────────────────────────────────
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/preview(.*)',
  '/site(.*)', // published sites (public delivery) — auth-free
  '/templates(.*)',
  '/api/webhooks(.*)',
  '/api/templates(.*)',
  '/api/auth/me(.*)',
  '/api/ai/test-connection(.*)', // diagnostic endpoint — no auth needed
  '/api/ai/test-minimal(.*)', // minimal diagnostic route — no auth needed
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/api/projects(.*)',
  '/api/ai(.*)',
  '/api/deploy(.*)',
  '/api/billing(.*)',
  '/api/storage(.*)',
  '/api/stripe(.*)',
  '/api/admin(.*)',
  '/api/analytics(.*)',
]);

// ─── Custom Domain Detection ────────────────────────────────────────────
// The app's own hostname(s). Requests from these hostnames are NOT rewritten.
// In production this is the Vercel deployment URL; in dev, localhost.
const APP_HOSTNAMES = new Set(
  [
    process.env.APP_HOSTNAME,       // e.g. "app.aiwebsitebuilder.com"
    process.env.VERCEL_URL,         // auto-set by Vercel (e.g. "ai-website-builder-studio-abc123.vercel.app")
    'localhost:3000',
    'localhost',
  ].filter(Boolean) as string[]
);

// ─── Middleware ─────────────────────────────────────────────────────────
export default clerkMiddleware(async (auth, req) => {
  const response = NextResponse.next();
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host')?.split(':')[0] ?? '';




  // ─── Custom Domain Routing ────────────────────────────────────────────
  // When the request arrives on a custom domain (not our app hostname),
  // look up the project by `customDomain` and rewrite to /site/<slug>.
  // This uses the same cache-backed lookup as the public-site service.
  // Only applies to GET requests (page loads, not API calls).
  if (hostname && !APP_HOSTNAMES.has(hostname) && !pathname.startsWith('/api/')) {
    try {
      const { getProjectByDomain } = await import(
        '@/features/publishing/services/public-site.service'
      );
      const match = await getProjectByDomain(hostname);
      if (match) {
        // Rewrite: /anything → /site/<slug> (or /site/<slug>/anything)
        const pathSuffix = pathname === '/' ? '' : pathname;
        const rewriteUrl = `/site/${match.slug}${pathSuffix}`;
        return NextResponse.rewrite(new URL(rewriteUrl, req.url));
      }
    } catch {
      // If the import fails (e.g. edge runtime), fall through to normal routing.
      // The site will still work at the /site/[slug] URL.
    }
  }

  // Auth check for protected routes (skip if explicitly public)
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }

  // Request ID for distributed tracing
  response.headers.set('X-Request-Id', crypto.randomUUID());

  // ─── Security Headers ────────────────────────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.amazonaws.com https://*.blob.core.windows.net https://img.clerk.com https://*.clerk.accounts.dev",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com wss://*.clerk.com wss://*.clerk.accounts.dev",
      "frame-src 'self' https://js.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
    ].join('; ')
  );

  // ─── Caching ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/assets/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
});

// ─── Matcher ────────────────────────────────────────────────────────────
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
