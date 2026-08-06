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
    '127.0.0.1:3000',
    '127.0.0.1',
  ].filter(Boolean) as string[]
);

function withStandardHeaders(target: NextResponse, pathname: string): NextResponse {
  // Request ID for distributed tracing — same req_<hex> format used by
  // route-level withRequestLogging, so every response carries one style.
  // Edge-safe: Web Crypto, no node crypto imports.
  const requestIdBytes = crypto.getRandomValues(new Uint8Array(8));
  const requestIdHex = Array.from(requestIdBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  target.headers.set('X-Request-Id', `req_${requestIdHex}`);

  // ─── Security Headers ────────────────────────────────────────────────
  target.headers.set('X-Content-Type-Options', 'nosniff');
  target.headers.set('X-Frame-Options', 'DENY');
  target.headers.set('X-XSS-Protection', '1; mode=block');
  target.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  target.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  target.headers.set(
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
    target.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/assets/')) {
    target.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  return target;
}

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

  // Auth check for protected routes (skip if explicitly public). API
  // requests get an explicit 401 JSON — this Clerk version answers
  // unauthenticated API requests with 404 (notFound), which breaks the
  // documented API contract. Page routes keep Clerk's sign-in redirect.
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    if (pathname.startsWith('/api/')) {
      const { userId } = await auth();
      if (!userId) {
        return withStandardHeaders(
          NextResponse.json(
            {
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'Authentication required', timestamp: new Date().toISOString() },
            },
            { status: 401 }
          ),
          pathname
        );
      }
    } else {
      await auth.protect();
    }
  }

  return withStandardHeaders(response, pathname);
});

// ─── Matcher ────────────────────────────────────────────────────────────
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
