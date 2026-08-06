// =============================================================================
// Design Generation Engine — Smart Section Ordering
// =============================================================================
// Section sequences are chosen per industry archetype, tuned for conversion
// and storytelling. The same section types are never generated in the same
// order across industries (unless their goals genuinely match).
// =============================================================================

import type { IndustryProfile } from './types';

/** Archetype → preferred section sequence (storytelling + conversion aware). */
export const SECTION_ORDER_ARCHETYPES: Record<string, string[]> = {
  dining: ['hero', 'menu', 'gallery', 'testimonials', 'reservation', 'chef', 'faq', 'contact'],
  saas: ['hero', 'features', 'integrations', 'pricing', 'testimonials', 'faq', 'cta'],
  medical: ['hero', 'services', 'why-us', 'stats', 'testimonials', 'booking', 'faq', 'contact'],
  legal: ['hero', 'practice-areas', 'about', 'testimonials', 'process', 'faq', 'contact'],
  education: ['hero', 'programs', 'stats', 'testimonials', 'faculty', 'admissions', 'faq', 'contact'],
  beauty: ['hero', 'services', 'gallery', 'pricing', 'testimonials', 'booking', 'faq', 'contact'],
  fitness: ['hero', 'programs', 'stats', 'trainers', 'pricing', 'testimonials', 'membership', 'contact'],
  realestate: ['hero', 'featured', 'gallery', 'agents', 'testimonials', 'contact'],
  travel: ['hero', 'destinations', 'gallery', 'experiences', 'testimonials', 'booking', 'faq', 'contact'],
  creative: ['hero', 'portfolio', 'gallery', 'services', 'process', 'testimonials', 'contact'],
  agency: ['hero', 'services', 'work', 'process', 'testimonials', 'pricing', 'contact'],
  ecommerce: ['hero', 'categories', 'featured', 'products', 'testimonials', 'newsletter', 'contact'],
  corporate: ['hero', 'services', 'stats', 'about', 'testimonials', 'contact'],
  finance: ['hero', 'services', 'stats', 'about', 'testimonials', 'faq', 'contact'],
  events: ['hero', 'gallery', 'services', 'testimonials', 'booking', 'faq', 'contact'],
  community: ['hero', 'about', 'gallery', 'events', 'testimonials', 'get-involved', 'contact'],
  default: ['hero', 'features', 'statistics', 'testimonials', 'pricing', 'cta', 'contact'],
};

/** Industry id → archetype (falls back to `default`). */
const INDUSTRY_ARCHETYPE: Record<string, string> = {
  restaurant: 'dining',
  'law-firm': 'legal',
  hospital: 'medical',
  hotel: 'travel',
  school: 'education',
  church: 'community',
  'beauty-salon': 'beauty',
  barbershop: 'beauty',
  fashion: 'creative',
  gym: 'fitness',
  'real-estate': 'realestate',
  construction: 'corporate',
  travel: 'travel',
  crypto: 'saas',
  saas: 'saas',
  portfolio: 'creative',
  agency: 'agency',
  photography: 'creative',
  architecture: 'corporate',
  consulting: 'corporate',
  automotive: 'corporate',
  healthcare: 'medical',
  education: 'education',
  'non-profit': 'community',
  ecommerce: 'ecommerce',
  'financial-services': 'finance',
  'event-planning': 'events',
  wedding: 'events',
  music: 'creative',
  creator: 'creative',
  'ai-startup': 'saas',
  technology: 'saas',
  marketing: 'agency',
  dentist: 'medical',
  'interior-design': 'corporate',
};

export interface SectionOrderingOptions {
  /** Prefer a conversion-first sequence (CTA earlier, fewer story sections). */
  conversionFirst?: boolean;
}

/** Conversion-optimized variants for the main archetypes. */
const CONVERSION_VARIANTS: Record<string, string[]> = {
  saas: ['hero', 'pricing', 'features', 'testimonials', 'faq', 'cta'],
  dining: ['hero', 'reservation', 'menu', 'testimonials', 'contact'],
  medical: ['hero', 'booking', 'services', 'testimonials', 'contact'],
  ecommerce: ['hero', 'featured', 'products', 'newsletter', 'contact'],
};

/**
 * Build the section order for an industry. Uses the archetype sequence, with
 * an optional conversion-first reshuffle; unknown archetypes get a sensible
 * generic sequence.
 */
export function buildSectionOrder(profile: IndustryProfile, options: SectionOrderingOptions = {}): string[] {
  const archetype = INDUSTRY_ARCHETYPE[profile.id] ?? 'default';
  if (options.conversionFirst && CONVERSION_VARIANTS[archetype]) {
    return [...CONVERSION_VARIANTS[archetype]];
  }
  return [...(SECTION_ORDER_ARCHETYPES[archetype] ?? SECTION_ORDER_ARCHETYPES.default)];
}

export function listArchetypes(): string[] {
  return Object.keys(SECTION_ORDER_ARCHETYPES);
}
