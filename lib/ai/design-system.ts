// =============================================================================
// Design System Builder — brand identity + full visual design tokens
// =============================================================================
// Two stages in one module:
//   1. Brand identity   — name, tagline, tone, personality, USP (LLM, refined).
//   2. Design tokens    — colors (incl. neutral shades + gradients), fonts,
//                         radius, shadows, spacing, buttons, cards, icons, and
//                         an overall direction.
//
// Design tokens always start from the curated industry profile and only accept
// model refinements that validate (correct hex, known shape). This guarantees
// a production-quality visual system even when a free model returns garbage.
// =============================================================================

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getModelManager, type ModelManager } from './model-manager';
import { repairAndParse } from './json-repair-engine';
import { safeValidate } from './safe-validation';
import { getIndustryProfile, directionLabel, type IndustryProfile } from './industry-profiles';
import { logStageStart, logStageComplete, logStageFailed } from './observability';
import type { AIErrorContext } from './structured-errors';
import type { GenerateRequest } from '@/types';
import type { BusinessAnalysis } from './business-analysis';
import type { GenerationProgress } from '@/features/ai-engine/types';

const LOG = { service: 'design-system' } as const;

// ─── Brand identity ────────────────────────────────────────────────────

export interface BrandIdentity {
  name: string;
  tagline: string;
  description: string;
  tone: string;
  mission: string;
  vision: string;
  values: string[];
  personality: string[];
  uniqueSellingPoint: string;
  colors?: Record<string, string>;
  typography?: { heading: string; body: string; mono?: string };
}

const brandSchema = z.object({
  name: z.string().default(''),
  tagline: z.string().default(''),
  description: z.string().default(''),
  tone: z.string().default('professional'),
  mission: z.string().default(''),
  vision: z.string().default(''),
  values: z.array(z.string()).default([]),
  personality: z.array(z.string()).default([]),
  uniqueSellingPoint: z.string().default(''),
  colors: z.record(z.string()).optional(),
  typography: z.object({ heading: z.string(), body: z.string(), mono: z.string().optional() }).optional(),
});

const BRAND_SYSTEM_PROMPT = `You are an expert brand strategist and copywriter. Based on the business analysis provided, write a complete brand identity with original, specific, persuasive copy.

Rules:
- Write every line for THIS business — never generic AI filler, lorem ipsum, or repeated text.
- Headlines and taglines must be strong, specific, and benefit-driven.
- 3-5 values and personality traits, each a short concrete string.
- mission and vision: one powerful sentence each.

Return ONLY valid JSON:
{
  "name": "Business name",
  "tagline": "8-12 word compelling tagline",
  "description": "2-3 sentence brand description",
  "tone": "professional | casual | luxury | creative | corporate | playful | authoritative | friendly | minimal | bold",
  "mission": "one sentence mission",
  "vision": "one sentence vision",
  "values": ["3-5 core values"],
  "personality": ["3-5 brand personality traits"],
  "uniqueSellingPoint": "one sentence on what makes this business different"
}`;

export function buildBrandPrompt(analysis: BusinessAnalysis, request: GenerateRequest): string {
  return [
    `Business: ${analysis.businessName}`,
    `Industry: ${analysis.industry}`,
    `Type: ${request.businessType}`,
    `Tone: ${analysis.tone || request.tone || 'professional'}`,
    `Target audience: ${analysis.targetAudience}`,
    `Services: ${analysis.services.join(', ') || 'Not provided'}`,
    `Products: ${analysis.products.join(', ') || 'Not provided'}`,
    `Goals: ${analysis.businessGoals.join('; ') || 'Not provided'}`,
    `Primary CTA: ${analysis.primaryCta}`,
    `USP: ${analysis.uniqueSellingPoint}`,
    `Brief: ${request.description}`,
  ].join('\n');
}

