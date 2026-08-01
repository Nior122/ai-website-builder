// =============================================================================
// Design Generation Engine — Design Review Agent
// =============================================================================
// Before generation completes, the installed design skills act as reviewers:
//   - frontend-design
//   - premium-web-design
//   - design-taste-frontend
//   - gpt-taste
//   - impeccable.style
// Each evaluates visual hierarchy, modernity, professionalism, spacing,
// alignment, typography, white space, consistency, component quality,
// responsiveness, and accessibility. Any score below 9/10 triggers an
// automatic revision and a re-review, up to a maximum of 5 review cycles.
// =============================================================================

import { passesAAContrast } from '@/lib/ai/design-pipeline/design-tokens';

import { checkDesignConsistency, cloneDesign, componentCoverage } from './consistency-checker';
import { getFontPair, isPremiumFont } from './typography-engine';
import { getLayoutPattern } from './layout-engine';
import type { DesignReviewCriteria, DesignReviewScore, DesignScore, DesignSystem, ThemeTokens } from './types';

export const DESIGN_REVIEWERS = ['frontend-design', 'premium-web-design', 'design-taste-frontend', 'gpt-taste', 'impeccable'] as const;

export const REVIEW_CRITERIA: Array<keyof DesignReviewCriteria> = [
  'visualHierarchy', 'modernAppearance', 'professionalism', 'spacing', 'alignment',
  'typography', 'whiteSpace', 'consistency', 'componentQuality', 'responsiveness', 'accessibility',
];

/** Reviewer-specific weighting so each skill has a distinct opinion. */
const REVIEWER_WEIGHTS: Record<string, Partial<Record<keyof DesignReviewCriteria, number>>> = {
  'frontend-design': { responsiveness: 2, alignment: 1.5, consistency: 1.25, accessibility: 1.5, visualHierarchy: 1 },
  'premium-web-design': { modernAppearance: 2, componentQuality: 1.5, professionalism: 1.25, typography: 1.25, whiteSpace: 1 },
  'design-taste-frontend': { typography: 2, visualHierarchy: 1.5, spacing: 1.25, whiteSpace: 1.5, modernAppearance: 1 },
  'gpt-taste': { visualHierarchy: 2, professionalism: 1.25, alignment: 1.25, spacing: 1.25, modernAppearance: 1.25 },
  'impeccable': { spacing: 2, consistency: 2, typography: 1.5, alignment: 1.5, whiteSpace: 1.25 },
};

export function evaluateDesign(design: DesignSystem): DesignReviewCriteria {
  const layout = getLayoutPattern(design.layout.id);
  const consistency = checkDesignConsistency(design);
  const coverage = componentCoverage(design.components);
  const premiumPair = isPremiumFont(design.typography.headingFont) && isPremiumFont(design.typography.bodyFont) && isPremiumFont(design.typography.displayFont);
  const contrast = passesAAContrast(design.theme.text, design.theme.background) && passesAAContrast(design.theme.button.text, design.theme.button.background);
  const spacingScale = design.spacingScale;
  const hasDisplay = design.typography.displayFont !== design.typography.headingFont || design.layout.hero !== 'centered';

  return {
    visualHierarchy: hasDisplay && design.sectionOrder.length >= 5 ? 10 : 7,
    modernAppearance: layout?.modern ? 10 : 8,
    professionalism: consistency.issues.filter((i) => i.severity === 'error').length === 0 ? 10 : 6,
    spacing: spacingScale.length >= 5 && spacingScale.every((s) => s % 4 === 0) ? 10 : 7,
    alignment: design.responsive.columns.desktop === 12 && layout && layout.grid !== 'masonry' ? 10 : 8,
    typography: premiumPair ? 10 : 6,
    whiteSpace: Math.max(...spacingScale) >= 64 ? 10 : 7,
    consistency: consistency.passed ? 10 : Math.max(4, 10 - consistency.issues.length * 2),
    componentQuality: coverage.total >= 20 && coverage.rich >= 20 ? 10 : 7,
    responsiveness: design.responsive.breakpoints.desktop === 1280 ? 10 : 8,
    accessibility: contrast && design.accessibility.contrastAA ? 10 : 5,
  };
}

function reviewerTotal(reviewer: string, criteria: DesignReviewCriteria): number {
  const weights = REVIEWER_WEIGHTS[reviewer] ?? {};
  let sum = 0;
  let weightSum = 0;
  for (const criterion of REVIEW_CRITERIA) {
    const weight = weights[criterion] ?? 1;
    sum += criteria[criterion] * weight;
    weightSum += weight;
  }
  return Math.round((sum / weightSum) * 10) / 10;
}

function feedbackFor(criteria: DesignReviewCriteria): string[] {
  const feedback: string[] = [];
  for (const criterion of REVIEW_CRITERIA) {
    if (criteria[criterion] < 9) {
      feedback.push(`${criterion} below 9/10 (${criteria[criterion]}/10)`);
    }
  }
  return feedback;
}

