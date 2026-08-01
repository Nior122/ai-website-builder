// =============================================================================
// Design Generation Engine — Orchestrator
// =============================================================================
// The DesignGenerationEngine service generates a complete, reusable design
// system for every website: theme, design system, component style, page
// layout, spacing, typography, color palette, border radius, shadows,
// animations, icons, visual hierarchy, image style, and section ordering —
// then reviews it with five design skills and revises until it scores 9/10+.
// =============================================================================

import type { DesignBrief } from '@/lib/ai/design-pipeline';
import { defaultSection, type BuilderProject } from '@/lib/builder';

import { classifyIndustry } from './industry-profiles';
import { buildThemeTokens } from './theme-generator';
import { buildTypographySystem } from './typography-engine';
import { selectLayout } from './layout-engine';
import { buildSectionOrder } from './section-ordering';
import { generateComponents } from './component-generator';
import { assignAnimations } from './animation-engine';
import { buildImageDirection } from './image-direction';
import { buildIconSet } from './icon-intelligence';
import { buildResponsiveRules } from './responsive-engine';
import { buildAccessibilityRules } from './accessibility-engine';
import { selectTheme } from './theme-library';
import { repairConsistency } from './consistency-checker';
import { reviewDesign } from './design-review';
import type { DesignSystem, ThemeTokens } from './types';

export interface DesignEngineOptions {
  /** Progress callback fired at each generation stage. */
  onStage?: (stage: string, message: string) => void;
  /** Maximum design review cycles (default 5, per spec). */
  maxReviewCycles?: number;
  /** Honor reduced-motion preferences (default true). */
  reducedMotion?: boolean;
}

const DEFAULT_SPACING_SCALE = [4, 8, 16, 24, 32, 48, 64, 96];

/**
 * The DesignGenerationEngine service. Generates a premium, industry-aware
 * design system for any business brief, reviews it with the installed design
 * skills, and automatically revises any design scoring below 9/10 (max 5
 * cycles). Nothing is hardcoded: colors, typography, layouts, section order,
 * icons, animations, and image directions are all derived per industry.
 */
export class DesignGenerationEngine {
  private readonly options: Required<DesignEngineOptions>;

  constructor(options: DesignEngineOptions = {}) {
    this.options = {
      onStage: options.onStage ?? (() => undefined),
      maxReviewCycles: options.maxReviewCycles ?? 5,
      reducedMotion: options.reducedMotion ?? true,
    };
  }

  private stage(name: string, message: string): void {
    this.options.onStage(name, message);
  }

  /** Generate the complete DesignSystem for a business brief. */
  async generateDesignSystem(brief: DesignBrief): Promise<DesignSystem> {
    this.stage('design', 'Classifying the business and its industry…');
    const industry = classifyIndustry(brief.description);

    this.stage('design', `Selecting the design theme for ${industry.label}…`);
    const themeSelection = selectTheme(industry);
    const theme = buildThemeTokens(themeSelection.entry.seed, { mode: themeSelection.entry.mode });

    this.stage('design', 'Choosing premium typography…');
    const typography = buildTypographySystem(industry);
    if (themeSelection.fromLibrary) {
      // Library themes carry their own typographic character.
      const libraryTypography = buildTypographySystem({ ...industry, typographyStyle: themeSelection.entry.typographyStyle });
      typography.headingFont = libraryTypography.headingFont;
      typography.bodyFont = libraryTypography.bodyFont;
      typography.displayFont = libraryTypography.displayFont;
      typography.buttonFont = libraryTypography.buttonFont;
    }

    this.stage('design', 'Selecting the optimal layout…');
    const layout = selectLayout(industry);

    this.stage('design', 'Ordering sections for storytelling and conversion…');
    const sectionOrder = buildSectionOrder(industry);

    this.stage('design', 'Generating component variants…');
    const components = generateComponents(industry, layout.id);

    this.stage('design', 'Assigning animation rules…');
    const animations = assignAnimations(sectionOrder, industry.animationStyle, { reducedMotion: this.options.reducedMotion });

    this.stage('design', 'Writing image directions for every section…');
    const businessName = (brief.businessName ?? brief.description.split(/[.\n]/)[0] ?? industry.label).trim();
    const imageDirection = buildImageDirection(sectionOrder, industry, businessName);

    this.stage('design', 'Choosing the icon system…');
    const icons = buildIconSet(industry);

    this.stage('design', 'Building responsive rules…');
    const responsive = buildResponsiveRules(industry, layout.id);

    this.stage('design', 'Enforcing accessibility…');
    const accessibility = buildAccessibilityRules(theme, { reducedMotion: this.options.reducedMotion });

    let design: DesignSystem = {
      industry,
      theme,
      typography,
      layout,
      components,
      sectionOrder,
      animations,
      icons,
      imageDirection,
      responsive,
      accessibility,
      spacingScale: [...DEFAULT_SPACING_SCALE],
      score: { overall: 0, reviewers: [], passed: false, reviewCycles: 0 },
      generatedAt: Date.now(),
    };

    this.stage('design', 'Checking consistency across all components…');
    const consistency = repairConsistency(design);
    if (consistency.repairs.length > 0) {
      design = consistency.design;
      this.stage('design', `Repaired ${consistency.repairs.length} inconsistency(ies).`);
    }

    this.stage('design', 'Running the design review (5 reviewers, max 5 cycles)…');
    const score = reviewDesign(design, this.options.maxReviewCycles);
    design = { ...design, score };
    this.stage('design', score.passed ? `Design approved — ${score.overall}/10 after ${score.reviewCycles} review cycle(s).` : `Design finished at ${score.overall}/10 after ${score.reviewCycles} cycles.`);

    return design;
  }
}