export function buildFallbackBrand(analysis: BusinessAnalysis, request: GenerateRequest): BrandIdentity {
  const profile = getIndustryProfile(analysis.industryId || request.industry);
  const name = analysis.businessName || request.businessName || `${capitalize(request.industry)} ${titleCase(request.businessType || 'Business')}`;
  const pain = analysis.audiencePainPoints[0] || 'their biggest challenges';
  return {
    name,
    tagline: buildTagline(profile, analysis, name),
    description: `${name} helps ${(analysis.targetAudience || profile.audience).toLowerCase()} ${(analysis.businessGoals[0] || 'succeed').toLowerCase()}. We deliver ${(analysis.services[0] || profile.services[0] || 'exceptional work')}, built on ${(analysis.brandPersonality[0] || 'integrity').toLowerCase()} and a deep understanding of ${analysis.industry}.`,
    tone: analysis.tone || request.tone || 'professional',
    mission: `Our mission is to help ${(analysis.targetAudience || profile.audience).toLowerCase()} achieve ${(analysis.businessGoals[0] || 'their goals').toLowerCase()} through ${(analysis.services[0] || 'exceptional service').toLowerCase()}.`,
    vision: `To be the most trusted ${profile.direction.replace(/-/g, ' ')} provider in ${analysis.industry}.`,
    values: (profile.pages.length ? ['Integrity', 'Excellence', 'Customer Focus', 'Innovation', 'Reliability'] : []).slice(0, 4),
    personality: analysis.brandPersonality.length ? analysis.brandPersonality : ['Professional', 'Trustworthy', 'Customer-Focused'],
    uniqueSellingPoint: analysis.uniqueSellingPoint || `We solve ${pain} better than anyone else in ${analysis.industry}.`,
  };
}

/** Run the brand identity stage. */
export async function runBrandGeneration(
  analysis: BusinessAnalysis,
  request: GenerateRequest,
  mm: ModelManager = getModelManager(),
  context: AIErrorContext = {},
  emit?: (p: GenerationProgress) => void
): Promise<BrandIdentity> {
  logStageStart('brand');
  try {
    const r = await mm.executeWithFallback<string>({
      system: BRAND_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildBrandPrompt(analysis, request) }],
      stage: 'brand',
    }, { ...context, stage: 'brand' });
    if (!r.data) throw new Error('Empty response');
    const rr = repairAndParse(r.data);
    if (!rr.success) throw new Error(`JSON repair failed: ${rr.error}`);
    const vr = safeValidate(brandSchema, rr.data, { defaultBasePath: 'brand', verbose: true });
    if (!vr.success) throw new Error(`Validation failed: ${vr.error}`);
    const brand = vr.data as BrandIdentity;
    const fb = buildFallbackBrand(analysis, request);
    if (!brand.name) brand.name = fb.name;
    if (!brand.tagline) brand.tagline = fb.tagline;
    if (!brand.description) brand.description = fb.description;
    if (!brand.mission) brand.mission = fb.mission;
    if (!brand.vision) brand.vision = fb.vision;
    if (!brand.uniqueSellingPoint) brand.uniqueSellingPoint = fb.uniqueSellingPoint;
    logStageComplete('brand', { durationMs: r.latencyMs, model: r.model, provider: r.provider, repairsApplied: vr.repairsApplied + rr.repairsApplied, validationPassed: true });
    return brand;
  } catch (err) {
    logStageFailed('brand', err instanceof Error ? err.message : String(err));
    logger.warn('Brand stage fell back to deterministic identity', LOG);
    return buildFallbackBrand(analysis, request);
  }
}

// ─── Design tokens ─────────────────────────────────────────────────────

export interface DesignTokens {
  direction: string;
  directionLabel: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: Record<string, string>;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    gradient: { primary: string; secondary: string; accent: string };
  };
  typography: { heading: string; body: string; mono: string };
  borderRadius: { sm: string; md: string; lg: string; xl: string; full: string };
  shadows: { sm: string; md: string; lg: string };
  spacing: { unit: number; scale: number[] };
  buttons: { style: string; radius: string; textTransform: string; fontWeight: string };
  cards: { style: string; radius: string; shadow: string; padding: string };
  icons: { style: string; strokeWidth: number };
}

const designSchema = z.object({
  preset: z.string().optional().default('professional'),
  mode: z.string().optional().default('light'),
  colors: z.record(z.string()).optional(),
  typography: z.object({ heading: z.string().optional(), body: z.string().optional(), mono: z.string().optional() }).optional(),
  borderRadius: z.record(z.string()).optional(),
  shadows: z.record(z.string()).optional(),
});

