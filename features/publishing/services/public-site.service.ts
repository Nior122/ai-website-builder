// =============================================================================
// Public Site Service
// =============================================================================
// Read-side data access for public delivery (`/site/<slug>/…`). Loads a
// project by slug, enforces that it is actually published, resolves the
// requested page, and returns the typed shapes the renderer + layout need —
// all behind a slug-keyed cache so a hot published page is one Redis hit.
//
// Why a dedicated service (not inline in the route):
//   - The "is this published + which page is this" logic is the security-
//     relevant gate for public delivery; isolating it makes it auditable and
//     unit-testable.
//   - It's the only place that knows the cache key + TTL; publish/unpublish
//     (`publishing.service`) evicts exactly this key.
//   - Returning `null` (vs throwing) lets the route render a clean `404` for
//     unpublished / missing projects without the centralized error path.
//
// `Theme` reconciliation: the editor persists the *entire* `Theme` object to
// `Project.globalStyles`, so a touched project's `globalStyles` already is a
// `Theme`. Brand-new projects (or legacy rows) may have `{}`; for those we fall
// back to `getDefaultTheme()` keyed off the stored `theme.preset` so the public
// route never renders against an empty theme.
// =============================================================================

import type { Metadata } from 'next';
import prisma from '@/lib/prisma/client';
import { cacheGetOrSet, cacheGet, cacheSet, cacheKeys } from '@/lib/redis/cache';
import { parseProjectPages } from '@/features/renderer/lib/parse-page';
import { getDefaultTheme } from '@/features/json-engine';
import { generateMetaTags } from '@/features/seo/services/seo.service';
import type { Page, Project, ProjectStatus, Theme, SEOConfig } from '@/types';

// 5-minute cache, mirroring the editor's project read TTL so a publish
// (which evicts this key) propagates within the same window.
const PUBLIC_SITE_TTL = 300;

export interface PublicSiteData {
  project: Project;
  page: Page;
  theme: Theme;
}

/**
 * Resolved public-site context for one page of one published project.
 *
 * @param slug       the project slug (URL segment after `/site/`)
 * @param pageSlug   joined catch-all segments for the page (`''` ⇒ home)
 * @returns `null` when the project doesn't exist, isn't published, or the
 *          requested page slug has no match — the route turns each into 404.
 */
export async function getPublishedProjectBySlug(
  slug: string,
  pageSlug?: string
): Promise<PublicSiteData | null> {
  const cacheKey = cacheKeys.projectBySlug(slug);

  return cacheGetOrSet<PublicSiteData | null>(cacheKey, async () => {
    const found = await prisma.project.findUnique({
      where: { slug } as any,
      include: {
        pages: {
          orderBy: { order: 'asc' } as any,
          include: { sections: { orderBy: { order: 'asc' } as any } },
        },
      },
    });

    // Not found OR not published → 404. Archived and draft sites are not
    // publicly reachable; this is the delivery gate.
    if (!found || found.status !== 'published') return null;

    const pages = parseProjectPages(
      (found as any).pages as unknown as Parameters<typeof parseProjectPages>[0]
    );

    // Resolve the target page: home when no slug, else exact slug match.
    const page = pageSlug
      ? pages.find((p) => p.slug === pageSlug)
      : pages.find((p) => p.isHome);

    if (!page) return null;

    const project: Project = {
      id: found.id,
      name: found.name,
      slug: found.slug,
      description: found.description,
      businessType: found.businessType,
      industry: found.industry,
      status: found.status as ProjectStatus,
      pages,
      globalStyles: found.globalStyles as unknown as Project['globalStyles'],
      seo: found.seo as unknown as Project['seo'],
      settings: found.settings as unknown as Project['settings'],
      ownerId: found.ownerId,
      organizationId: found.organizationId,
      templateId: found.templateId,
      thumbnailUrl: found.thumbnailUrl,
      customDomain: found.customDomain,
      publishedAt: found.publishedAt,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    } as Project;

    const theme = reconcileTheme(found.globalStyles as unknown as Partial<Theme>);

    return { project, page, theme };
  }, PUBLIC_SITE_TTL);
}

