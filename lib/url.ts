// =============================================================================
// Public URL Builders
// =============================================================================
// Pure, dependency-free string helpers for constructing the app's public URLs.
// Kept in a standalone module (no Prisma / Redis imports) so it can be safely
// imported from client components without dragging server-only code into the
// browser bundle.
//
// `buildPublishedUrl` was previously exported from
// features/publishing/services/publishing.service, which transitively imports
// the Prisma client and Redis cache — making it unusable from client code.
// =============================================================================

/**
 * Public preview URL for a published project, as a subpath of this app:
 * `/site/<slug>`. Centralized here so the API route, the editor toolbar hook,
 * and the dashboard link all agree on the shape. A future phase may swap this
 * for a custom-domain implementation; consumers should always call this
 * helper rather than constructing the path inline.
 */
export function buildPublishedUrl(slug: string): string {
  return `/site/${slug}`;
}
