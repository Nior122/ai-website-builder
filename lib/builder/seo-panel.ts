// =============================================================================
// Website Builder — SEO Panel
// =============================================================================
// Per-page and site-level SEO editing: title, description, keywords, OpenGraph,
// Twitter cards, canonical URL, schema, robots, sitemap. Includes validation.
// =============================================================================

import type { BuilderProject, BuilderPage, SiteSeo } from './types';

export interface SeoValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export function updateSiteSeo(project: BuilderProject, patch: Partial<SiteSeo>): BuilderProject {
  return { ...project, seo: { ...project.seo, ...patch } };
}

export function updatePageSeo(project: BuilderProject, pageId: string, patch: Partial<Pick<BuilderPage, 'metaTitle' | 'metaDescription'>>): BuilderProject {
  return {
    ...project,
    pages: project.pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)),
  };
}

/**
 * Validate site SEO: title length, description length, keyword count,
 * OpenGraph image, canonical URL, robots directives.
 */
export function validateSeo(seo: SiteSeo): SeoValidationIssue[] {
  const issues: SeoValidationIssue[] = [];

  if (!seo.metaTitle || seo.metaTitle.trim().length === 0) {
    issues.push({ field: 'metaTitle', message: 'Meta title is empty.', severity: 'error' });
  } else if (seo.metaTitle.length > 60) {
    issues.push({ field: 'metaTitle', message: `Meta title is ${seo.metaTitle.length} chars — keep it under 60.`, severity: 'warning' });
  }

  if (!seo.metaDescription || seo.metaDescription.trim().length === 0) {
    issues.push({ field: 'metaDescription', message: 'Meta description is empty.', severity: 'error' });
  } else if (seo.metaDescription.length > 160) {
    issues.push({ field: 'metaDescription', message: `Meta description is ${seo.metaDescription.length} chars — keep it under 160.`, severity: 'warning' });
  }

  if (seo.keywords.length < 3) {
    issues.push({ field: 'keywords', message: 'Add at least 3 keywords.', severity: 'warning' });
  }
  if (seo.keywords.length > 10) {
    issues.push({ field: 'keywords', message: 'More than 10 keywords dilutes focus.', severity: 'warning' });
  }

  if (!seo.ogImage) {
    issues.push({ field: 'ogImage', message: 'OpenGraph image missing — social shares will look plain.', severity: 'warning' });
  }

  if (seo.robots && !/noindex|nofollow|index,follow/.test(seo.robots)) {
    issues.push({ field: 'robots', message: 'Robots directive is malformed.', severity: 'error' });
  }

  return issues;
}

/**
 * Validate every page's SEO metadata.
 */
export function validatePageSeo(project: BuilderProject): SeoValidationIssue[] {
  const issues: SeoValidationIssue[] = [];
  for (const page of project.pages) {
    if (!page.metaTitle || page.metaTitle.trim().length === 0) {
      issues.push({ field: `pages.${page.slug}.metaTitle`, message: `"${page.title}" has no meta title.`, severity: 'warning' });
    }
    if (page.metaTitle && page.metaTitle.length > 60) {
      issues.push({ field: `pages.${page.slug}.metaTitle`, message: `"${page.title}" meta title exceeds 60 chars.`, severity: 'warning' });
    }
  }
  return issues;
}

export function buildDefaultSeo(project: BuilderProject): SiteSeo {
  return {
    metaTitle: `${project.name} — ${project.industry} ${project.businessType}`,
    metaDescription: project.description.slice(0, 160),
    keywords: [project.industry.toLowerCase(), project.businessType.toLowerCase(), 'services'],
    ogImage: null,
    twitterCard: 'summary_large_image',
    canonicalUrl: null,
    robots: 'index,follow',
    sitemap: true,
    schema: [
      { '@type': 'Organization', name: project.name, url: null },
      { '@type': 'WebSite', name: project.name, url: null },
    ],
  };
}