/**
 * Resolve a `Theme` from the stored `globalStyles` JSON. The editor writes a
 * full `Theme` there, so for normal projects this is a cast. If `globalStyles`
 * is empty / partial (fresh or legacy row), fall back to `getDefaultTheme()`
 * so the public page always has a complete, renderable theme. The cached value
 * stays stable for the TTL window; a theme save evicts (the editor PATCHes via
 * `/api/projects/[id]` which `cacheDelete`s `projectBySlug`).
 */
function reconcileTheme(stored: Partial<Theme> | null | undefined): Theme {
  if (stored && typeof stored === 'object' && 'typography' in stored && 'colors' in stored) {
    return stored as Theme;
  }
  const preset = (stored?.preset as string | undefined) ?? 'modern';
  return getDefaultTheme(preset);
}

/**
 * Pull the project's SEO config as a typed partial. `Project.seo` is a `Json`
 * column; the `SEOConfig` interface is the full/required shape, so consumers
 * treat each field as optional via this partial projection.
 */
export function getSeoConfig(project: Project): Partial<SEOConfig> {
  return (project.seo ?? {}) as Partial<SEOConfig>;
}

// ─── Custom Domain Resolution ───────────────────────────────────────────

const DOMAIN_CACHE_TTL = 300; // 5 minutes

/**
 * Reverse-lookup a published project by its custom domain hostname.
 * Used by the middleware to rewrite custom-domain requests to `/site/[slug]`.
 *
 * Returns `{ slug, id }` when a published project owns this domain, or `null`
 * when no match is found. The result is cached in Redis for 5 minutes.
 *
 * @param hostname — the bare hostname from the `Host` header (no port, no protocol)
 */
export async function getProjectByDomain(
  hostname: string
): Promise<{ slug: string; id: string } | null> {
  const cacheKey = cacheKeys.domainLookup(hostname);

  return cacheGetOrSet<{ slug: string; id: string } | null>(
    cacheKey,
    async () => {
      const project = await prisma.project.findFirst({
        where: { customDomain: hostname, status: 'published' },
        select: { slug: true, id: true },
      });
      return project ?? null;
    },
    DOMAIN_CACHE_TTL
  );
}

/**
 * Build the Next.js `Metadata` for a public page from the resolved site data.
 * Project-level `seo` (metaTitle / metaDescription / ogImage / twitterCard /
 * noIndex) wins, falling back to the page's own `metaTitle` / `metaDescription`
 * via the shared `generateMetaTags` helper — so the public route and the
 * private preview derive identical tag logic. Returns `{}` when there's no
 * data, which the route already handles via `notFound()`.
 *
 * `robots` honors an explicit project-level `noIndex` (and `noFollow`); absent
 * that, published pages are indexed — unlike private previews, which are never
 * indexed.
 */
export function buildPublicMetadata(data: PublicSiteData | null): Metadata {
  if (!data) return {};

  const seo = getSeoConfig(data.project);
  const tags = generateMetaTags(data.page);

  const title = seo.metaTitle || tags.title;
  const description = seo.metaDescription || tags.description;

  const robots = seo.noIndex
    ? { index: false, follow: !seo.noFollow }
    : { index: true, follow: !seo.noFollow };

  return {
    title,
    description,
    robots,
    openGraph: {
      title: seo.metaTitle || tags.ogTitle || title,
      description: seo.metaDescription || tags.ogDescription || description,
      type: (seo.ogType || 'website') as 'website',
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: seo.twitterCard ?? 'summary_large_image',
      title,
      description,
      ...(seo.twitterSite ? { site: seo.twitterSite } : {}),
      ...(seo.twitterCreator ? { creator: seo.twitterCreator } : {}),
    },
  };
}
