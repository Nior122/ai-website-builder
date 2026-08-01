// =============================================================================
// Design Generation Engine — Barrel Exports
// =============================================================================
// The AI Theme & Component Generation Engine (Phase 6): generates a complete,
// premium design system per business — theme, typography, layout, components,
// section order, animations, icons, image direction, responsive + accessibility
// rules — reviewed by five design skills and revised until it scores 9/10+.
// =============================================================================

export {
  DesignGenerationEngine,
  applyDesignSystemToProject,
  buildProjectTokens,
  summarizeDesign,
  type DesignEngineOptions,
} from './design-generation-engine';

export { classifyIndustry, findIndustry, listIndustries, industryLabel, INDUSTRY_PROFILES } from './industry-profiles';
export { buildThemeTokens, ensureThemeContrast, textOn, themeToDesignTokens, listThemeTokens } from './theme-generator';
export { buildTypographySystem, getFontPair, isPremiumFont, googleFontsUrl, FONT_PAIRS, FONT_STYLES } from './typography-engine';
export { selectLayout, getLayoutPattern, listLayouts, LAYOUT_PATTERNS } from './layout-engine';
export { generateComponents, getComponentVariants, listComponentTypes, COMPONENT_TYPES, COMPONENT_VARIANTS } from './component-generator';
export { buildSectionOrder, listArchetypes, SECTION_ORDER_ARCHETYPES } from './section-ordering';
export { assignAnimations, listAnimationStyles, ANIMATION_STYLE_RULES } from './animation-engine';
export { buildImageDirection, IMAGE_STYLE_PROFILES } from './image-direction';
export { buildIconSet, listIconNiches, ICON_SETS } from './icon-intelligence';
export { buildResponsiveRules, listBreakpoints, BREAKPOINTS } from './responsive-engine';
export { buildAccessibilityRules, checkThemeContrast, ARIA_LANDMARKS, type ContrastIssue } from './accessibility-engine';
export { selectTheme, getThemeEntry, listThemes, THEME_LIBRARY, type ThemeSelection } from './theme-library';
export { checkDesignConsistency, repairConsistency, cloneDesign, componentCoverage, type ConsistencyIssue, type ConsistencyReport } from './consistency-checker';
export { reviewDesign, reviseDesign, evaluateDesign, ensureAccessibleTokens, DESIGN_REVIEWERS, REVIEW_CRITERIA, listReviewers } from './design-review';

export type {
  IndustryProfile,
  ThemeTokens,
  TypographySystem,
  LayoutSpec,
  ComponentSpec,
  ComponentVariantSpec,
  AnimationSpec,
  SectionAnimation,
  ImageSpec,
  ResponsiveRules,
  AccessibilityRules,
  DesignReviewCriteria,
  DesignReviewScore,
  DesignScore,
  DesignSystem,
} from './types';
