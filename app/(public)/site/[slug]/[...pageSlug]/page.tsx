// =============================================================================
// Public Site — Sub-pages (catch-all)
// =============================================================================
// Delivers any non-home page of a *published* project at
// `/site/<slug>/<pageSlug>` (and deeper slugs joined). The optional catch-all
// matches arbitrary page depth; the underlying `getPublishedProjectBySlug`
// resolves by exact `Page.slug` join and returns `null` (→ 404) when the page
// doesn't exist or the project isn't published. The home page (no path after
// the slug) is handled by the sibling `app/(public)/site/[slug]/page.tsx`.
//
// `generateMetadata` reuses `buildPublicMetadata` so this page and the home
// page derive identical `<head>` tags. Google Fonts + CSS variables come from
// the `PublicSiteLayout` wrapper.
// =============================================================================

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageRenderer } from '@/features/renderer';
import {
  getPublishedProjectBySlug,
  buildPublicMetadata,
} from '@/features/publishing/services/public-site.service';
import { PublicSiteLayout } from '@/features/publishing/components/public-site-layout';
import { AnalyticsScript } from '@/features/analytics/components/tracking-script';

interface PublicSubPageProps {
  params: Promise<{ slug: string; pageSlug: string[] }>;
}

export async function generateMetadata({
  params,
}: PublicSubPageProps): Promise<Metadata> {
  const { slug, pageSlug } = await params;
  const data = await getPublishedProjectBySlug(slug, pageSlug.join('/'));
  return buildPublicMetadata(data);
}

export default async function PublicSubPage({ params }: PublicSubPageProps) {
  const { slug, pageSlug } = await params;
  const data = await getPublishedProjectBySlug(slug, pageSlug.join('/'));

  if (!data) notFound();

  return (
    <PublicSiteLayout theme={data.theme}>
      <AnalyticsScript projectId={data.project.id} />
      <PageRenderer page={data.page} theme={data.theme} />
    </PublicSiteLayout>
  );
}
