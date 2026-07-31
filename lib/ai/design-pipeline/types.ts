// =============================================================================
// Design Pipeline — Shared Types
// =============================================================================
// Self-contained types for the design-aware generation pipeline. Kept
// independent of the app's domain types so the pipeline stays decoupled and
// testable.
// =============================================================================

export interface DesignBrief {
  businessName?: string;
  description: string;
  industry: string;
  businessType: string;
  tone?: string;
  pages?: string[];
  language?: string;
}

export type ColorMode = 'light' | 'dark';

export interface DesignTokens {
  seed: string;
  mode: ColorMode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    neutral: string;
    surface: string;
    background: string;
    text: string;
    border: string;
  };
  /** Primary color shades 50..950. */
  primaryShades: Record<string, string>;
  shadow: { sm: string; md: string; lg: string };
  radius: { sm: string; md: string; lg: string; xl: string; full: string };
  spacing: Record<string, number>;
  fontSize: Record<string, string>;
  fontFamily: { heading: string; body: string; mono: string };
  lineHeight: { tight: number; snug: number; normal: number; relaxed: number };
  letterSpacing: { tight: string; normal: string; wide: string };
  motion: { fast: number; base: number; slow: number; easing: string };
  style: {
    icon: string;
    button: string;
    card: string;
    illustration: string;
    photography: string;
    animation: string;
  };
}

export interface ThemeDesign {
  preset: string;
  mode: ColorMode;
  fonts: { heading: string; body: string; mono: string };
  tokens: DesignTokens;
  description: string;
}

export interface BrandDesign {
  name: string;
  tagline: string;
  description: string;
  tone: string;
  mission: string;
  vision: string;
  values: string[];
  voiceRules: string[];
  style: {
    button: string;
    card: string;
    icon: string;
    illustration: string;
    photography: string;
    animation: string;
  };
}

export interface CopyBlock {
  key: string;
  text: string;
}

export interface SectionBlueprint {
  type: string;
  layout: string;
  tokens: {
    spacing: string;
    elevation: string;
    radius: string;
    typography: { heading: string; body: string };
  };
  aria: string[];
  order: number;
}

export interface ValidationIssue {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  fix?: string;
}

export interface DesignValidationReport {
  passed: boolean;
  issues: ValidationIssue[];
  repaired: string[];
}

export interface DesignStageResult {
  stage: string;
  skill: string | null;
  ok: boolean;
  errors: string[];
  durationMs: number;
}

export interface DesignPipelineResult {
  success: boolean;
  stages: DesignStageResult[];
  tokens: DesignTokens | null;
  brand: BrandDesign | null;
  theme: ThemeDesign | null;
  copy: CopyBlock[];
  blueprints: SectionBlueprint[];
  validation: DesignValidationReport | null;
  errors: string[];
}
