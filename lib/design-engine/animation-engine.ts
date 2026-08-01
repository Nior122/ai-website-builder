// =============================================================================
// Design Generation Engine — Animation Engine
// =============================================================================
// Assigns tasteful animations per section: fade, slide, scale, parallax,
// stagger, scroll reveal, hover effects, and micro-interactions. Animations
// are never excessive — every style carries a restraint level and the engine
// honors reduced-motion preferences.
// =============================================================================

import type { AnimationSpec, SectionAnimation } from './types';

export interface AnimationStyleRule {
  style: string;
  restraint: 'subtle' | 'moderate' | 'playful' | 'none';
  baseDurationMs: number;
  easing: string;
  allowed: string[];
  parallax: boolean;
}

export const ANIMATION_STYLE_RULES: Record<string, AnimationStyleRule> = {
  calm: { style: 'calm', restraint: 'subtle', baseDurationMs: 550, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', allowed: ['fade', 'slide-up', 'scroll-reveal'], parallax: false },
  warm: { style: 'warm', restraint: 'moderate', baseDurationMs: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', allowed: ['fade', 'slide-up', 'scroll-reveal', 'hover-lift', 'image-zoom'], parallax: false },
  soft: { style: 'soft', restraint: 'subtle', baseDurationMs: 700, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', allowed: ['fade', 'scale-in', 'scroll-reveal', 'hover-lift'], parallax: false },
  playful: { style: 'playful', restraint: 'moderate', baseDurationMs: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', allowed: ['fade', 'slide-up', 'scale-in', 'stagger', 'hover-lift', 'image-zoom'], parallax: false },
  punchy: { style: 'punchy', restraint: 'moderate', baseDurationMs: 450, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', allowed: ['fade', 'slide-up', 'scale-in', 'stagger', 'hover-lift', 'image-zoom'], parallax: false },
  tech: { style: 'tech', restraint: 'moderate', baseDurationMs: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', allowed: ['fade', 'slide-up', 'scale-in', 'stagger', 'hover-lift', 'parallax', 'image-zoom'], parallax: true },
};

const SECTION_ANIMATION_PLAN: Record<string, string> = {
  hero: 'hero',
  navbar: 'fade',
  features: 'slide-up',
  services: 'slide-up',
  pricing: 'stagger',
  faq: 'scroll-reveal',
  testimonials: 'stagger',
  gallery: 'stagger',
  team: 'stagger',
  portfolio: 'stagger',
  statistics: 'scale-in',
  stats: 'scale-in',
  timeline: 'scroll-reveal',
  cta: 'fade',
  newsletter: 'fade',
  contact: 'fade',
  blog: 'stagger',
  footer: 'fade',
};

function buildAnimation(name: string, rule: AnimationStyleRule, durationScale = 1): AnimationSpec {
  const durations: Record<string, number> = {
    fade: 500,
    'slide-up': 550,
    'scale-in': 450,
    parallax: 900,
    stagger: 520,
    'scroll-reveal': 600,
    'hover-lift': 180,
    'image-zoom': 350,
  };
  const trigger: AnimationSpec['trigger'] = ['hover-lift', 'image-zoom'].includes(name) ? 'on-hover' : name === 'hero' ? 'on-load' : 'on-scroll';
  const restraint = name === 'hero' || name === 'fade' ? rule.restraint : rule.restraint === 'subtle' ? 'subtle' : rule.restraint === 'playful' || rule.restraint === 'punchy' ? 'moderate' : 'subtle';
  return {
    name,
    durationMs: Math.round((durations[name] ?? rule.baseDurationMs) * durationScale),
    easing: rule.easing,
    trigger,
    restraint,
  };
}

export interface AnimationOptions {
  /** true when the user prefers reduced motion — disables all motion. */
  reducedMotion?: boolean;
  /** Force a specific style instead of the industry default. */
  style?: string;
}

/**
 * Assign animations to every section type in the order. The hero always gets
 * a composed load animation; list sections get stagger or scroll reveal; the
 * rest follow the style's allowed set. Reduced motion returns `none` for all.
 */
export function assignAnimations(sectionOrder: string[], profileStyle: string, options: AnimationOptions = {}): SectionAnimation[] {
  if (options.reducedMotion) {
    const still: AnimationSpec = { name: 'none', durationMs: 0, easing: 'linear', trigger: 'none', restraint: 'none' };
    return sectionOrder.map((sectionType) => ({ sectionType, animation: still }));
  }
  const rule = ANIMATION_STYLE_RULES[options.style ?? profileStyle] ?? ANIMATION_STYLE_RULES.warm;
  return sectionOrder.map((sectionType) => {
    const plan = SECTION_ANIMATION_PLAN[sectionType] ?? 'scroll-reveal';
    if (plan === 'hero') {
      return {
        sectionType,
        animation: {
          name: 'fade-up',
          durationMs: rule.baseDurationMs,
          easing: rule.easing,
          trigger: 'on-load',
          restraint: rule.restraint,
        },
      };
    }
    const name = rule.allowed.includes(plan) ? plan : 'fade';
    return { sectionType, animation: buildAnimation(name, rule) };
  });
}

export function listAnimationStyles(): string[] {
  return Object.keys(ANIMATION_STYLE_RULES);
}