/** Build the project theme tokens from a DesignSystem. */
export function buildProjectTokens(design: DesignSystem): Record<string, unknown> {
  const t = design.theme;
  return {
    colors: {
      primary: t.primary,
      secondary: t.secondary,
      accent: t.accent,
      neutral: t.neutral,
      background: t.background,
      surface: t.surface,
      text: t.text,
      border: t.border,
      success: t.success,
      warning: t.warning,
      danger: t.danger,
      info: t.info,
      primaryHover: t.hover.primary,
      secondaryHover: t.hover.secondary,
      accentHover: t.hover.accent,
      focusRing: t.focus.primary,
      disabledBackground: t.disabled.background,
      disabledText: t.disabled.text,
      buttonBackground: t.button.background,
      buttonText: t.button.text,
      buttonHover: t.button.hover,
      lightBackground: t.light.background,
      lightSurface: t.light.surface,
      lightText: t.light.text,
      darkBackground: t.dark.background,
      darkSurface: t.dark.surface,
      darkText: t.dark.text,
    },
    fontFamily: {
      heading: design.typography.headingFont,
      body: design.typography.bodyFont,
      button: design.typography.buttonFont,
      display: design.typography.displayFont,
    },
    fontSize: {
      headingScale: design.typography.headingScale,
      bodyScale: design.typography.bodyScale,
      mobileScale: design.typography.responsive.mobileScale,
      desktopScale: design.typography.responsive.desktopScale,
    },
    lineHeight: design.typography.lineHeights,
    letterSpacing: design.typography.letterSpacing,
    fontWeight: design.typography.weights,
    radius: { sm: '6px', md: '10px', lg: '14px', xl: '20px', '2xl': '28px', full: '9999px' },
    spacing: Object.fromEntries(
      (['base', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'section'] as const).map((key, index) => [key, design.spacingScale[index] ?? design.spacingScale[design.spacingScale.length - 1]])
    ),
    shadow: {
      none: 'none',
      soft: '0 1px 2px rgba(17, 24, 39, 0.06), 0 8px 24px rgba(17, 24, 39, 0.08)',
      glow: `0 0 0 1px ${t.primary}33, 0 8px 32px ${t.primary}40`,
    },
    motion: {
      base: '300ms',
      fast: '150ms',
      slow: '600ms',
      duration: Object.fromEntries(design.animations.map((a) => [a.sectionType, `${a.animation.durationMs}ms`])),
      easing: design.animations[0]?.animation.easing ?? 'cubic-bezier(0.22, 1, 0.36, 1)',
      reducedMotion: design.accessibility.reducedMotion,
    },
    layout: {
      id: design.layout.id,
      grid: design.layout.grid,
      containerWidth: design.layout.containerWidth,
      columns: design.layout.columns,
      sectionSpacing: design.layout.sectionSpacing,
    },
    style: {
      animation: design.industry.animationStyle,
      iconFamily: design.icons.family,
      animationStyle: design.industry.animationStyle,
      imageStyle: design.industry.imageStyle,
      componentVariants: Object.fromEntries(design.components.map((c) => [c.type, c.chosenVariant])),
    },
  };
}

function titleCase(text: string): string {
  return text.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Apply a DesignSystem to a BuilderProject: merge theme tokens, reorder the
 * home page sections into the designed sequence, and add missing preferred
 * sections so the generated pages express the full design language.
 */
export function applyDesignSystemToProject(project: BuilderProject, design: DesignSystem): BuilderProject {
  const themed: BuilderProject = {
    ...project,
    theme: {
      preset: design.industry.label,
      mode: design.industry.mode,
      tokens: { ...project.theme.tokens, ...buildProjectTokens(design) },
      styleOverrides: { ...project.theme.styleOverrides },
    },
  };

  const homeIndex = themed.pages.findIndex((page) => page.isHome);
  if (homeIndex < 0) {
    return themed;
  }

  const home = themed.pages[homeIndex];
  const ordered: Array<(typeof home.sections)[number]> = [];
  const remaining = [...home.sections];

  for (const type of design.sectionOrder) {
    const index = remaining.findIndex((section) => section.type === type);
    if (index >= 0) {
      ordered.push(remaining[index]);
      remaining.splice(index, 1);
    } else if (type !== 'cta' && type !== 'navbar' && type !== 'footer') {
      const fresh = defaultSection(type, ordered.length);
      if (!fresh.content || Object.keys(fresh.content).length === 0) {
        fresh.content = { headline: titleCase(type) };
      }
      ordered.push(fresh);
    }
  }

  const sections = [...ordered, ...remaining].map((section, order) => ({ ...section, order }));
  const pages = [...themed.pages];
  pages[homeIndex] = { ...home, sections };
  return { ...themed, pages };
}

/** Extract the most useful design facts for memory/reporting. */
export function summarizeDesign(design: DesignSystem): Record<string, unknown> {
  return {
    industry: design.industry.label,
    theme: design.theme.primary,
    layout: design.layout.id,
    headingFont: design.typography.headingFont,
    bodyFont: design.typography.bodyFont,
    sectionOrder: design.sectionOrder,
    animationStyle: design.industry.animationStyle,
    imageStyle: design.industry.imageStyle,
    iconFamily: design.icons.family,
    designScore: design.score.overall,
    reviewCycles: design.score.reviewCycles,
  };
}

/** Export the theme tokens type for consumers. */
export type { ThemeTokens };
