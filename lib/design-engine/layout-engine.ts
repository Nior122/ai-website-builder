// =============================================================================
// Design Generation Engine — Layout Intelligence
// =============================================================================
// Dynamic layout selection from 17 layout patterns. The industry profile
// carries preferred patterns; the selector scores each candidate by fit and
// conversion weight so layouts are chosen intelligently, never hardcoded.
// =============================================================================

import type { IndustryProfile, LayoutSpec } from './types';

export const LAYOUT_PATTERNS: LayoutSpec[] = [
  { id: 'split-hero', label: 'Split Hero', grid: '12', hero: 'split', containerWidth: '1200px', columns: 3, sectionSpacing: '112px', modern: true, description: 'Half text / half visual hero with asymmetric grid.' },
  { id: 'centered-hero', label: 'Centered Hero', grid: '12', hero: 'centered', containerWidth: '1120px', columns: 3, sectionSpacing: '96px', modern: false, description: 'Centered statement hero with wide breathing room.' },
  { id: 'image-left', label: 'Image Left', grid: '12', hero: 'image-left', containerWidth: '1200px', columns: 2, sectionSpacing: '96px', modern: false, description: 'Alternating editorial with visuals anchored left.' },
  { id: 'image-right', label: 'Image Right', grid: '12', hero: 'image-right', containerWidth: '1200px', columns: 2, sectionSpacing: '96px', modern: false, description: 'Alternating editorial with visuals anchored right.' },
  { id: 'card-grid', label: 'Card Grid', grid: '12', hero: 'centered', containerWidth: '1200px', columns: 3, sectionSpacing: '96px', modern: false, description: 'Structured card grid for services and features.' },
  { id: 'alternating', label: 'Alternating Sections', grid: '12', hero: 'split', containerWidth: '1200px', columns: 2, sectionSpacing: '112px', modern: true, description: 'Rhythmic left/right alternation for storytelling.' },
  { id: 'masonry', label: 'Masonry', grid: 'masonry', hero: 'centered', containerWidth: '1280px', columns: 3, sectionSpacing: '80px', modern: true, description: 'Pinterest-style collage for galleries and portfolios.' },
  { id: 'bento-grid', label: 'Bento Grid', grid: 'bento', hero: 'split', containerWidth: '1240px', columns: 4, sectionSpacing: '96px', modern: true, description: 'Mixed-size cards in a bento composition.' },
  { id: 'magazine', label: 'Magazine', grid: '12', hero: 'editorial', containerWidth: '1120px', columns: 4, sectionSpacing: '80px', modern: false, description: 'High-contrast editorial with oversized type.' },
  { id: 'minimal', label: 'Minimal', grid: '12', hero: 'centered', containerWidth: '1040px', columns: 2, sectionSpacing: '112px', modern: true, description: 'Whitespace-driven minimalism.' },
  { id: 'editorial', label: 'Editorial', grid: '12', hero: 'split', containerWidth: '1120px', columns: 3, sectionSpacing: '104px', modern: false, description: 'Magazine-style with serif display moments.' },
  { id: 'corporate', label: 'Corporate', grid: '12', hero: 'centered', containerWidth: '1200px', columns: 3, sectionSpacing: '96px', modern: false, description: 'Confident, conventional, trustworthy.' },
  { id: 'luxury', label: 'Luxury', grid: '12', hero: 'split', containerWidth: '1280px', columns: 3, sectionSpacing: '128px', modern: false, description: 'Generous spacing, serif elegance, restrained color.' },
  { id: 'modern-startup', label: 'Modern Startup', grid: '12', hero: 'split', containerWidth: '1200px', columns: 3, sectionSpacing: '112px', modern: true, description: 'Clean product-led startup composition.' },
  { id: 'glassmorphism', label: 'Glassmorphism', grid: '12', hero: 'split', containerWidth: '1200px', columns: 3, sectionSpacing: '112px', modern: true, description: 'Frosted glass panels over vivid gradients.' },
  { id: 'neumorphism', label: 'Neumorphism', grid: '12', hero: 'centered', containerWidth: '1120px', columns: 3, sectionSpacing: '96px', modern: true, description: 'Soft extruded surfaces on flat backgrounds.' },
  { id: 'gradient', label: 'Gradient', grid: '12', hero: 'centered', containerWidth: '1200px', columns: 3, sectionSpacing: '96px', modern: true, description: 'Bold gradient washes and glow accents.' },
  { id: 'premium-saas', label: 'Premium SaaS', grid: '12', hero: 'split', containerWidth: '1240px', columns: 3, sectionSpacing: '120px', modern: true, description: 'Conversion-optimized product marketing.' },
  { id: 'creative-agency', label: 'Creative Agency', grid: '12', hero: 'editorial', containerWidth: '1240px', columns: 3, sectionSpacing: '120px', modern: true, description: 'Bold type, vivid color, portfolio-first.' },
  { id: 'travel', label: 'Travel Explorer', grid: '12', hero: 'full', containerWidth: '1280px', columns: 3, sectionSpacing: '88px', modern: true, description: 'Full-bleed destination imagery with card grids.' },
  { id: 'education', label: 'Education Bright', grid: '12', hero: 'centered', containerWidth: '1200px', columns: 3, sectionSpacing: '88px', modern: false, description: 'Bright, friendly, structured learning layout.' },
  { id: 'medical', label: 'Medical Clean', grid: '12', hero: 'centered', containerWidth: '1200px', columns: 3, sectionSpacing: '88px', modern: false, description: 'Calm clinical clarity with trust cards.' },
  { id: 'architecture', label: 'Architecture Minimal', grid: '12', hero: 'split', containerWidth: '1280px', columns: 2, sectionSpacing: '112px', modern: true, description: 'Precise geometric composition with generous air.' },
  { id: 'store', label: 'Store Premium', grid: '12', hero: 'split', containerWidth: '1240px', columns: 4, sectionSpacing: '88px', modern: true, description: 'Shoppable grid-first commerce layout.' },
  { id: 'finance', label: 'Finance Professional', grid: '12', hero: 'centered', containerWidth: '1120px', columns: 3, sectionSpacing: '96px', modern: false, description: 'Stable, structured, credible.' },
  { id: 'punchy', label: 'Punchy Bold', grid: '12', hero: 'full', containerWidth: '1200px', columns: 3, sectionSpacing: '96px', modern: true, description: 'High-impact full-bleed energy.' },
];