const DESIGN_SYSTEM_PROMPT = `You are an expert UI designer. Based on the business analysis and brand, suggest refinements to the visual design system.

Rules:
- Only suggest specific, valid refinements. Hex colors must be exactly 6-digit hex (e.g. #4F46E5).
- Fonts must be real Google Font names (e.g. Inter, Playfair Display, Space Grotesk, Lato, Poppins).
- Keep the palette cohesive: one primary, one secondary, one accent.

Return ONLY valid JSON:
{
  "preset": "professional | minimal | creative | bold | elegant | playful | corporate | luxury",
  "mode": "light | dark",
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" },
  "typography": { "heading": "Google Font", "body": "Google Font" },
  "borderRadius": { "sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "full": "9999px" },
  "shadows": { "sm": "0 1px 2px rgba(0,0,0,0.05)", "md": "0 4px 6px rgba(0,0,0,0.07)", "lg": "0 10px 15px rgba(0,0,0,0.1)" }
}`;

export function buildDesignPrompt(analysis: BusinessAnalysis, brand: BrandIdentity): string {
  return [
    `Business: ${brand.name || analysis.businessName}`,
    `Industry: ${analysis.industry}`,
    `Direction: ${getIndustryProfile(analysis.industryId || analysis.industry).direction}`,
    `Tone: ${brand.tone || analysis.tone || 'professional'}`,
    `Audience: ${analysis.targetAudience}`,
    `USP: ${brand.uniqueSellingPoint || analysis.uniqueSellingPoint}`,
    `Existing colors: ${JSON.stringify(brand.colors || {})}`,
  ].join('\n');
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const KNOWN_FONTS = new Set([
  'Inter', 'Playfair Display', 'Lato', 'Montserrat', 'Poppins', 'Space Grotesk',
  'Source Serif 4', 'Source Sans 3', 'Merriweather', 'Open Sans', 'Archivo',
  'Archivo Black', 'Cormorant Garamond', 'DM Serif Display', 'Lora', 'Nunito', 'Roboto',
]);

/** Build the full, validated design-token set from an industry profile. */
export function buildDesignTokens(profile: IndustryProfile, brand?: BrandIdentity, modelDesign?: unknown): DesignTokens {
  const design = (modelDesign && typeof modelDesign === 'object' ? modelDesign : {}) as Record<string, unknown>;
  const colors = (design.colors && typeof design.colors === 'object' ? design.colors : {}) as Record<string, string>;
  const typo = (design.typography && typeof design.typography === 'object' ? design.typography : {}) as Record<string, string>;

  const primary = validHex(colors.primary) ? colors.primary : (brand?.colors?.primary || profile.palette.primary);
  const secondary = validHex(colors.secondary) ? colors.secondary : (brand?.colors?.secondary || profile.palette.secondary);
  const accent = validHex(colors.accent) ? colors.accent : (brand?.colors?.accent || profile.palette.accent);
  const heading = validFont(typo.heading) ? typo.heading : (brand?.typography?.heading || profile.fonts.heading);
  const body = validFont(typo.body) ? typo.body : (brand?.typography?.body || profile.fonts.body);

  const baseRadius = parseRem(profile.radius);
  const radius = {
    sm: `${round(baseRadius * 0.5)}rem`,
    md: `${round(baseRadius)}rem`,
    lg: `${round(baseRadius * 1.5)}rem`,
    xl: `${round(baseRadius * 2)}rem`,
    full: '9999px',
  };
  const shadows = shadowsFor(profile.shadow);

  return {
    direction: profile.direction,
    directionLabel: directionLabel(profile.direction),
    colors: {
      primary,
      secondary,
      accent,
      neutral: neutralScale(profile.neutral),
      background: profile.palette.background,
      surface: profile.palette.surface,
      text: profile.palette.text,
      textSecondary: profile.palette.textSecondary,
      border: profile.palette.border,
      gradient: { primary, secondary, accent },
    },
    typography: { heading, body, mono: validFont(typo.mono) ? typo.mono : profile.fonts.mono },
    borderRadius: radius,
    shadows,
    spacing: { unit: 4, scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64] },
    buttons: buttonStyleFor(profile.direction, radius.md),
    cards: cardStyleFor(profile.direction, radius.md, shadows.md),
    icons: iconStyleFor(profile.direction),
  };
}

