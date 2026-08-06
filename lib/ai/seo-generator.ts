// =============================================================================
// SEO Generator — meta, keywords, Open Graph, and JSON-LD structured data
// =============================================================================
// Deterministic builder always produces a complete, valid SEO block
// (including Organization + WebSite JSON-LD). The LLM refines on top; any
// proposal that doesn't validate is rejected.
// =============================================================================

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getModelManager, type ModelManager } from './model-manager';
import { repairAndParse } from './json-repair-engine';
import { safeValidate } from './safe-validation';
import { resolveStockImage } from './stock-images';
import { logStageStart, logStageComplete, logStageFailed } from './observability';
import type { AIErrorContext } from './structured-errors';
import type { GenerateRequest } from '@/types';
import type { BusinessAnalysis } from './business-analysis';
import type { BrandIdentity } from './design-system';
import type { PlannedPage } from './page-planner';
import type { GenerationProgress } from '@/features/ai-engine/types';

const LOG = { service: 'seo-generator' } as const;

export interface SiteSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string | null;
  ogType: string;
  twitterCard: string;
  noIndex: boolean;
  noFollow: boolean;
  jsonLd: Array<Record<string, unknown>>;
  sitemap: boolean;
}

const seoSchema = z.object({
  metaTitle: z.string().optional().default(''),
  metaDescription: z.string().optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  ogImage: z.string().nullable().optional().default(null),
  ogType: z.string().optional().default('website'),
  twitterCard: z.string().optional().default('summary_large_image'),
  noIndex: z.boolean().optional().default(false),
  noFollow: z.boolean().optional().default(false),
  jsonLd: z.array(z.record(z.unknown())).optional().default([]),
  sitemap: z.boolean().optional().default(true),
});

const SEO_SYSTEM_PROMPT = `You are an expert SEO strategist. Given a business and its pages, produce sharp, specific search metadata and structured data.

Rules:
- metaTitle ≤ 60 chars, front-loaded with the primary keyword.
- metaDescription ≤ 160 chars, benefit-driven, one call to action.
- keywords: 8-12 specific, long-tail phrases (never generic single words).
- JSON-LD: include an Organization with name/description/url and a WebSite with SearchAction.
- Never use lorem ipsum or placeholder copy.

Return ONLY valid JSON:
{
  "metaTitle": "…",
  "metaDescription": "…",
  "keywords": ["…"],
  "ogImage": "https://… or null",
  "ogType": "website",
  "twitterCard": "summary_large_image",
  "jsonLd": [ { "@context": "https://schema.org", "@type": "Organization", "name": "…", "description": "…", "url": "…" } ],
  "sitemap": true
}`;

export function buildSEOPrompt(analysis: BusinessAnalysis, brand: BrandIdentity, request: GenerateRequest, pages: PlannedPage[]): string {
  const slugList = pages.map(p => `/${p.slug}`).join(', ');
  return [
    `Business: ${brand.name || analysis.businessName}`,
    `Industry: ${request.industry}`,
    `Type: ${request.businessType}`,
    `Tagline: ${brand.tagline || ''}`,
    `Description: ${brand.description || request.description}`,
    `Target audience: ${analysis.targetAudience}`,
    `Services: ${analysis.services.slice(0, 6).join(', ') || 'Not provided'}`,
    `Location: ${analysis.location || 'N/A'}`,
    `Pages: ${slugList}`,
  ].join('\n');
}

export function buildDeterministicSEO(
  analysis: BusinessAnalysis,
  brand: BrandIdentity,
  request: GenerateRequest,
  pages: PlannedPage[]
): SiteSEO {
  const name = brand.name || analysis.businessName;
  const industry = request.industry;
  const description = (brand.description || analysis.uniqueSellingPoint || request.description || `${name} provides ${industry} services.`)
    .replace(/\s+/g, ' ').trim().slice(0, 158);
  const services = analysis.services.length ? analysis.services : [industry];
  const keywords = unique([...services, industry, `${industry} ${request.businessType}`, `${name}`, analysis.targetAudience && `${industry} for ${analysis.targetAudience.toLowerCase()}`].filter(Boolean)).slice(0, 12);
  const og = resolveStockImage({ query: `${industry} website social share`, sectionType: 'cta', industry, alt: `${name} — ${industry}`, seed: `og:${industry}` });
  const domain = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`;
  const home = pages.find(p => p.isHome);

  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description: brand.description || description,
    url: `https://${domain}`,
    logo: og.src,
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service' }],
  };
  if (analysis.location) {
    organization.address = { '@type': 'PostalAddress', addressLocality: analysis.location, addressRegion: analysis.location };
  }

  const website: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: `https://${domain}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `https://${domain}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const breadcrumbs: Array<Record<string, unknown>> = pages.slice(0, 4).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.title,
    item: `https://${domain}/${p.slug}`,
  }));

  return {
    metaTitle: `${name} — ${industry} Services | ${home?.metaTitle?.split('—')[0]?.trim() || 'Official Site'}`.slice(0, 60),
    metaDescription: description,
    keywords,
    ogImage: og.src,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    jsonLd: [
      organization,
      website,
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs },
    ],
    sitemap: true,
  };
}

/** Run the SEO stage — deterministic base + LLM refinement. */
export async function runSEOGeneration(
  analysis: BusinessAnalysis,
  brand: BrandIdentity,
  request: GenerateRequest,
  pages: PlannedPage[],
  mm: ModelManager = getModelManager(),
  context: AIErrorContext = {},
  emit?: (p: GenerationProgress) => void
): Promise<SiteSEO> {
  logStageStart('seo');
  const base = buildDeterministicSEO(analysis, brand, request, pages);
  try {
    const r = await mm.executeWithFallback<string>({
      system: SEO_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildSEOPrompt(analysis, brand, request, pages) }],
      stage: 'seo',
    }, { ...context, stage: 'seo' });
    if (!r.data) throw new Error('Empty response');
    const rr = repairAndParse(r.data);
    if (!rr.success) throw new Error(`JSON repair failed: ${rr.error}`);
    const vr = safeValidate(seoSchema, rr.data, { defaultBasePath: 'seo', verbose: true });
    if (!vr.success) throw new Error(`Validation failed: ${vr.error}`);
    const proposed = vr.data as Partial<SiteSEO>;
    const merged: SiteSEO = {
      ...base,
      metaTitle: (proposed.metaTitle || base.metaTitle).slice(0, 60),
      metaDescription: (proposed.metaDescription || base.metaDescription).slice(0, 160),
      keywords: proposed.keywords?.length ? proposed.keywords.slice(0, 12) : base.keywords,
      ogImage: proposed.ogImage || base.ogImage,
      jsonLd: proposed.jsonLd?.length ? proposed.jsonLd : base.jsonLd,
    };
    logStageComplete('seo', { durationMs: r.latencyMs, model: r.model, provider: r.provider, repairsApplied: vr.repairsApplied + rr.repairsApplied, validationPassed: true });
    return merged;
  } catch (err) {
    logStageFailed('seo', err instanceof Error ? err.message : String(err));
    logger.warn('SEO stage fell back to deterministic metadata', LOG);
    return base;
  }
}

function unique(list: string[]): string[] {
  return [...new Set(list.map(s => s.trim()).filter(Boolean))];
}
