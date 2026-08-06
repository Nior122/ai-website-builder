// =============================================================================
// Business Analyzer — first pipeline stage
// =============================================================================
// Turns the user's brief into a structured understanding of the business:
// audience, products, services, goals, primary CTA, personality, location,
// and unique selling point. Every downstream stage reads from this so the
// whole site stays coherent and business-specific.
//
// Failure is non-fatal: the deterministic fallback builds a solid analysis
// from the industry profile, so free-model outages never stall generation.
// =============================================================================

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getModelManager, type ModelManager } from './model-manager';
import { repairAndParse } from './json-repair-engine';
import { safeValidate } from './safe-validation';
import { getIndustryProfile } from './industry-profiles';
import { logStageStart, logStageComplete, logStageFailed } from './observability';
import type { AIErrorContext } from './structured-errors';
import type { GenerateRequest } from '@/types';
import type { GenerationProgress } from '@/features/ai-engine/types';

const LOG = { service: 'business-analysis' } as const;

export interface BusinessAnalysis {
  businessName: string;
  industry: string;
  industryId: string;
  targetAudience: string;
  audiencePainPoints: string[];
  products: string[];
  services: string[];
  businessGoals: string[];
  primaryCta: string;
  tone: string;
  style: string;
  brandPersonality: string[];
  location: string | null;
  uniqueSellingPoint: string;
  competitors: string[];
}

export const businessAnalysisSchema = z.object({
  businessName: z.string().default(''),
  industry: z.string().default(''),
  targetAudience: z.string().default(''),
  audiencePainPoints: z.array(z.string()).default([]),
  products: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  businessGoals: z.array(z.string()).default([]),
  primaryCta: z.string().default(''),
  tone: z.string().default('professional'),
  style: z.string().default(''),
  brandPersonality: z.array(z.string()).default([]),
  location: z.string().nullable().optional().default(null),
  uniqueSellingPoint: z.string().default(''),
  competitors: z.array(z.string()).default([]),
});

export const BUSINESS_ANALYST_SYSTEM_PROMPT = `You are a senior business analyst and brand strategist. Given a business brief, produce a sharp, specific understanding of the business that a professional web agency would use to build its website.

Rules:
- Never use lorem ipsum, generic filler, or placeholder language.
- Be specific and concrete — every line should read as if written for THIS business.
- Infer what the brief does not say, but never invent false facts (avoid made-up names, years, or numbers).
- If the business name is unknown, derive a sensible working name from the industry and description.

Return ONLY valid JSON with this exact structure:
{
  "businessName": "business name",
  "industry": "the industry",
  "targetAudience": "one sentence describing who they serve",
  "audiencePainPoints": ["3-5 specific problems the audience faces"],
  "products": ["specific products or offers, or empty array"],
  "services": ["3-6 specific services this business provides"],
  "businessGoals": ["3-5 realistic business goals"],
  "primaryCta": "the single most important call-to-action button label (e.g. 'Book a Table', 'Start Free Trial')",
  "tone": "professional | casual | luxury | creative | corporate | playful | authoritative | friendly | minimal | bold",
  "style": "one sentence describing the desired visual style",
  "brandPersonality": ["3-4 personality traits as strings"],
  "location": "city/region if known, otherwise null",
  "uniqueSellingPoint": "one sentence: what makes this business different",
  "competitors": ["1-3 likely competitors, or empty array"]
}`;

export function buildBusinessAnalysisPrompt(request: GenerateRequest): string {
  const lines = [
    `Industry: ${request.industry}`,
    `Business type: ${request.businessType}`,
    `Description: ${request.description}`,
    `Business name: ${request.businessName || 'Not provided'}`,
    `Tone preference: ${request.tone || 'professional'}`,
  ];
  if (request.language) lines.push(`Language: ${request.language}`);
  if (request.pages?.length) lines.push(`Requested pages: ${request.pages.join(', ')}`);
  if (request.features?.length) lines.push(`Key features: ${request.features.join(', ')}`);
  return lines.join('\n');
}

/**
 * Deterministic fallback — builds a coherent analysis from the industry
 * profile + the user's brief. Used when the model call fails or returns
 * unusable JSON, so the pipeline never hard-stops on this stage.
 */
export function buildFallbackAnalysis(request: GenerateRequest): BusinessAnalysis {
  const profile = getIndustryProfile(request.industry);
  const name = request.businessName || capitalize(request.industry) + ' ' + titleCase(request.businessType || 'Business');
  const services = profile.services.slice();
  const painPoints = profile.painPoints.slice();
  const goals = profile.goals.slice();
  const tone = request.tone || 'professional';
  return {
    businessName: name,
    industry: request.industry,
    industryId: profile.id,
    targetAudience: profile.audience,
    audiencePainPoints: painPoints,
    products: [],
    services,
    businessGoals: goals,
    primaryCta: profile.primaryCta,
    tone,
    style: directionToStyle(profile.direction),
    brandPersonality: profilePersonality(profile.direction, tone),
    location: extractLocation(request.description),
    uniqueSellingPoint: `We combine deep ${request.industry} expertise with a relentless focus on ${(painPoints[0] || 'customer needs').toLowerCase()}.`,
    competitors: [],
  };
}

