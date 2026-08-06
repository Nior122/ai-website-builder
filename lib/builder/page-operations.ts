// =============================================================================
// Website Builder — Page Operations
// =============================================================================
// Page management: create, rename, delete, duplicate, reorder, set homepage,
// publish/draft status, and SEO metadata. Auto-generates the standard page
// set (including Privacy, Terms, 404, Coming Soon) so the site is complete.
// =============================================================================

import { nanoid } from 'nanoid';
import type { BuilderPage, BuilderProject, PageStatus } from './types';
import { defaultSection } from './section-operations';

// ─── Slug helpers ───────────────────────────────────────────────────────

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function uniqueSlug(project: BuilderProject, desired: string): string {
  const base = slugify(desired) || 'page';
  const existing = new Set(project.pages.map((page) => page.slug));
  if (!existing.has(base)) return base;
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}

// ─── Standard pages ─────────────────────────────────────────────────────

const STANDARD_PAGES: Array<{ slug: string; title: string; sections: string[] }> = [
  { slug: 'home', title: 'Home', sections: ['hero', 'features', 'statistics', 'testimonials', 'pricing', 'cta', 'contact'] },
  { slug: 'about', title: 'About', sections: ['hero', 'mission', 'vision', 'values', 'team', 'cta'] },
  { slug: 'services', title: 'Services', sections: ['hero', 'services', 'process', 'faq', 'cta'] },
  { slug: 'contact', title: 'Contact', sections: ['hero', 'contact', 'map', 'faq'] },
  { slug: 'portfolio', title: 'Portfolio', sections: ['hero', 'portfolio', 'gallery', 'cta'] },
  { slug: 'pricing', title: 'Pricing', sections: ['hero', 'pricing', 'faq', 'cta'] },
  { slug: 'testimonials', title: 'Testimonials', sections: ['hero', 'testimonials', 'statistics', 'cta'] },
  { slug: 'faq', title: 'FAQ', sections: ['hero', 'faq', 'contact'] },
  { slug: 'blog', title: 'Blog', sections: ['hero', 'blog', 'newsletter'] },
  { slug: 'gallery', title: 'Gallery', sections: ['hero', 'gallery', 'cta'] },
  { slug: 'team', title: 'Team', sections: ['hero', 'team', 'values', 'cta'] },
];

const REQUIRED_EXTRA_PAGES: Array<{ slug: string; title: string; sections: string[] }> = [
  { slug: 'privacy', title: 'Privacy Policy', sections: ['cta'] },
  { slug: 'terms', title: 'Terms of Service', sections: ['cta'] },
  { slug: '404', title: '404 — Page Not Found', sections: ['cta'] },
  { slug: 'coming-soon', title: 'Coming Soon', sections: ['cta'] },
];

function buildPage(
  project: BuilderProject,
  slug: string,
  title: string,
  sectionTypes: string[],
  order: number,
  isHome = false
): BuilderPage {
  return {
    id: nanoid(),
    slug,
    title,
    metaTitle: `${title} — ${project.name}`,
    metaDescription: `${title} page for ${project.name}.`,
    isHome,
    status: 'published' as PageStatus,
    order,
    sections: sectionTypes.map((type, index) => defaultSection(type, index)),
  };
}

/**
 * Generate the standard page set for a project (multi-page by default).
 */
export function buildStandardPages(project: BuilderProject, slugs?: string[]): BuilderPage[] {
  const requested = slugs && slugs.length > 0 ? slugs : ['home', 'about', 'services', 'contact'];
  const pages: BuilderPage[] = [];
  let order = 0;
  for (const slug of requested) {
    const spec = STANDARD_PAGES.find((page) => page.slug === slug);
    if (spec) {
      pages.push(buildPage(project, spec.slug, spec.title, spec.sections, order, slug === 'home'));
      order += 1;
    }
  }
  // Guarantee the core trio even if the request omitted them.
  for (const slug of ['home', 'about', 'contact']) {
    if (!pages.some((page) => page.slug === slug)) {
      const spec = STANDARD_PAGES.find((page) => page.slug === slug);
      if (spec) {
        pages.push(buildPage(project, spec.slug, spec.title, spec.sections, order, slug === 'home'));
        order += 1;
      }
    }
  }
  return pages;
}

