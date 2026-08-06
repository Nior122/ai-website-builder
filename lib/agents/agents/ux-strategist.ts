// =============================================================================
// Agent 3 — UX Strategist Agent
// =============================================================================
// Plans the user experience: user journey, information hierarchy, conversion
// flow, page structure, and section ordering.
// Output: UxBlueprint.
// =============================================================================

import { Agent, isNonEmptyArray, isNonEmptyString, isRecord } from '../base';
import type { ProjectContext } from '../context';
import { SECTION_BLUEPRINTS } from '@/lib/ai/design-pipeline';
import type { UxBlueprint } from '../types';

const DEFAULT_PAGES = ['home', 'about', 'services', 'contact'];

const PAGE_PURPOSES: Record<string, string> = {
  home: 'Establish the value proposition and drive primary conversion',
  about: 'Build trust through story, mission, and team',
  services: 'Explain offerings and qualify prospects',
  contact: 'Capture leads and lower the barrier to engagement',
  pricing: 'Present packages and overcome price objections',
  testimonials: 'Provide social proof and reduce perceived risk',
  portfolio: 'Demonstrate capability through past work',
  blog: 'Build authority and capture organic search demand',
};

export class UxStrategistAgent extends Agent {
  readonly id = 'ux' as const;
  readonly outputKey = 'ux';

  run(context: ProjectContext): UxBlueprint {
    const req = context.request;
    const requested = req.pages && req.pages.length > 0 ? req.pages : DEFAULT_PAGES;
    const pages = requested.map((slug) => ({
      slug,
      title: slug.charAt(0).toUpperCase() + slug.slice(1),
      purpose: PAGE_PURPOSES[slug] ?? `Support the ${slug} stage of the journey`,
    }));

    const sectionOrder = SECTION_BLUEPRINTS
      .filter((blueprint) => blueprint.type !== 'divider' && blueprint.type !== 'spacer')
      .sort((a, b) => a.order - b.order)
      .map((blueprint) => blueprint.type);

    return {
      userJourney: [
        'Discover the business through search, social, or referral',
        'Evaluate credibility via about, testimonials, and proof',
        'Convert through a clear, low-friction CTA',
        'Return for repeat engagement and referrals',
      ],
      hierarchy: [
        'Primary: hero value proposition + primary CTA',
        'Secondary: features, services, and proof',
        'Tertiary: FAQ, contact details, and legal',
      ],
      conversionFlow: ['Attention', 'Interest', 'Desire', 'Action'],
      pages,
      sectionOrder,
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return (
      isNonEmptyArray(output.pages) &&
      isNonEmptyArray(output.sectionOrder) &&
      isNonEmptyArray(output.userJourney)
    );
  }

  fallback(context: ProjectContext): UxBlueprint {
    return {
      userJourney: ['Discover', 'Evaluate', 'Convert', 'Return'],
      hierarchy: ['Value proposition', 'Proof', 'Conversion'],
      conversionFlow: ['Attention', 'Action'],
      pages: DEFAULT_PAGES.map((slug) => ({
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        purpose: PAGE_PURPOSES[slug] ?? '',
      })),
      sectionOrder: ['hero', 'features', 'cta', 'contact'],
    };
  }
}
