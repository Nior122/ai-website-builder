// =============================================================================
// Autonomous Website Builder Agent — Quality Scorer
// =============================================================================
// Every generated website receives 8 scores (0–100): Overall, Visual, UX,
// SEO, Accessibility, Content, Performance, Completeness. Any category below
// 90 triggers automatic improvement by the agent.
// =============================================================================

import { checkTokensContrast, createDesignTokens, type DesignTokens } from '@/lib/ai/design-pipeline';
import {
  STYLE_EDITOR_FIELDS,
  getHomePage,
  getStyleToken,
  validateSeo,
  type BuilderProject,
} from '@/lib/builder';
import type { QualityScores } from './types';

export const SCORE_WEIGHTS = {
  visual: 0.15,
  ux: 0.15,
  seo: 0.1,
  accessibility: 0.1,
  content: 0.15,
  performance: 0.1,
  completeness: 0.25,
} as const;

function asTokens(project: BuilderProject): DesignTokens {
  return project.theme.tokens as unknown as DesignTokens;
}

function contrastPasses(project: BuilderProject): boolean {
  const errors = checkTokensContrast(asTokens(project)).filter((issue) => issue.severity === 'error');
  return errors.length === 0;
}

// ─── Category scorers ───────────────────────────────────────────────────

function scoreVisual(project: BuilderProject): number {
  const resolvable = STYLE_EDITOR_FIELDS.filter(
    (field) => getStyleToken(project.theme, field.path) !== undefined
  ).length;
  const tokenRatio = resolvable / STYLE_EDITOR_FIELDS.length;
  return Math.round((tokenRatio * 0.7 + (contrastPasses(project) ? 0.3 : 0)) * 100);
}

function scoreUx(project: BuilderProject): number {
  const home = getHomePage(project);
  let score = 0;
  score += project.pages.length >= 3 ? 40 : project.pages.length * 10;
  score += project.navigation.links.length >= 3 ? 30 : project.navigation.links.length * 8;
  score += home?.sections.some((section) => section.type === 'hero') ? 15 : 0;
  score += home?.sections.some((section) => section.type === 'cta' || section.content.ctaText) ? 15 : 0;
  return Math.min(100, score);
}

function scoreSeo(project: BuilderProject): number {
  let score = 100;
  for (const issue of validateSeo(project.seo)) {
    score -= issue.severity === 'error' ? 25 : 10;
  }
  const pagesWithoutMeta = project.pages.filter(
    (page) => !page.metaTitle || !page.metaDescription
  ).length;
  score -= pagesWithoutMeta * 5;
  return Math.max(0, score);
}

function scoreAccessibility(project: BuilderProject): number {
  const errors = checkTokensContrast(asTokens(project)).filter((issue) => issue.severity === 'error');
  const contrastScore = errors.length === 0 ? 60 : Math.max(0, 60 - errors.length * 30);

  const images = project.pages.flatMap((page) => page.sections).flatMap((section) => section.images);
  const withAlt = images.filter((image) => image.alt && image.alt.trim().length > 0).length;
  const altScore = images.length === 0 ? 20 : Math.round((withAlt / images.length) * 20);

  const home = getHomePage(project);
  const headingsScore = home?.sections[0]?.type === 'hero' ? 20 : 10;

  return contrastScore + altScore + headingsScore;
}

function scoreContent(project: BuilderProject): number {
  const sections = project.pages
    .flatMap((page) => page.sections)
    .filter((section) => !['divider', 'spacer', 'custom-html'].includes(section.type));
  const nonEmpty = sections.filter((section) =>
    Object.values(section.content).some((value) => typeof value === 'string' && value.trim().length > 0)
  ).length;
  const filled = sections.length === 0 ? 0 : nonEmpty / sections.length;

  const allCopy = JSON.stringify(project.pages.map((page) => page.sections.map((section) => section.content)));
  const loremPenalty = /lorem ipsum/i.test(allCopy) ? 0 : 20;

  return Math.round(filled * 80 + loremPenalty);
}

function scorePerformance(project: BuilderProject): number {
  const media = project.media;
  const withDims = media.filter((item) => item.width && item.height).length;
  const dimsScore = media.length === 0 ? 40 : Math.round((withDims / media.length) * 40);

  const sectionCount = project.pages.reduce((sum, page) => sum + page.sections.length, 0);
  const sizeScore = sectionCount <= 30 ? 30 : Math.max(0, 30 - (sectionCount - 30));

  const assetsScore = media.length >= 1 ? 30 : 0;

  return dimsScore + sizeScore + assetsScore;
}

function scoreCompleteness(project: BuilderProject): number {
  const home = getHomePage(project);
  const allSections = project.pages.flatMap((page) => page.sections);
  const contentSections = allSections.filter((section) => !['divider', 'spacer', 'custom-html'].includes(section.type));

  const checklist = [
    project.pages.length >= 3,
    project.pages.every((page) => page.sections.length > 0),
    project.navigation.links.length >= 3,
    project.footer.columns.length >= 1 && project.footer.copyright.length > 0,
    contentSections.every((section) =>
      Object.values(section.content).some((value) => typeof value === 'string' && value.trim().length > 0)
    ),
    project.pages.every((page) => page.metaTitle),
    project.forms.length >= 1 && project.forms.every((form) => form.fields.length > 0),
    home?.sections.some((section) => section.type === 'cta' || section.content.ctaText) ?? false,
    project.media.length >= 1,
    allSections.some((section) => section.type === 'testimonials'),
    allSections.some((section) => section.type === 'faq'),
    project.pages.some((page) => page.slug === 'contact'),
    project.footer.copyright.length > 0,
  ];
  const passed = checklist.filter(Boolean).length;
  return Math.round((passed / checklist.length) * 100);
}

// ─── Public API ─────────────────────────────────────────────────────────

export function computeQualityScores(project: BuilderProject): QualityScores {
  const visual = scoreVisual(project);
  const ux = scoreUx(project);
  const seo = scoreSeo(project);
  const accessibility = scoreAccessibility(project);
  const content = scoreContent(project);
  const performance = scorePerformance(project);
  const completeness = scoreCompleteness(project);

  const overall = Math.round(
    visual * SCORE_WEIGHTS.visual +
      ux * SCORE_WEIGHTS.ux +
      seo * SCORE_WEIGHTS.seo +
      accessibility * SCORE_WEIGHTS.accessibility +
      content * SCORE_WEIGHTS.content +
      performance * SCORE_WEIGHTS.performance +
      completeness * SCORE_WEIGHTS.completeness
  );

  return { overall, visual, ux, seo, accessibility, content, performance, completeness };
}

/** Dark-mode token set derived from the project's primary color. */
export function darkModeTokens(project: BuilderProject): DesignTokens {
  const primary = getStyleToken(project.theme, 'colors.primary');
  const seed = typeof primary === 'string' && primary ? primary : '#4f46e5';
  return createDesignTokens(seed, 'dark');
}
