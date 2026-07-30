// =============================================================================
// Clerk Middleware — Reference
// =============================================================================
// The main Clerk middleware is now in the root middleware.ts which combines
// auth protection with security headers. This file is kept for reference
// and re-exports the route matcher helpers for use elsewhere.
// =============================================================================

import { createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Public routes that don't require authentication.
 * Used by components that need to check if a route is public.
 */
export const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/preview(.*)',
  '/templates(.*)',
  '/api/webhooks(.*)',
  '/api/templates(.*)',
  '/api/auth/me(.*)',
]);

/**
 * Protected routes that require authentication.
 */
export const protectedRoutes = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/api/projects(.*)',
  '/api/ai(.*)',
  '/api/deploy(.*)',
  '/api/billing(.*)',
  '/api/storage(.*)',
  '/api/stripe(.*)',
]);