/** Append Privacy / Terms / 404 / Coming Soon when missing. */
export function ensureRequiredPages(project: BuilderProject): BuilderProject {
  const missing = REQUIRED_EXTRA_PAGES.filter(
    (spec) => !project.pages.some((page) => page.slug === spec.slug)
  );
  if (missing.length === 0) return project;
  const pages = [...project.pages];
  let order = pages.length;
  for (const spec of missing) {
    pages.push(buildPage(project, spec.slug, spec.title, spec.sections, order));
    order += 1;
  }
  return { ...project, pages };
}

// ─── Page CRUD ──────────────────────────────────────────────────────────

export function createPage(project: BuilderProject, title: string): BuilderProject {
  const slug = uniqueSlug(project, title);
  const page = buildPage(project, slug, title, ['hero', 'cta'], project.pages.length);
  return { ...project, pages: [...project.pages, page] };
}

export function renamePage(project: BuilderProject, pageId: string, title: string): BuilderProject {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId
        ? { ...page, title, slug: page.isHome ? page.slug : uniqueSlug(project, title) }
        : page
    ),
  };
}

export function deletePage(project: BuilderProject, pageId: string): BuilderProject {
  const target = project.pages.find((page) => page.id === pageId);
  if (!target) return project;
  if (project.pages.length <= 1) return project; // never delete the last page
  const pages = project.pages
    .filter((page) => page.id !== pageId)
    .map((page, index) => ({ ...page, order: index }));
  // If the home page was deleted, promote the first remaining page.
  if (target.isHome && pages.length > 0) {
    pages[0] = { ...pages[0], isHome: true };
  }
  return { ...project, pages };
}

export function duplicatePage(project: BuilderProject, pageId: string): BuilderProject {
  const source = project.pages.find((page) => page.id === pageId);
  if (!source) return project;
  const clone: BuilderPage = {
    ...(JSON.parse(JSON.stringify(source)) as BuilderPage),
    id: nanoid(),
    slug: uniqueSlug(project, `${source.slug}-copy`),
    title: `${source.title} Copy`,
    isHome: false,
    order: project.pages.length,
    sections: source.sections.map((section) => ({ ...section, id: nanoid() })),
  };
  return { ...project, pages: [...project.pages, clone] };
}

export function reorderPages(project: BuilderProject, orderedIds: string[]): BuilderProject {
  const byId = new Map(project.pages.map((page) => [page.id, page]));
  const pages = orderedIds
    .map((id) => byId.get(id))
    .filter((page): page is BuilderPage => page !== undefined)
    .map((page, index) => ({ ...page, order: index }));
  return { ...project, pages };
}

export function setHomePage(project: BuilderProject, pageId: string): BuilderProject {
  return {
    ...project,
    pages: project.pages.map((page) => ({ ...page, isHome: page.id === pageId })),
  };
}

export function setPageStatus(project: BuilderProject, pageId: string, status: PageStatus): BuilderProject {
  return {
    ...project,
    pages: project.pages.map((page) => (page.id === pageId ? { ...page, status } : page)),
  };
}

export function updatePageMeta(
  project: BuilderProject,
  pageId: string,
  meta: { metaTitle?: string; metaDescription?: string }
): BuilderProject {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId ? { ...page, ...meta } : page
    ),
  };
}

export function getPageBySlug(project: BuilderProject, slug: string): BuilderPage | undefined {
  return project.pages.find((page) => page.slug === slug);
}

export function getHomePage(project: BuilderProject): BuilderPage | undefined {
  return project.pages.find((page) => page.isHome) ?? project.pages[0];
}
