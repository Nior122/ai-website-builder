// =============================================================================
// Consistency Validator
// =============================================================================
// Enforces ONE spacing system, ONE typography system, ONE color system, ONE
// radius system, ONE component style, ONE icon family, ONE animation language
// across the generated design. Reports violations and applies deterministic
// auto-repairs (token substitution) where safe.
// =============================================================================

import type { DesignTokens, DesignValidationReport, ValidationIssue } from './types';

export interface ConsistencyInput {
  /** Radius values actually used by sections (from blueprints). */
  usedRadii?: string[];
  /** Font families actually used. */
  usedFonts?: Array<{ heading?: string; body?: string }>;
  /** Colors actually referenced by generated content. */
  usedColors?: string[];
  /** Spacing values used, in px. */
  usedSpacing?: number[];
  /** Button styles referenced. */
  buttonStyles?: string[];
  /** Icon styles referenced. */
  iconStyles?: string[];
  /** Animation styles referenced. */
  animationStyles?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────

function hexEquals(a: string, b: string): boolean {
  return a.replace('#', '').toLowerCase() === b.replace('#', '').toLowerCase();
}

function isInPalette(color: string, tokens: DesignTokens): boolean {
  const palette = [
    tokens.colors.primary,
    tokens.colors.secondary,
    tokens.colors.accent,
    tokens.colors.success,
    tokens.colors.warning,
    tokens.colors.danger,
    tokens.colors.info,
    tokens.colors.neutral,
    tokens.colors.surface,
    tokens.colors.background,
    tokens.colors.text,
    tokens.colors.border,
    ...Object.values(tokens.primaryShades),
  ];
  return palette.some((candidate) => hexEquals(candidate, color));
}

// ─── Checks ─────────────────────────────────────────────────────────────

export function checkRadiusConsistency(usedRadii: string[], tokens: DesignTokens): ValidationIssue[] {
  const allowed = Object.values(tokens.radius);
  const violations = usedRadii.filter((radius) => !allowed.includes(radius));
  return violations.map((radius) => ({
    rule: 'consistency.radius',
    severity: 'error',
    message: `Radius "${radius}" is not part of the theme radius scale.`,
    fix: `Replace with nearest token: ${tokens.radius.md}`,
  }));
}

export function checkSpacingConsistency(usedSpacing: number[], tokens: DesignTokens): ValidationIssue[] {
  const allowed = Object.values(tokens.spacing);
  const violations = usedSpacing.filter((px) => px % 4 !== 0 || !allowed.includes(px));
  return violations.map((px) => ({
    rule: 'consistency.spacing',
    severity: 'error',
    message: `Spacing ${px}px is not on the 4px scale (or not in the token set).`,
    fix: `Snap to nearest token (e.g. ${allowed[allowed.length - 1]}px max).`,
  }));
}

export function checkFontConsistency(
  usedFonts: Array<{ heading?: string; body?: string }>,
  tokens: DesignTokens
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  usedFonts.forEach((fonts, index) => {
    if (fonts.heading && fonts.heading !== tokens.fontFamily.heading) {
      issues.push({
        rule: 'consistency.typography.heading',
        severity: 'error',
        message: `Section #${index + 1} uses heading font "${fonts.heading}" — theme uses "${tokens.fontFamily.heading}".`,
        fix: `Switch to ${tokens.fontFamily.heading}.`,
      });
    }
    if (fonts.body && fonts.body !== tokens.fontFamily.body) {
      issues.push({
        rule: 'consistency.typography.body',
        severity: 'error',
        message: `Section #${index + 1} uses body font "${fonts.body}" — theme uses "${tokens.fontFamily.body}".`,
        fix: `Switch to ${tokens.fontFamily.body}.`,
      });
    }
  });
  return issues;
}

export function checkColorConsistency(usedColors: string[], tokens: DesignTokens): ValidationIssue[] {
  return usedColors
    .filter((color) => !isInPalette(color, tokens))
    .map((color) => ({
      rule: 'consistency.color',
      severity: 'error',
      message: `Color "${color}" is not in the theme palette.`,
      fix: 'Substitute the nearest palette color (primary/secondary/text).',
    }));
}

export function checkStyleConsistency(input: ConsistencyInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const buttonStyles = new Set(input.buttonStyles ?? []);
  if (buttonStyles.size > 1) {
    issues.push({
      rule: 'consistency.button-style',
      severity: 'error',
      message: `${buttonStyles.size} different button styles referenced: ${[...buttonStyles].join(', ')}.`,
      fix: 'Use one button style for all CTAs (primary variant + ghost variant only).',
    });
  }

  const iconStyles = new Set(input.iconStyles ?? []);
  if (iconStyles.size > 1) {
    issues.push({
      rule: 'consistency.icon-family',
      severity: 'error',
      message: `${iconStyles.size} icon styles referenced: ${[...iconStyles].join(', ')}.`,
      fix: 'Use one icon family/style across the whole site.',
    });
  }

  const animationStyles = new Set(input.animationStyles ?? []);
  if (animationStyles.size > 1) {
    issues.push({
      rule: 'consistency.animation-language',
      severity: 'warning',
      message: `${animationStyles.size} animation languages referenced: ${[...animationStyles].join(', ')}.`,
      fix: 'Use one animation language (duration + easing from motion tokens).',
    });
  }

  return issues;
}

// ─── Report ─────────────────────────────────────────────────────────────

/**
 * Full consistency validation with deterministic auto-repair list.
 */
export function validateConsistency(tokens: DesignTokens, input: ConsistencyInput = {}): DesignValidationReport {
  const issues: ValidationIssue[] = [
    ...checkRadiusConsistency(input.usedRadii ?? [], tokens),
    ...checkSpacingConsistency(input.usedSpacing ?? [], tokens),
    ...checkFontConsistency(input.usedFonts ?? [], tokens),
    ...checkColorConsistency(input.usedColors ?? [], tokens),
    ...checkStyleConsistency(input),
  ];

  // Deterministic auto-repairs (fixes the renderer should apply).
  const repaired: string[] = [];
  (input.usedRadii ?? []).forEach((radius) => {
    if (!Object.values(tokens.radius).includes(radius)) {
      repaired.push(`radius "${radius}" → ${tokens.radius.md}`);
    }
  });
  (input.usedFonts ?? []).forEach((fonts, index) => {
    if (fonts.heading && fonts.heading !== tokens.fontFamily.heading) {
      repaired.push(`section#${index + 1} heading font → ${tokens.fontFamily.heading}`);
    }
  });

  const errors = issues.filter((issue) => issue.severity === 'error');
  return { passed: errors.length === 0, issues, repaired };
}
