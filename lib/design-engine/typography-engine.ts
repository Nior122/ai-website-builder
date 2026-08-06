// =============================================================================
// Design Generation Engine — Typography Engine
// =============================================================================
// Premium Google Font pairings chosen by industry/style. Never random: every
// font comes from the curated registry, and each industry maps to a coherent
// pairing with weights, line heights, letter spacing, heading/body scales,
// and responsive clamping.
// =============================================================================

import type { IndustryProfile, TypographySystem } from './types';

/** Curated premium Google Font pairings, keyed by style direction. */
export const FONT_PAIRS: Record<string, { heading: string; body: string; display?: string; button?: string }> = {
  luxury: { heading: 'Playfair Display', body: 'Lato', display: 'Cormorant Garamond', button: 'Lato' },
  modern: { heading: 'Plus Jakarta Sans', body: 'Inter', display: 'Sora', button: 'Inter' },
  editorial: { heading: 'Bodoni Moda', body: 'Montserrat', display: 'Bodoni Moda', button: 'Montserrat' },
  minimalist: { heading: 'Inter', body: 'Inter', display: 'Space Grotesk', button: 'Inter' },
  creative: { heading: 'Space Grotesk', body: 'Work Sans', display: 'Archivo', button: 'Work Sans' },
  corporate: { heading: 'IBM Plex Sans', body: 'IBM Plex Sans', display: 'IBM Plex Serif', button: 'IBM Plex Sans' },
  classic: { heading: 'Libre Caslon', body: 'Source Sans 3', display: 'Libre Caslon', button: 'Source Sans 3' },
  friendly: { heading: 'Nunito', body: 'Nunito', display: 'Baloo 2', button: 'Nunito' },
  elegant: { heading: 'Cormorant Garamond', body: 'Jost', display: 'Cormorant Garamond', button: 'Jost' },
  energetic: { heading: 'Oswald', body: 'Roboto', display: 'Oswald', button: 'Roboto' },
  serif: { heading: 'DM Serif Display', body: 'DM Sans', display: 'DM Serif Display', button: 'DM Sans' },
  geometric: { heading: 'Sora', body: 'Manrope', display: 'Sora', button: 'Manrope' },
};

export const FONT_STYLES = Object.keys(FONT_PAIRS);

const HEADING_SCALE = ['clamp(1.75rem, 1.25rem + 1.6vw, 2.5rem)', 'clamp(2rem, 1.35rem + 2.2vw, 3rem)', 'clamp(2.4rem, 1.6rem + 2.9vw, 3.75rem)', 'clamp(2.9rem, 1.95rem + 3.8vw, 4.75rem)'];
const BODY_SCALE = ['0.875rem', '1rem', '1.125rem', '1.25rem'];

const LINE_HEIGHTS = { tight: 1.1, snug: 1.25, normal: 1.5, relaxed: 1.65, display: 1.05 };
const LETTER_SPACING = { tight: '-0.02em', normal: '0em', wide: '0.08em', display: '-0.03em' };

export function getFontPair(style: string): { heading: string; body: string; display: string; button: string } {
  const pair = FONT_PAIRS[style] ?? FONT_PAIRS.modern;
  return {
    heading: pair.heading,
    body: pair.body,
    display: pair.display ?? pair.heading,
    button: pair.button ?? pair.body,
  };
}

export function isPremiumFont(font: string): boolean {
  const all = new Set(Object.values(FONT_PAIRS).flatMap((p) => [p.heading, p.body, p.display, p.button].filter(Boolean) as string[]));
  return all.has(font);
}

/**
 * Build the complete TypographySystem for an industry profile.
 * Serif-led industries get serif display treatments, tech/startup industries
 * get geometric sans — always from the premium registry.
 */
export function buildTypographySystem(profile: IndustryProfile): TypographySystem {
  const pair = getFontPair(profile.typographyStyle);
  const display = pair.display;
  const weights =
    profile.typographyStyle === 'editorial' || profile.typographyStyle === 'luxury' || profile.typographyStyle === 'elegant' || profile.typographyStyle === 'classic' || profile.typographyStyle === 'serif'
      ? { heading: 600, body: 400, button: 500, display: 500 }
      : { heading: 700, body: 400, button: 600, display: 600 };

  return {
    headingFont: pair.heading,
    bodyFont: pair.body,
    buttonFont: pair.button,
    displayFont: display,
    weights,
    lineHeights: LINE_HEIGHTS,
    letterSpacing: LETTER_SPACING,
    headingScale: HEADING_SCALE,
    bodyScale: BODY_SCALE,
    responsive: {
      mobileScale: 'clamp(1.75rem, 1.25rem + 1.6vw, 2.5rem)',
      desktopScale: 'clamp(2.9rem, 1.95rem + 3.8vw, 4.75rem)',
    },
  };
}

/** Fonts used by a typography system, ready for a Google Fonts <link>. */
export function googleFontsUrl(typography: TypographySystem): string {
  const families = [...new Set([typography.headingFont, typography.bodyFont, typography.buttonFont, typography.displayFont])];
  const query = families.map((f) => `family=${encodeURIComponent(f.replace(/ /g, '+'))}:wght@300;400;500;600;700`).join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
