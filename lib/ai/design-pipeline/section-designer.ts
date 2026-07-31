// =============================================================================
// Section Designer
// =============================================================================
// Professional blueprint for every supported section type: layout direction,
// spacing rhythm, elevation, radius, typography tokens, and ARIA notes.
// All 25 supported section types are covered.
// =============================================================================

import type { BrandDesign, DesignBrief, DesignTokens, SectionBlueprint } from './types';

export interface SectionTypeConfig {
  type: string;
  layout: string;
  order: number;
  spacing: string;
  elevation: string;
  radius: string;
  headingSize: string;
  bodySize: string;
  aria: string[];
}

export const SECTION_BLUEPRINTS: SectionTypeConfig[] = [
  { type: 'hero', layout: 'split', order: 0, spacing: '16', elevation: 'lg', radius: 'xl', headingSize: '6xl', bodySize: 'lg', aria: ['aria-labelledby="hero-title"'] },
  { type: 'features', layout: 'grid', order: 1, spacing: '12', elevation: 'md', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="features-title"'] },
  { type: 'services', layout: 'cards', order: 2, spacing: '12', elevation: 'md', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="services-title"'] },
  { type: 'about', layout: 'split', order: 3, spacing: '12', elevation: 'sm', radius: 'lg', headingSize: '4xl', bodySize: 'lg', aria: ['aria-labelledby="about-title"'] },
  { type: 'mission', layout: 'centered', order: 4, spacing: '10', elevation: 'none', radius: 'lg', headingSize: '3xl', bodySize: 'lg', aria: ['aria-labelledby="mission-title"'] },
  { type: 'vision', layout: 'centered', order: 5, spacing: '10', elevation: 'none', radius: 'lg', headingSize: '3xl', bodySize: 'lg', aria: ['aria-labelledby="vision-title"'] },
  { type: 'values', layout: 'grid', order: 6, spacing: '10', elevation: 'sm', radius: 'md', headingSize: '2xl', bodySize: 'base', aria: ['aria-labelledby="values-title"'] },
  { type: 'process', layout: 'timeline', order: 7, spacing: '12', elevation: 'sm', radius: 'md', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="process-title"'] },
  { type: 'pricing', layout: 'cards', order: 8, spacing: '12', elevation: 'md', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="pricing-title"'] },
  { type: 'gallery', layout: 'masonry', order: 9, spacing: '8', elevation: 'sm', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="gallery-title"'] },
  { type: 'portfolio', layout: 'grid', order: 10, spacing: '12', elevation: 'md', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="portfolio-title"'] },
  { type: 'statistics', layout: 'banner', order: 11, spacing: '10', elevation: 'sm', radius: 'md', headingSize: '4xl', bodySize: 'base', aria: ['aria-labelledby="stats-title"'] },
  { type: 'timeline', layout: 'timeline', order: 12, spacing: '12', elevation: 'none', radius: 'md', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="timeline-title"'] },
  { type: 'testimonials', layout: 'masonry', order: 13, spacing: '12', elevation: 'sm', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="testimonials-title"'] },
  { type: 'team', layout: 'grid', order: 14, spacing: '12', elevation: 'md', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="team-title"'] },
  { type: 'faq', layout: 'accordion', order: 15, spacing: '12', elevation: 'none', radius: 'md', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="faq-title"'] },
  { type: 'blog', layout: 'grid', order: 16, spacing: '12', elevation: 'md', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="blog-title"'] },
  { type: 'cta', layout: 'banner', order: 17, spacing: '12', elevation: 'none', radius: 'xl', headingSize: '4xl', bodySize: 'lg', aria: ['aria-labelledby="cta-title"'] },
  { type: 'contact', layout: 'split', order: 18, spacing: '12', elevation: 'md', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="contact-title"'] },
  { type: 'newsletter', layout: 'centered', order: 19, spacing: '10', elevation: 'sm', radius: 'lg', headingSize: '3xl', bodySize: 'base', aria: ['aria-labelledby="newsletter-title"'] },
  { type: 'map', layout: 'fullwidth', order: 20, spacing: '8', elevation: 'none', radius: 'md', headingSize: '2xl', bodySize: 'base', aria: ['aria-label="Business location map"'] },
  { type: 'accordion', layout: 'accordion', order: 21, spacing: '8', elevation: 'none', radius: 'md', headingSize: '2xl', bodySize: 'base', aria: ['aria-labelledby="accordion-title"'] },
  { type: 'divider', layout: 'default', order: 22, spacing: '4', elevation: 'none', radius: 'none', headingSize: 'base', bodySize: 'base', aria: ['aria-hidden="true"'] },
  { type: 'spacer', layout: 'default', order: 23, spacing: '4', elevation: 'none', radius: 'none', headingSize: 'base', bodySize: 'base', aria: ['aria-hidden="true"'] },
  { type: 'custom-html', layout: 'default', order: 24, spacing: '8', elevation: 'none', radius: 'md', headingSize: 'base', bodySize: 'base', aria: [] },
];

export function getSectionBlueprint(type: string): SectionTypeConfig | undefined {
  return SECTION_BLUEPRINTS.find((blueprint) => blueprint.type === type);
}

/**
 * Design a section: resolve the blueprint and bind it to the active design
 * tokens + brand so every section shares one spacing/radius/elevation system.
 */
export function designSection(
  type: string,
  tokens: DesignTokens,
  brand: BrandDesign,
  order = 0
): SectionBlueprint {
  const blueprint = getSectionBlueprint(type) ?? {
    type,
    layout: 'default',
    order,
    spacing: '8',
    elevation: 'none',
    radius: 'md',
    headingSize: '2xl',
    bodySize: 'base',
    aria: [],
  };

  return {
    type,
    layout: blueprint.layout,
    tokens: {
      spacing: `space-${blueprint.spacing} (${tokens.spacing[blueprint.spacing] ?? 32}px)`,
      elevation: tokens.shadow[blueprint.elevation as keyof typeof tokens.shadow] ?? 'none',
      radius: tokens.radius[blueprint.radius as keyof typeof tokens.radius] ?? tokens.radius.md,
      typography: {
        heading: tokens.fontFamily.heading,
        body: tokens.fontFamily.body,
      },
    },
    aria: blueprint.aria,
    order: blueprint.order,
  };
}

/** Blueprints for a standard page composition (home). */
export function defaultPageBlueprint(brief: DesignBrief, tokens: DesignTokens, brand: BrandDesign): SectionBlueprint[] {
  const types = ['hero', 'features', 'statistics', 'testimonials', 'pricing', 'cta', 'contact'];
  return types.map((type, index) => designSection(type, tokens, brand, index));
}
