// =============================================================================
// Design Generation Engine — Core Types
// =============================================================================
// The complete, reusable DesignSystem object the engine produces: theme,
// typography, color tokens, component variants, layout choices, animation
// rules, icon set, image direction, responsive rules, accessibility rules,
// and design score.
// =============================================================================

export interface IndustryProfile {
  id: string;
  label: string;
  /** Preferred layout pattern id (see layout-engine). */
  layoutPatterns: string[];
  /** Font style key (see typography-engine FONT_PAIRS). */
  typographyStyle: string;
  /** Seed color for the theme. */
  seed: string;
  mode: 'light' | 'dark';
  iconNiche: string;
  animationStyle: string;
  imageStyle: string;
  /** Preferred section sequence (see section-ordering archetypes). */
  sectionArchetype: string;
  description: string;
}

export interface ThemeTokens {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  light: { background: string; surface: string; text: string; border: string };
  dark: { background: string; surface: string; text: string; border: string };
  hover: { primary: string; secondary: string; accent: string };
  focus: { primary: string };
  disabled: { background: string; text: string };
  button: { background: string; text: string; hover: string };
}

export interface TypographySystem {
  headingFont: string;
  bodyFont: string;
  buttonFont: string;
  displayFont: string;
  weights: { heading: number; body: number; button: number; display: number };
  lineHeights: { tight: number; snug: number; normal: number; relaxed: number; display: number };
  letterSpacing: { tight: string; normal: string; wide: string; display: string };
  headingScale: string[];
  bodyScale: string[];
  responsive: { mobileScale: string; desktopScale: string };
}

export interface LayoutSpec {
  id: string;
  label: string;
  grid: string;
  hero: string;
  containerWidth: string;
  columns: number;
  sectionSpacing: string;
  modern: boolean;
  description: string;
}

export interface ComponentVariantSpec {
  id: string;
  label: string;
  layout: string;
  tokens: Record<string, unknown>;
}

export interface ComponentSpec {
  type: string;
  variants: ComponentVariantSpec[];
  chosenVariant: string;
}

export interface AnimationSpec {
  name: string;
  durationMs: number;
  easing: string;
  trigger: 'on-load' | 'on-scroll' | 'on-hover' | 'none';
  restraint: 'subtle' | 'moderate' | 'playful' | 'none';
}

export interface SectionAnimation {
  sectionType: string;
  animation: AnimationSpec;
}

export interface ImageSpec {
  sectionType: string;
  purpose: string;
  composition: string;
  cameraAngle: string;
  lighting: string;
  mood: string;
  colorGrading: string;
  style: string;
  prompt: string;
  aspectRatio: string;
}

export interface ResponsiveRules {
  breakpoints: { desktop: number; laptop: number; tablet: number; largeMobile: number; mobile: number };
  spacing: Record<string, number>;
  columns: Record<string, number>;
  fontSizeScale: Record<string, string>;
  navBehavior: Record<string, string>;
  cardColumns: Record<string, number>;
  buttonSize: Record<string, string>;
  imageAspect: Record<string, string>;
}

export interface AccessibilityRules {
  contrastAA: boolean;
  focusVisible: string;
  reducedMotion: boolean;
  ariaLandmarks: string[];
  keyboardNav: boolean;
}

export interface DesignReviewCriteria {
  visualHierarchy: number;
  modernAppearance: number;
  professionalism: number;
  spacing: number;
  alignment: number;
  typography: number;
  whiteSpace: number;
  consistency: number;
  componentQuality: number;
  responsiveness: number;
  accessibility: number;
}

export interface DesignReviewScore {
  reviewer: string;
  criteria: DesignReviewCriteria;
  total: number;
  passed: boolean;
  feedback: string[];
}

export interface DesignScore {
  overall: number;
  reviewers: DesignReviewScore[];
  passed: boolean;
  reviewCycles: number;
}

export interface DesignSystem {
  industry: IndustryProfile;
  theme: ThemeTokens;
  typography: TypographySystem;
  layout: LayoutSpec;
  components: ComponentSpec[];
  sectionOrder: string[];
  animations: SectionAnimation[];
  icons: { family: string; set: string[] };
  imageDirection: ImageSpec[];
  responsive: ResponsiveRules;
  accessibility: AccessibilityRules;
  spacingScale: number[];
  score: DesignScore;
  generatedAt: number;
}
