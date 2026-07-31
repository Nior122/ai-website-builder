// =============================================================================
// Design Pipeline — Barrel Exports
// =============================================================================
// The design-aware generation pipeline: branding, theme/tokens, layout and
// section design, copywriting, accessibility, performance, consistency, and
// validation — every stage powered by installed skills.
// =============================================================================

export { runDesignPipeline, toDesignBrief, buildCopyPrompt } from './design-pipeline';
export type { DesignBriefInput } from './design-pipeline';

export { createDesignTokens, getDefaultDesignTokens, contrastRatio, passesAAContrast, luminance } from './design-tokens';
export { generateThemeForBusiness, getThemePreset, listThemePresets, getThemePresetConfig } from './theme-generator';
export type { ThemePresetConfig } from './theme-generator';
export { buildBrandDesign, deriveBusinessName, styleDirectionForTone, TONE_VOICE_RULES } from './branding-engine';
export { buildCopyBlocks } from './copywriter';
export { designSection, getSectionBlueprint, defaultPageBlueprint, SECTION_BLUEPRINTS } from './section-designer';
export { checkAccessibility, checkTokensContrast } from './accessibility-checker';
export { auditPerformance, auditImages, auditPageWeight, performanceRecommendations } from './performance-audit';
export { validateConsistency, checkRadiusConsistency, checkSpacingConsistency, checkFontConsistency, checkColorConsistency } from './consistency-validator';

export type {
  DesignBrief,
  DesignTokens,
  ThemeDesign,
  BrandDesign,
  CopyBlock,
  SectionBlueprint,
  ValidationIssue,
  DesignValidationReport,
  DesignStageResult,
  DesignPipelineResult,
} from './types';
