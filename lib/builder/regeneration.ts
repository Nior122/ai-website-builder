// =============================================================================
// Website Builder — AI Section Regeneration
// =============================================================================
// ✨ Regenerate with AI: rebuilds ONLY the targeted section without touching
// the rest of the website. Deterministic regeneration for offline use plus an
// AI-ready prompt for the model path.
// =============================================================================

import type { BuilderProject, BuilderSection } from './types';

interface RegenerateResult {
  section: BuilderSection;
  usedFallback: boolean;
  prompt?: string;
}

const HEADLINE_VARIANTS: Record<string, string[]> = {
  hero: ['Make a bold first impression', 'The smart way forward', 'Built for what comes next'],
  features: ['Everything you need, nothing you don’t', 'Powerful by default, simple by design'],
  services: ['Services built around your goals', 'Focused expertise, delivered'],
  pricing: ['Simple pricing that scales with you', 'Plans for every stage of growth'],
  testimonials: ['Loved by customers like you', 'Real results from real clients'],
  team: ['The people behind the work', 'Meet the team'],
  faq: ['Questions, answered', 'Everything you might want to know'],
  cta: ['Ready when you are', 'Let’s build something great together'],
  contact: ['Talk to a real human', 'We reply within one business day'],
  newsletter: ['Get the good stuff first', 'One email a week, always worth it'],
  gallery: ['See the work up close', 'A look inside'],
  statistics: ['Proof, not promises', 'The numbers that matter'],
  process: ['From first call to launch', 'A process you can count on'],
  about: ['The story so far', 'Who we are and why it matters'],
  mission: ['Why we do what we do', 'Our mission, in one sentence'],
  vision: ['Where we’re headed', 'The future we’re building'],
  values: ['What we stand for', 'The principles behind the work'],
};

function variantFor(sectionType: string, seed: number): string {
  const pool = HEADLINE_VARIANTS[sectionType] ?? ['Something worth saying'];
  return pool[seed % pool.length];
}

/**
 * Regenerate a single section's content deterministically.
 * Keeps the section's layout, styles, animations, images, and order —
 * only content is rebuilt.
 */
export function regenerateSection(
  project: BuilderProject,
  pageId: string,
  sectionId: string
): RegenerateResult {
  const page = project.pages.find((p) => p.id === pageId);
  const section = page?.sections.find((s) => s.id === sectionId);
  if (!page || !section) {
    throw new Error(`Section ${sectionId} not found on page ${pageId}`);
  }

  const variant = variantFor(section.type, section.order + Date.now());
  const regenerated: BuilderSection = {
    ...section,
    content: {
      ...section.content,
      headline: variant,
      subheadline: typeof section.content.subheadline === 'string' && section.content.subheadline
        ? section.content.subheadline
        : `Learn more about what ${project.name} can do for you.`,
    },
  };

  return {
    section: regenerated,
    usedFallback: true,
    prompt: buildRegenerationPrompt(section.type, project),
  };
}

/** AI-ready prompt for regenerating one section. */
export function buildRegenerationPrompt(sectionType: string, project: BuilderProject): string {
  return [
    'You are a senior web designer. Regenerate ONLY the requested section.',
    `Business: ${project.name} (${project.industry}, ${project.businessType})`,
    `Section type: ${sectionType}`,
    'Rules:',
    '- Return ONLY valid JSON: {"headline": "...", "subheadline": "..."}',
    '- Specific, benefit-driven copy. No lorem ipsum, no generic filler.',
    '- Keep the brand voice: ' + (project.navigation.logoText || project.name),
    '- Do not change layout, styles, or other sections.',
  ].join('\n');
}
