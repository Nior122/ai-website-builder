// =============================================================================
// Website Builder — Project Builder
// =============================================================================
// Assembles a complete multi-page BuilderProject from the Phase 3 agent
// blueprint: pages + sections, theme tokens, navigation, footer, SEO, forms,
// blog, and media. The output is the editable artifact the editor works on.
// =============================================================================

import { nanoid } from 'nanoid';
import { isRecord, type OrchestrationResult } from '@/lib/agents';
import { generateThemeForBusiness, type DesignBrief } from '@/lib/ai/design-pipeline';
import { buildStandardPages, ensureRequiredPages } from './page-operations';
import { buildNavigation, buildFooter } from './navigation-builder';
import { buildDefaultSeo } from './seo-panel';
import { defaultForms } from './forms-config';
import { defaultBlogState } from './blog-system';
import { seedMediaLibrary } from './media-manager';
import type { BuilderPage, BuilderProject } from './types';

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

/** Apply copy blocks into section content by key prefix (e.g. hero.headline). */
function applyCopyToSections(pages: BuilderPage[], copy: unknown): BuilderPage[] {
  const blocks = isRecord(copy) && Array.isArray(copy.blocks)
    ? (copy.blocks as Array<{ key: string; text: string }>)
    : [];
  if (blocks.length === 0) return pages;

  return pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => {
      const prefix = `${section.type}.`;
      const matched = blocks
        .filter((block) => block.key.startsWith(prefix))
        .map((block) => ({ key: block.key.slice(prefix.length), text: block.text }));
      if (matched.length === 0) return section;

      const content = { ...section.content };
      for (const entry of matched) {
        if (entry.key === 'headline') content.headline = entry.text;
        else if (entry.key === 'subheadline') content.subheadline = entry.text;
        else if (entry.key === 'ctaPrimary') content.ctaText = entry.text;
        else if (entry.key === 'ctaSecondary') content.ctaSecondary = entry.text;
        else if (entry.key === 'footer.tagline') content.footerTagline = entry.text;
        else content[entry.key] = entry.text;
      }
      return { ...section, content };
    }),
  }));
}

/**
 * Build the full editable project from an orchestration result.
 */
export function buildProjectFromBlueprint(
  brief: DesignBrief,
  blueprint: OrchestrationResult
): BuilderProject {
  const ctx = blueprint.context;
  const business = asRecord(ctx.business);
  const brand = asRecord(ctx.brand);
  const ux = asRecord(ctx.ux);
  const images = asRecord(ctx.images);
  const seoAgent = asRecord(ctx.seo);

  const name =
    typeof brand.name === 'string' && brand.name
      ? brand.name
      : brief.businessName ?? `${brief.industry} ${brief.businessType}`;

  const theme = generateThemeForBusiness(brief.businessType, brief);

  const base: BuilderProject = {
    id: nanoid(),
    name,
    description: brief.description,
    industry: brief.industry,
    businessType: brief.businessType,
    theme: {
      preset: theme.preset,
      mode: theme.mode,
      tokens: theme.tokens as unknown as Record<string, unknown>,
      styleOverrides: {},
    },
    pages: [],
    navigation: {
      logoText: name,
      links: [],
      sticky: true,
      transparent: false,
      cta: { label: 'Get Started', href: '/contact' },
      mobileMenu: 'drawer',
    },
    footer: {
      tagline: brief.description,
      columns: [],
      socialLinks: [],
      copyright: '',
    },
    seo: {
      metaTitle: `${name} — ${brief.industry} ${brief.businessType}`,
      metaDescription: brief.description.slice(0, 160),
      keywords: [brief.industry.toLowerCase(), brief.businessType.toLowerCase(), 'services'],
      ogImage: null,
      twitterCard: 'summary_large_image',
      canonicalUrl: null,
      robots: 'index,follow',
      sitemap: true,
      schema: [{ '@type': 'Organization', name }],
    },
    media: [],
    blog: defaultBlogState(name),
    forms: defaultForms(),
    updatedAt: Date.now(),
    version: 1,
  };

  let project: BuilderProject = base;

  // Pages (from the UX agent when available, else the standard set).
  const uxPages = Array.isArray(ux.pages) && (ux.pages as Array<{ slug: string }>).length > 0
    ? (ux.pages as Array<{ slug: string }>).map((page) => page.slug)
    : ['home', 'about', 'services', 'contact'];
  project = { ...project, pages: buildStandardPages(project, uxPages) };

  // Copy.
  project = { ...project, pages: applyCopyToSections(project.pages, ctx.copy) };

  // Navigation + footer from the real pages.
  project = { ...project, navigation: buildNavigation(project), footer: buildFooter(project) };

  // SEO from the SEO agent when present.
  if (typeof seoAgent.metaTitle === 'string' && seoAgent.metaTitle) {
    project = {
      ...project,
      seo: {
        ...buildDefaultSeo(project),
        metaTitle: seoAgent.metaTitle as string,
        metaDescription: typeof seoAgent.metaDescription === 'string' ? seoAgent.metaDescription : project.seo.metaDescription,
        keywords: Array.isArray(seoAgent.keywords) ? seoAgent.keywords as string[] : project.seo.keywords,
      },
    };
  }

  // Media from the image-direction agent.
  if (Array.isArray(images.hero)) {
    project = seedMediaLibrary(project, images.hero as string[], typeof images.style === 'string' ? images.style : 'natural-warm');
  }

  // Required pages: privacy, terms, 404, coming-soon.
  project = ensureRequiredPages(project);

  return project;
}
