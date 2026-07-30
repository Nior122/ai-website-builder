// =============================================================================
// Preview Page (multi-page)
// =============================================================================
// Full-viewport preview of a generated project. Optional catch-all segment
// `[[...pageSlug]]` lets the same route serve:
//   /preview/[projectId]            → the home page
//   /preview/[projectId]/about      → the "about" page (matches Page.slug)
//   /preview/[projectId]/pricing    → … etc.
//
// Unlike the public `/site/[slug]` route, preview is reachable for any project
// (draft or published) and requires no published-state check — it's the
// in-app way for the owner to review every page. Public delivery lives in
// `app/(public)/site/[slug]/…`.
// =============================================================================

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma/client';
import { PageRenderer } from '@/features/renderer';
import { parseProjectPages } from '@/features/renderer/lib/parse-page';
import { generateMetaTags } from '@/features/seo/services/seo.service';
import type { Page, Theme, Project, ProjectStatus, SEOConfig } from '@/types';

interface PreviewPageProps {
  params: Promise<{ projectId: string; pageSlug?: string[] }>;
}

// ─── Data Loader ───────────────────────────────────────────────────────────

async function loadProject(
  projectId: string,
  pageSlug: string[] | undefined
): Promise<{ page: Page; theme: Theme; project: Project } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pages: {
        orderBy: { order: 'asc' },
        include: { sections: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!project) return null;

  const pages = parseProjectPages(project.pages as unknown as Parameters<typeof parseProjectPages>[0]);

  // Resolve the target page: home when no slug, else an exact slug match.
  const slug = pageSlug?.join('/');
  const page = slug
    ? pages.find((p) => p.slug === slug)
    : pages.find((p) => p.isHome);

  if (!page) return null;

  const built: Project = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    businessType: project.businessType,
    industry: project.industry,
    status: project.status as ProjectStatus,
    pages,
    globalStyles: project.globalStyles as unknown as Project['globalStyles'],
    seo: project.seo as unknown as Project['seo'],
    settings: project.settings as unknown as Project['settings'],
    ownerId: project.ownerId,
    organizationId: project.organizationId,
    templateId: project.templateId,
    thumbnailUrl: project.thumbnailUrl,
    customDomain: project.customDomain,
    publishedAt: project.publishedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  } as Project;

  return {
    page,
    theme: project.globalStyles as unknown as Theme,
    project: built,
  };
}

// ─── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { projectId, pageSlug } = await params;
  const data = await loadProject(projectId, pageSlug);
  if (!data) return {};

  const seo = (data.project.seo ?? {}) as Partial<SEOConfig>;
  const tags = generateMetaTags(data.page);
  const title = seo.metaTitle || tags.title;
  const description = seo.metaDescription || tags.description;

  return {
    title,
    description,
    robots: { index: false, follow: true }, // never index private previews
    openGraph: {
      title,
      description,
      type: 'website',
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: seo.twitterCard ?? 'summary_large_image',
      title,
      description,
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { projectId, pageSlug } = await params;
  const data = await loadProject(projectId, pageSlug);

  if (!data) notFound();

  return (
    <div className="min-h-screen">
      <PageRenderer page={data.page} theme={data.theme} />
    </div>
  );
}