/** Run the design stage and merge model refinements over curated tokens. */
export async function runDesignGeneration(
  analysis: BusinessAnalysis,
  brand: BrandIdentity,
  request: GenerateRequest,
  mm: ModelManager = getModelManager(),
  context: AIErrorContext = {},
  emit?: (p: GenerationProgress) => void
): Promise<DesignTokens> {
  logStageStart('design');
  const profile = getIndustryProfile(analysis.industryId || request.industry);
  try {
    const r = await mm.executeWithFallback<string>({
      system: DESIGN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildDesignPrompt(analysis, brand) }],
      stage: 'design',
    }, { ...context, stage: 'design' });
    if (!r.data) throw new Error('Empty response');
    const rr = repairAndParse(r.data);
    if (!rr.success) throw new Error(`JSON repair failed: ${rr.error}`);
    const vr = safeValidate(designSchema, rr.data, { defaultBasePath: 'design', verbose: true });
    if (!vr.success) throw new Error(`Validation failed: ${vr.error}`);
    logStageComplete('design', { durationMs: r.latencyMs, model: r.model, provider: r.provider, repairsApplied: vr.repairsApplied + rr.repairsApplied, validationPassed: true });
    return buildDesignTokens(profile, brand, vr.data);
  } catch (err) {
    logStageFailed('design', err instanceof Error ? err.message : String(err));
    logger.warn('Design stage fell back to curated industry tokens', LOG);
    return buildDesignTokens(profile, brand);
  }
}

