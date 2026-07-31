// =============================================================================
// Branding Engine
// =============================================================================
// Builds the brand identity layer: name, tagline, description, tone voice
// rules, mission/vision/values, and the brand's style direction (button,
// card, icon, illustration, photography, animation). Everything downstream
// (theme, sections, copy) stays consistent with this brand definition.
// =============================================================================

import type { BrandDesign, DesignBrief } from './types';

// ─── Tone Voice Rules ───────────────────────────────────────────────────

export const TONE_VOICE_RULES: Record<string, string[]> = {
  professional: [
    'Use precise, confident language. No hype words.',
    'Address the reader as "you"; refer to the business by name.',
    'Every claim is specific and verifiable.',
  ],
  casual: [
    'Write like a knowledgeable friend. Short sentences.',
    'Contractions welcome; jargon forbidden.',
    'Be warm but never flippant.',
  ],
  luxury: [
    'Understated elegance. Fewer words, more weight.',
    'Never mention price or discounts in headlines.',
    'Evoke craftsmanship, heritage, and exclusivity.',
  ],
  creative: [
    'Play with metaphor and rhythm; keep meaning crystal clear.',
    'Bold openings; unexpected but logical word pairings.',
    'Never use stock-phrase filler.',
  ],
  corporate: [
    'Structured, stakeholder-friendly language.',
    'Lead with outcomes and measurable results.',
    'Consistent terminology across all sections.',
  ],
  playful: [
    'Light, energetic, human. A wink is allowed — once per page.',
    'Keep the benefit unmistakable under the humor.',
  ],
  authoritative: [
    'Direct, decisive statements. Minimal hedging.',
    'Support claims with numbers and credentials.',
  ],
  friendly: [
    'Approachable and inclusive. "We" for the brand, "you" for the reader.',
    'Anticipate questions and answer them in copy.',
  ],
  minimal: [
    'Every word earns its place. No adjectives that don’t differentiate.',
    'Short headlines; factual subheadlines.',
  ],
  bold: [
    'Big statements, big contrast, big type energy.',
    'Short punchy sentences. Repetition for rhythm.',
  ],
};

const DEFAULT_VOICE = TONE_VOICE_RULES.professional;

// ─── Name Derivation ───────────────────────────────────────────────────

/**
 * Derive a business name from the brief: explicit name wins, otherwise a
 * title-cased first significant token of the description.
 */
export function deriveBusinessName(brief: DesignBrief): string {
  if (brief.businessName && brief.businessName.trim()) {
    return brief.businessName.trim();
  }
  const words = brief.description.trim().split(/\s+/).filter((w) => w.length > 2);
  const candidate = words[0];
  if (!candidate) return 'Untitled Business';
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}

// ─── Tagline Templates (tone-aware) ─────────────────────────────────────

const TAGLINES: Record<string, string[]> = {
  professional: [
    '{name} delivers {industry} excellence with measurable results.',
    'Precision {industry} services built around your goals.',
  ],
  casual: [
    '{name} makes {industry} simple, friendly, and stress-free.',
    'The easy way to get {industry} done right.',
  ],
  luxury: [
    '{name} — {industry} artistry, refined to perfection.',
    'Exceptional {industry} experiences, quietly delivered.',
  ],
  creative: [
    '{name} turns {industry} into something worth talking about.',
    'Fresh {industry} thinking for people who notice details.',
  ],
  playful: [
    '{name} does {industry} with a smile (and great results).',
    'Big {industry} wins, zero boring meetings.',
  ],
  bold: [
    '{name} redefines what {industry} should be.',
    'Uncompromising {industry}. No shortcuts. Ever.',
  ],
  authoritative: [
    '{name} sets the standard in {industry}.',
    'Trusted {industry} leadership for serious organizations.',
  ],
  friendly: [
    '{name} is here to make {industry} feel effortless.',
    'Friendly {industry} support from people who care.',
  ],
  minimal: [
    '{name}. {Industry} clarity.',
    'Focused {industry} services, nothing extra.',
  ],
};

// ─── Builder ────────────────────────────────────────────────────────────

export interface BrandStyleDirection {
  button: string;
  card: string;
  icon: string;
  illustration: string;
  photography: string;
  animation: string;
}

/** Map tone → style direction tokens. */
export function styleDirectionForTone(tone: string): BrandStyleDirection {
  const t = tone.trim().toLowerCase();
  switch (t) {
    case 'luxury':
      return { button: 'solid-subtle', card: 'minimal-border', icon: 'outline-thin', illustration: 'editorial', photography: 'natural-warm', animation: 'slow-refined' };
    case 'minimal':
      return { button: 'ghost', card: 'flat', icon: 'line', illustration: 'geometric', photography: 'high-contrast', animation: 'subtle-fade' };
    case 'creative':
    case 'playful':
      return { button: 'rounded-full', card: 'soft', icon: 'duotone', illustration: 'modern-flat', photography: 'candid', animation: 'playful' };
    case 'bold':
      return { button: 'solid-strong', card: 'elevated', icon: 'solid-bold', illustration: 'bold-flat', photography: 'dramatic', animation: 'punchy' };
    case 'friendly':
      return { button: 'rounded-lg', card: 'rounded-soft', icon: 'friendly', illustration: 'warm-flat', photography: 'natural-warm', animation: 'friendly' };
    case 'authoritative':
      return { button: 'solid-strong', card: 'bordered', icon: 'outline-1.5', illustration: 'precise', photography: 'corporate', animation: 'measured' };
    case 'casual':
      return { button: 'rounded-lg', card: 'soft', icon: 'outline-1.5', illustration: 'modern-flat', photography: 'candid', animation: 'friendly' };
    case 'corporate':
      return { button: 'solid', card: 'bordered', icon: 'outline-1.5', illustration: 'precise', photography: 'corporate', animation: 'professional' };
    case 'professional':
    default:
      return { button: 'solid', card: 'bordered', icon: 'outline-1.5', illustration: 'modern-flat', photography: 'natural-warm', animation: 'subtle-fade' };
  }
}

export function buildBrandDesign(brief: DesignBrief): BrandDesign {
  const tone = brief.tone && TONE_VOICE_RULES[brief.tone] ? brief.tone : 'professional';
  const name = deriveBusinessName(brief);
  const industryLabel = brief.industry.charAt(0).toUpperCase() + brief.industry.slice(1);

  const taglinePool = TAGLINES[tone] ?? TAGLINES.professional!;
  const tagline = taglinePool[0]
    .replaceAll('{name}', name)
    .replaceAll('{industry}', brief.industry)
    .replaceAll('{Industry}', industryLabel);

  return {
    name,
    tagline,
    description: brief.description,
    tone,
    mission: `To help ${brief.industry} clients achieve their goals through ${brief.businessType} excellence.`,
    vision: `To be the most trusted ${brief.businessType} name in ${brief.industry}.`,
    values: ['Integrity', 'Excellence', 'Customer Focus', 'Innovation'],
    voiceRules: TONE_VOICE_RULES[tone] ?? DEFAULT_VOICE,
    style: styleDirectionForTone(tone),
  };
}