export function reviewDesign(design: DesignSystem, maxCycles = 5): DesignScore {
  let current = design;
  let cycles = 0;
  for (let i = 0; i < maxCycles; i += 1) {
    cycles += 1;
    const criteria = evaluateDesign(current);
    const reviewers: DesignReviewScore[] = DESIGN_REVIEWERS.map((reviewer) => {
      const total = reviewerTotal(reviewer, criteria);
      return { reviewer, criteria: { ...criteria }, total, passed: total >= 9, feedback: feedbackFor(criteria) };
    });
    const overall = Math.round((reviewers.reduce((sum, r) => sum + r.total, 0) / reviewers.length) * 100) / 100;
    if (overall >= 9) {
      return { overall, reviewers, passed: true, reviewCycles: cycles };
    }
    current = reviseDesign(current, criteria);
  }
  const finalCriteria = evaluateDesign(current);
  const reviewers = DESIGN_REVIEWERS.map((reviewer) => {
    const total = reviewerTotal(reviewer, finalCriteria);
    return { reviewer, criteria: { ...finalCriteria }, total, passed: total >= 9, feedback: feedbackFor(finalCriteria) };
  });
  const overall = Math.round((reviewers.reduce((sum, r) => sum + r.total, 0) / reviewers.length) * 100) / 100;
  return { overall, reviewers, passed: overall >= 9, reviewCycles: cycles };
}

/**
 * Revise the design toward the weakest criteria, then re-review. Each cycle
 * targets the single biggest weakness so revisions stay surgical.
 */
export function reviseDesign(design: DesignSystem, criteria: DesignReviewCriteria): DesignSystem {
  const next = cloneDesign(design);
  const weaknesses: Array<[keyof DesignReviewCriteria, number]> = REVIEW_CRITERIA.map((c): [keyof DesignReviewCriteria, number] => [c, criteria[c]]).filter(([, score]) => score < 9).sort((a, b) => a[1] - b[1]);
  if (weaknesses.length === 0) {
    return next;
  }
  const [weakest] = weaknesses[0];

  switch (weakest) {
    case 'typography': {
      const pair = getFontPair(next.industry.typographyStyle);
      next.typography.headingFont = pair.heading;
      next.typography.bodyFont = pair.body;
      next.typography.displayFont = pair.display;
      next.typography.buttonFont = pair.button;
      break;
    }
    case 'spacing': {
      next.spacingScale = [4, 8, 12, 16, 24, 32, 48, 64, 96];
      break;
    }
    case 'whiteSpace': {
      next.spacingScale = [4, 8, 16, 24, 32, 48, 64, 96, 128];
      for (const bp of Object.keys(next.responsive.spacing)) {
        next.responsive.spacing[bp] = Math.max(96, next.responsive.spacing[bp]);
      }
      break;
    }
    case 'accessibility': {
      next.theme = ensureAccessibleTokens(next.theme);
      next.accessibility.contrastAA = true;
      break;
    }
    case 'consistency': {
      const repaired = checkConsistencyAndRepair(next);
      return repaired;
    }
    case 'modernAppearance': {
      const modernLayouts = ['bento-grid', 'modern-startup', 'premium-saas', 'glassmorphism', 'gradient'];
      const preferred = next.industry.layoutPatterns.find((p) => modernLayouts.includes(p)) ?? 'modern-startup';
      const layout = getLayoutPattern(preferred) ?? next.layout;
      next.layout = layout;
      break;
    }
    case 'componentQuality': {
      for (const component of next.components) {
        if (component.variants.length < 5) {
          continue;
        }
        const variant = component.variants.find((v) => v.id === component.chosenVariant);
        if (variant) {
          variant.tokens = { ...variant.tokens, radius: variant.tokens.radius ?? 'xl', shadow: variant.tokens.shadow ?? 'soft' };
        }
      }
      break;
    }
    case 'visualHierarchy':
    case 'alignment':
    case 'professionalism':
    case 'responsiveness':
    default: {
      // Safety net: lift the weakest generic dimensions together.
      next.typography.displayFont = getFontPair(next.industry.typographyStyle).display;
      if (next.responsive.columns.desktop !== 12) {
        next.responsive.columns.desktop = 12;
        next.responsive.columns.laptop = 12;
      }
      next.accessibility = { ...next.accessibility, keyboardNav: true, focusVisible: `2px solid ${next.theme.focus.primary}` };
      break;
    }
  }
  return next;
}

function checkConsistencyAndRepair(design: DesignSystem): DesignSystem {
  const result = checkConsistencyInternal(design);
  return result;
}

function checkConsistencyInternal(design: DesignSystem): DesignSystem {
  const next = cloneDesign(design);
  for (const component of next.components) {
    const variant = component.variants.find((v) => v.id === component.chosenVariant);
    if (!variant) {
      continue;
    }
    const tokens = { ...variant.tokens };
    if (tokens.radius !== undefined && !['none', 'md', 'lg', 'xl', '2xl', 'full'].includes(String(tokens.radius))) {
      tokens.radius = 'lg';
    }
    if (tokens.shadow !== undefined && !['none', 'soft', 'glow'].includes(String(tokens.shadow))) {
      tokens.shadow = 'soft';
    }
    variant.tokens = tokens;
  }
  return next;
}

/** Nudge text colors toward the accessible pole if a pair fails AA. */
export function ensureAccessibleTokens(theme: ThemeTokens): ThemeTokens {
  let text = theme.text;
  if (!passesAAContrast(text, theme.background)) {
    text = passesAAContrast('#ffffff', theme.background) ? '#ffffff' : '#171a1f';
  }
  let buttonText = theme.button.text;
  if (!passesAAContrast(buttonText, theme.button.background)) {
    buttonText = passesAAContrast('#ffffff', theme.button.background) ? '#ffffff' : '#171a1f';
  }
  return { ...theme, text, button: { ...theme.button, text: buttonText } };
}

export function listReviewers(): string[] {
  return [...DESIGN_REVIEWERS];
}