/** Build the full theme record (the shape the normalizer/renderer expects). */
export function buildThemeFromTokens(design: DesignTokens): Record<string, unknown> {
  const c = design.colors;
  return {
    preset: design.direction,
    mode: 'light',
    colors: {
      primary: shadeScale(c.primary),
      secondary: shadeScale(c.secondary),
      accent: shadeScale(c.accent),
      neutral: c.neutral,
      background: c.background,
      surface: c.surface,
      surfaceHover: c.surface,
      text: c.text,
      textSecondary: c.textSecondary,
      textMuted: c.textSecondary,
      border: c.border,
      borderLight: c.neutral['200'],
      success: shadeScale('#16A34A'),
      warning: shadeScale('#D97706'),
      error: shadeScale('#DC2626'),
      info: shadeScale('#0284C7'),
      gradient: {
        primary: `linear-gradient(135deg, ${c.primary} 0%, ${c.secondary} 100%)`,
        secondary: `linear-gradient(135deg, ${c.secondary} 0%, ${c.accent} 100%)`,
        accent: `linear-gradient(135deg, ${c.accent} 0%, ${c.primary} 100%)`,
        mesh: `radial-gradient(at 20% 20%, ${c.primary}33 0px, transparent 50%), radial-gradient(at 80% 0%, ${c.secondary}33 0px, transparent 50%), radial-gradient(at 60% 100%, ${c.accent}33 0px, transparent 50%)`,
      },
    },
    typography: {
      fontFamily: { heading: design.typography.heading, body: design.typography.body, mono: design.typography.mono },
      scale: 1,
      lineHeight: { tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 },
    },
    spacing: design.spacing,
    borderRadius: design.borderRadius,
    shadows: design.shadows,
    animations: { enabled: true, duration: 300, easing: 'ease-out' },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────

function validHex(v?: string): boolean {
  return typeof v === 'string' && HEX_RE.test(v.trim());
}
function validFont(v?: string): boolean {
  return typeof v === 'string' && v.trim().length > 0 && (KNOWN_FONTS.has(v.trim()) || v.trim().length <= 40);
}
function parseRem(s: string): number {
  const m = s.match(/^([\d.]+)\s*rem$/);
  return m ? parseFloat(m[1]) : 0.75;
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function neutralScale(neutral: 'cool' | 'warm'): Record<string, string> {
  const cool: Array<[string, string]> = [
    ['50', '#F8FAFC'], ['100', '#F1F5F9'], ['200', '#E2E8F0'], ['300', '#CBD5E1'],
    ['400', '#94A3B8'], ['500', '#64748B'], ['600', '#475569'], ['700', '#334155'],
    ['800', '#1E293B'], ['900', '#0F172A'], ['950', '#020617'],
  ];
  const warm: Array<[string, string]> = [
    ['50', '#FAFAF9'], ['100', '#F5F5F4'], ['200', '#E7E5E4'], ['300', '#D6D3D1'],
    ['400', '#A8A29E'], ['500', '#78716C'], ['600', '#57534E'], ['700', '#44403C'],
    ['800', '#292524'], ['900', '#1C1917'], ['950', '#0C0A09'],
  ];
  return Object.fromEntries(neutral === 'warm' ? warm : cool);
}

function shadowsFor(level: 'sm' | 'md' | 'lg'): DesignTokens['shadows'] {
  const sets: Record<string, DesignTokens['shadows']> = {
    sm: {
      sm: '0 1px 2px rgba(15,23,42,0.05)',
      md: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
      lg: '0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.06)',
    },
    md: {
      sm: '0 1px 2px rgba(15,23,42,0.06)',
      md: '0 4px 6px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.05)',
      lg: '0 10px 15px rgba(15,23,42,0.10), 0 4px 6px rgba(15,23,42,0.06)',
    },
    lg: {
      sm: '0 2px 4px rgba(15,23,42,0.08)',
      md: '0 10px 15px rgba(15,23,42,0.10), 0 4px 6px rgba(15,23,42,0.06)',
      lg: '0 20px 25px rgba(15,23,42,0.14), 0 10px 10px rgba(15,23,42,0.08)',
    },
  };
  return sets[level];
}

function buttonStyleFor(direction: string, radius: string): DesignTokens['buttons'] {
  if (direction === 'trust-authoritative' || direction === 'luxury-calm' || direction === 'premium-clean') {
    return { style: 'solid', radius, textTransform: 'uppercase', fontWeight: '600' };
  }
  if (direction === 'creative-bold' || direction === 'commerce-bold' || direction === 'energetic-bold') {
    return { style: 'gradient', radius, textTransform: 'none', fontWeight: '700' };
  }
  return { style: 'solid', radius, textTransform: 'none', fontWeight: '600' };
}

function cardStyleFor(direction: string, radius: string, shadow: string): DesignTokens['cards'] {
  const elevated = direction === 'commerce-bold' || direction === 'creative-bold' || direction === 'energetic-bold';
  const minimal = direction === 'minimal' || direction === 'trust-authoritative';
  if (minimal) return { style: 'bordered', radius, shadow: 'none', padding: '2rem' };
  if (elevated) return { style: 'elevated', radius, shadow, padding: '2rem' };
  return { style: 'soft', radius, shadow, padding: '2rem' };
}

function iconStyleFor(direction: string): DesignTokens['icons'] {
  if (direction === 'elegant-soft' || direction === 'luxury-calm') return { style: 'outline', strokeWidth: 1.25 };
  if (direction === 'industrial-solid' || direction === 'energetic-bold') return { style: 'filled', strokeWidth: 2 };
  return { style: 'outline', strokeWidth: 1.5 };
}

function shadeScale(hex: string): Record<string, string> {
  const base = hexToRgb(hex) || { r: 37, g: 99, b: 235 };
  const stops: Array<[string, number]> = [
    ['50', 0.95], ['100', 0.88], ['200', 0.75], ['300', 0.6], ['400', 0.35],
    ['500', 0], ['600', -0.12], ['700', -0.25], ['800', -0.4], ['900', -0.55], ['950', -0.68],
  ];
  const out: Record<string, string> = {};
  for (const [key, t] of stops) {
    const mixed = t >= 0 ? mix(base, { r: 255, g: 255, b: 255 }, t) : mix(base, { r: 0, g: 0, b: 0 }, -t);
    out[key] = toHex(mixed);
  }
  return out;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-fA-F]{6})$/i);
  if (!m) return null;
  return {
    r: parseInt(m[1].slice(0, 2), 16),
    g: parseInt(m[1].slice(2, 4), 16),
    b: parseInt(m[1].slice(4, 6), 16),
  };
}

function mix(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number): { r: number; g: number; b: number } {
  return {
    r: Math.max(0, Math.min(255, Math.round(a.r + (b.r - a.r) * t))),
    g: Math.max(0, Math.min(255, Math.round(a.g + (b.g - a.g) * t))),
    b: Math.max(0, Math.min(255, Math.round(a.b + (b.b - a.b) * t))),
  };
}

function toHex(c: { r: number; g: number; b: number }): string {
  return `#${[c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function buildTagline(profile: IndustryProfile, analysis: BusinessAnalysis, name: string): string {
  const goal = analysis.businessGoals[0] || profile.goals[0] || 'success';
  const audience = analysis.targetAudience || profile.audience;
  const templates = [
    `${name}: where ${audience.toLowerCase()} achieve ${goal.toLowerCase()} with confidence.`,
    `Helping ${audience.toLowerCase()} reach ${goal.toLowerCase()} — with a partner you can trust.`,
    `${profile.primaryCta} today and experience ${analysis.industry} done right.`,
  ];
  return templates[Math.abs(hash(name + goal)) % templates.length];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}
function titleCase(s: string): string {
  return s.split(/[\s-]+/).filter(Boolean).map(capitalize).join(' ');
}