export function getLayoutPattern(id: string): LayoutSpec | undefined {
  return LAYOUT_PATTERNS.find((l) => l.id === id);
}

export interface LayoutSelectionOptions {
  /** Prefer conversion-optimized patterns (bento, split hero, card grid). */
  conversionWeight?: number;
}

/**
 * Select the best layout for an industry. Preferred patterns from the profile
 * are scored first; modern, conversion-friendly patterns get a bonus.
 */
export function selectLayout(profile: IndustryProfile, options: LayoutSelectionOptions = {}): LayoutSpec {
  const conversionWeight = options.conversionWeight ?? 1;
  let best = LAYOUT_PATTERNS[0];
  let bestScore = -1;
  for (const pattern of LAYOUT_PATTERNS) {
    let score = 0;
    const preferenceIndex = profile.layoutPatterns.indexOf(pattern.id);
    if (preferenceIndex >= 0) {
      score += 100 - preferenceIndex * 8; // earlier preference = better
    }
    if (pattern.modern) {
      score += 12;
    }
    if (['split-hero', 'bento-grid', 'premium-saas', 'card-grid'].includes(pattern.id)) {
      score += 6 * conversionWeight;
    }
    if (pattern.id === 'split-hero') {
      score += 3; // split hero is almost always a strong opener
    }
    if (score > bestScore) {
      bestScore = score;
      best = pattern;
    }
  }
  return best;
}

export function listLayouts(): string[] {
  return LAYOUT_PATTERNS.map((l) => l.id);
}