/** Run the Business Analyzer stage. */
export async function runBusinessAnalysis(
  request: GenerateRequest,
  mm: ModelManager = getModelManager(),
  context: AIErrorContext = {},
  emit?: (p: GenerationProgress) => void
): Promise<BusinessAnalysis> {
  logStageStart('analyze');
  try {
    const r = await mm.executeWithFallback<string>({
      system: BUSINESS_ANALYST_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildBusinessAnalysisPrompt(request) }],
      stage: 'analyze',
    }, { ...context, stage: 'analyze' });
    if (!r.data) throw new Error('Empty response');
    const rr = repairAndParse(r.data);
    if (!rr.success) throw new Error(`JSON repair failed: ${rr.error}`);
    const vr = safeValidate(businessAnalysisSchema, rr.data, { defaultBasePath: 'analysis', verbose: true });
    if (!vr.success) throw new Error(`Validation failed: ${vr.error}`);
    const analysis = vr.data as BusinessAnalysis;
    analysis.industryId = analysis.industry ? getIndustryProfile(analysis.industry).id : getIndustryProfile(request.industry).id;
    if (!analysis.businessName) analysis.businessName = buildFallbackAnalysis(request).businessName;
    if (!analysis.primaryCta) analysis.primaryCta = getIndustryProfile(request.industry).primaryCta;
    logStageComplete('analyze', { durationMs: r.latencyMs, model: r.model, provider: r.provider, repairsApplied: vr.repairsApplied + rr.repairsApplied, validationPassed: true });
    return analysis;
  } catch (err) {
    logStageFailed('analyze', err instanceof Error ? err.message : String(err));
    const fb = buildFallbackAnalysis(request);
    logger.warn('Business Analyzer fell back to deterministic profile', { ...LOG, industry: request.industry });
    return fb;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

function titleCase(s: string): string {
  return s.split(/[\s-]+/).filter(Boolean).map(capitalize).join(' ');
}

function directionToStyle(direction: string): string {
  const map: Record<string, string> = {
    'modern-saas': 'Clean, modern, and conversion-focused with generous whitespace and bold indigo accents.',
    'warm-hospitality': 'Warm and inviting with earthy tones, soft textures, and an appetite-driven layout.',
    'trust-authoritative': 'Authoritative and reassuring with deep navy, serif headings, and a restrained layout.',
    'elegant-soft': 'Elegant and soft with refined serif accents, airy spacing, and delicate pastel highlights.',
    'commerce-bold': 'Bold and energetic with strong contrast, product-forward imagery, and clear pricing.',
    'friendly-trust': 'Friendly and trustworthy with approachable colors, rounded shapes, and clear navigation.',
    'clinical-calm': 'Calm and clinical with cool teals, clean lines, and a focus on clarity and care.',
    'industrial-solid': 'Solid and industrial with strong typography, rugged textures, and confident framing.',
    'energetic-bold': 'Energetic and bold with high-contrast colors, dynamic angles, and motivational energy.',
    'wanderlust-fresh': 'Fresh and wanderlust-filled with sky tones, open layouts, and inviting photography.',
    'warm-inviting': 'Warm and inviting with natural greens, welcoming shapes, and a community-first feel.',
    'creative-bold': 'Creative and bold with expressive color, playful layouts, and portfolio-first design.',
    'premium-clean': 'Premium and clean with refined serifs, generous spacing, and understated luxury.',
    'luxury-calm': 'Luxury and calm with dark neutrals, gold accents, and timeless, elegant proportions.',
    minimal: 'Minimal and focused with monochrome palettes, sharp type, and restrained decoration.',
  };
  return map[direction] || 'Clean, modern, and professional.';
}

function profilePersonality(direction: string, tone: string): string[] {
  const byDirection: Record<string, string[]> = {
    'modern-saas': ['Innovative', 'Efficient', 'Confident'],
    'warm-hospitality': ['Welcoming', 'Generous', 'Authentic'],
    'trust-authoritative': ['Authoritative', 'Reliable', 'Detail-Oriented'],
    'elegant-soft': ['Refined', 'Caring', 'Graceful'],
    'commerce-bold': ['Bold', 'Energetic', 'Customer-First'],
    'friendly-trust': ['Approachable', 'Dependable', 'Enthusiastic'],
    'clinical-calm': ['Compassionate', 'Precise', 'Reassuring'],
    'industrial-solid': ['Hardworking', 'Dependable', 'Direct'],
    'energetic-bold': ['Motivating', 'Bold', 'Resilient'],
    'wanderlust-fresh': ['Adventurous', 'Helpful', 'Joyful'],
    'warm-inviting': ['Welcoming', 'Compassionate', 'Grounded'],
    'creative-bold': ['Visionary', 'Playful', 'Fearless'],
    'premium-clean': ['Sophisticated', 'Precise', 'Discerning'],
    'luxury-calm': ['Refined', 'Serene', 'Exclusive'],
    minimal: ['Focused', 'Clear', 'Disciplined'],
  };
  return byDirection[direction] || [capitalize(tone), 'Trustworthy', 'Professional'];
}

function extractLocation(description: string): string | null {
  // Heuristic: "based in <City>", "<City>, <Region>", "located in <City>".
  const patterns = [
    /based in\s+([A-Z][a-zA-Z .]+?)(?:\.|,|\n|$)/,
    /located in\s+([A-Z][a-zA-Z .]+?)(?:\.|,|\n|$)/,
    /serving\s+([A-Z][a-zA-Z .]+?)(?:\.|,|\n|$)/,
  ];
  for (const re of patterns) {
    const m = description.match(re);
    if (m) return m[1].trim();
  }
  return null;
}
