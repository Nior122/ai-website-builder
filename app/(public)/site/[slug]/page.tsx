// =============================================================================
// Public Site — Home Page
// =============================================================================
// Delivers the home page of a *published* project at `/site/<slug>`. This is
// the public URL the editor's Publish button produces and the dashboard "View
// site" links to. Draft / archived / missing projects resolve to a 404 here
// (the underlying `getPublishedProjectBySlug` returns `null` for anything not
// `status === 'published'`).
//
// SEO: `generateMetadata` assembles `<head>` tags from the project's stored
// `seo` config falling back to the page's own `metaTitle` / `metaDescription`
// (see `buildPublicMetadata`, shared with the catch-all route so both derive
// identical tags). Google Fonts + CSS variables are injected by the
// `PublicSiteLayout` wrapper.
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

interface PublicHomePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PublicHomePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedProjectBySlug(slug, '');
  return buildPublicMetadata(data);
}

export default async function PublicHomePage({ params }: PublicHomePageProps) {
  const { slug } = await params;
  const data = await getPublishedProjectBySlug(slug, '');

  if (!data) notFound();

  return (
    <PublicSiteLayout theme={data.theme}>
      <AnalyticsScript projectId={data.project.id} />
      <PageRenderer page={data.page} theme={data.theme} />
    </PublicSiteLayout>
  );
}
