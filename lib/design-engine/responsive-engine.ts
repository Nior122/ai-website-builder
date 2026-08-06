// =============================================================================
// Design Generation Engine — Responsive Intelligence
// =============================================================================
// Every generated layout carries explicit rules for desktop, laptop, tablet,
// large mobile, and mobile: spacing, padding, margins, columns, typography,
// buttons, cards, images, and navigation adapt automatically per breakpoint.
// =============================================================================

import type { IndustryProfile, ResponsiveRules } from './types';

export const BREAKPOINTS = {
  desktop: 1280,
  laptop: 1024,
  tablet: 768,
  largeMobile: 640,
  mobile: 480,
} as const;

export const BREAKPOINT_NAMES = Object.keys(BREAKPOINTS) as Array<keyof typeof BREAKPOINTS>;

const BASE_SPACING: Record<string, number> = { desktop: 96, laptop: 88, tablet: 72, largeMobile: 56, mobile: 48 };
const BASE_COLUMNS: Record<string, number> = { desktop: 12, laptop: 12, tablet: 6, largeMobile: 4, mobile: 4 };
const BASE_CARD_COLUMNS: Record<string, number> = { desktop: 4, laptop: 3, tablet: 2, largeMobile: 2, mobile: 1 };
const BASE_FONT_SCALE: Record<string, string> = {
  desktop: 'clamp(2.9rem, 1.95rem + 3.8vw, 4.75rem)',
  laptop: 'clamp(2.4rem, 1.6rem + 2.9vw, 3.75rem)',
  tablet: 'clamp(2rem, 1.35rem + 2.2vw, 3rem)',
  largeMobile: 'clamp(1.75rem, 1.25rem + 1.6vw, 2.5rem)',
  mobile: 'clamp(1.6rem, 1.2rem + 1.4vw, 2.2rem)',
};
const BASE_NAV: Record<string, string> = { desktop: 'full', laptop: 'full', tablet: 'drawer', largeMobile: 'drawer', mobile: 'drawer' };
const BASE_BUTTON: Record<string, string> = { desktop: 'lg', laptop: 'lg', tablet: 'md', largeMobile: 'md', mobile: 'md' };
const BASE_IMAGE_ASPECT: Record<string, string> = { desktop: '16/9', laptop: '16/9', tablet: '4/3', largeMobile: '4/3', mobile: '1/1' };

const LAYOUT_SPACING_DELTA: Record<string, number> = {
  luxury: 32,
  'premium-saas': 24,
  'creative-agency': 24,
  minimal: 16,
  editorial: 8,
  masonry: -16,
  magazine: -16,
};

/**
 * Build responsive rules for an industry and layout. Layout personalities
 * (luxury = more air, masonry = tighter) shift the spacing delta; everything
 * else derives from the shared base scale.
 */
export function buildResponsiveRules(profile: IndustryProfile, layoutId: string): ResponsiveRules {
  const delta = LAYOUT_SPACING_DELTA[layoutId] ?? 0;
  const spacing: Record<string, number> = {};
  for (const bp of BREAKPOINT_NAMES) {
    spacing[bp] = Math.max(32, BASE_SPACING[bp] + delta);
  }
  return {
    breakpoints: { ...BREAKPOINTS },
    spacing,
    columns: { ...BASE_COLUMNS },
    fontSizeScale: { ...BASE_FONT_SCALE },
    navBehavior: { ...BASE_NAV },
    cardColumns: { ...BASE_CARD_COLUMNS },
    buttonSize: { ...BASE_BUTTON },
    imageAspect: { ...BASE_IMAGE_ASPECT },
  };
}

export function listBreakpoints(): string[] {
  return [...BREAKPOINT_NAMES];
}
