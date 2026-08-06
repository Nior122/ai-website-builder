// =============================================================================
// Website / Page Planner — site architecture stage
// =============================================================================
// Decides which pages the site needs and the ordered section blueprint for
// each page (via industry blueprints). A page is NEVER emitted with zero
// sections: every planned page carries a sectionPlan that the section stage
// must satisfy, so "misses required pages" / "only one section" cannot happen.
// =============================================================================

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getModelManager, type ModelManager } from './model-manager';
import { repairAndParse } from './json-repair-engine';
import { safeValidate } from './safe-validation';
import { getIndustryProfile, getPageBlueprint, type IndustryProfile } from './industry-profiles';
import { logStageStart, logStageComplete, logStageFailed } from './observability';
import type { AIErrorContext } from './structured-errors';
import type { GenerateRequest } from '@/types';
import type { BusinessAnalysis } from './business-analysis';
import type { GenerationProgress } from '@/features/ai-engine/types';

const LOG = { service: 'page-planner' } as const;

export interface PlannedPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  isHome: boolean;
  /** Ordered section types this page should contain. */
  sectionPlan: string[];
}

const pagesSchema = z.object({
  pages: z.array(
    z.object({
      slug: z.string().default(''),
      title: z.string().default(''),
      metaTitle: z.string().optional().default(''),
      metaDescription: z.string().optional().default(''),
    })
  ).min(1),
});

const PAGES_SYSTEM_PROMPT = `You are an expert information architect. Determine the optimal page structure for this business.

Rules:
- Always include home, contact, and the legal pages (privacy, terms).
- Add only pages that make sense for THIS business (e.g. a restaurant gets a menu/gallery, a SaaS gets features/pricing/blog, a law firm gets services/team).
- Keep the total between 5 and 9 pages.
- slugs must be lowercase URL-safe (no spaces).
- metaTitle ≤ 60 chars; metaDescription ≤ 160 chars.

Return ONLY valid JSON:
{
  "pages": [
    { "slug": "url-safe-name", "title": "Page title", "metaTitle": "SEO meta title (≤60 chars)", "metaDescription": "SEO meta description (≤160 chars)" }
  ]
}`;

export function buildPagesPrompt(analysis: BusinessAnalysis, request: GenerateRequest): string {
  const profile = getIndustryProfile(analysis.industryId || request.industry);
  return [
    `Business: ${analysis.businessName}`,
    `Industry: ${analysis.industry}`,
    `Type: ${request.businessType}`,
    `Audience: ${analysis.targetAudience}`,
    `Services: ${analysis.services.join(', ') || 'Not provided'}`,
    `Goals: ${analysis.businessGoals.join('; ') || 'Not provided'}`,
    `Recommended pages for this industry: ${['home', 'contact', 'privacy', 'terms', ...profile.pages].join(', ')}`,
    request.pages?.length ? `User requested pages: ${request.pages.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

/** Deterministic page plan — used as fallback and as the structure backbone. */
export function planPages(analysis: BusinessAnalysis, request: GenerateRequest): PlannedPage[] {
  const profile = getIndustryProfile(analysis.industryId || request.industry);
  const name = analysis.businessName || request.businessName || `${capitalize(request.industry)} ${titleCase(request.businessType || 'Business')}`;
  const pages: PlannedPage[] = [];
  const seen = new Set<string>();

  const add = (slug: string, title: string, isHome = false) => {
    if (seen.has(slug)) return;
    seen.add(slug);
    pages.push({
      slug,
      title,
      metaTitle: `${name} — ${title}`.slice(0, 60),
      metaDescription: (analysis.targetAudience
        ? `${title} for ${analysis.targetAudience}.`
        : `${title} — ${name}.`).slice(0, 160),
      isHome,
      sectionPlan: getPageBlueprint(profile, slug),
    });
  };

  add('home', 'Home', true);
  add('about', 'About');
  add('services', 'Services');
  add('pricing', 'Pricing');
  add('contact', 'Contact');

  // Industry-specific pages.
  for (const slug of profile.pages) {
    if (!['home', 'about', 'services', 'pricing', 'contact'].includes(slug)) {
      add(slug, titleCase(slug));
    }
  }
  // User-requested pages (highest priority after the core set).
  for (const slug of request.pages || []) {
    if (slug && !seen.has(slug)) add(slug, titleCase(slug));
  }
  add('privacy', 'Privacy Policy');
  add('terms', 'Terms of Service');

  return pages;
}

/** Run the page planner stage. */
export async function runPagePlanner(
  analysis: BusinessAnalysis,
  request: GenerateRequest,
  mm: ModelManager = getModelManager(),
  context: AIErrorContext = {},
  emit?: (p: GenerationProgress) => void
): Promise<PlannedPage[]> {
  logStageStart('pages');
  const profile = getIndustryProfile(analysis.industryId || request.industry);
  try {
    const r = await mm.executeWithFallback<string>({
      system: PAGES_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPagesPrompt(analysis, request) }],
      stage: 'pages',
    }, { ...context, stage: 'pages' });
    if (!r.data) throw new Error('Empty response');
    const rr = repairAndParse(r.data);
    if (!rr.success) throw new Error(`JSON repair failed: ${rr.error}`);
    const vr = safeValidate(pagesSchema, rr.data, { defaultBasePath: 'pages', verbose: true });
    if (!vr.success) throw new Error(`Validation failed: ${vr.error}`);
    const proposed = (vr.data as { pages: Array<{ slug: string; title: string; metaTitle?: string; metaDescription?: string }> }).pages
      .filter(p => p.slug)
      .map(p => ({ slug: slugify(p.slug), title: p.title || titleCase(p.slug) }));
    const name = analysis.businessName || request.businessName || `${capitalize(request.industry)} ${titleCase(request.businessType || 'Business')}`;

    // Build the final plan deterministically but honor the model's order/pages.
    const base = planPages(analysis, request);
    const ordered: PlannedPage[] = [];
    const seen = new Set<string>();
    const addFinal = (slug: string, title: string, metaTitle?: string, metaDescription?: string, isHome = false) => {
      const s = slugify(slug);
      if (seen.has(s)) return;
      seen.add(s);
      ordered.push({
        slug: s,
        title,
        metaTitle: (metaTitle || `${name} — ${title}`).slice(0, 60),
        metaDescription: (metaDescription || `${title} — ${name}.`).slice(0, 160),
        isHome,
        sectionPlan: getPageBlueprint(profile, s),
      });
    };
    for (const p of proposed) addFinal(p.slug, p.title, undefined, undefined, p.slug === 'home');
    for (const p of base) addFinal(p.slug, p.title, p.metaTitle, p.metaDescription, p.isHome);
    logStageComplete('pages', { durationMs: r.latencyMs, model: r.model, provider: r.provider, repairsApplied: vr.repairsApplied + rr.repairsApplied, validationPassed: true });
    return ordered;
  } catch (err) {
    logStageFailed('pages', err instanceof Error ? err.message : String(err));
    logger.warn('Page planner fell back to deterministic plan', { ...LOG, industry: request.industry });
    return planPages(analysis, request);
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
}
function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}
function titleCase(s: string): string {
  return s.split(/[\s-]+/).filter(Boolean).map(capitalize).join(' ');
}
