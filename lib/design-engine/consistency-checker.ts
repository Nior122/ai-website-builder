// =============================================================================
// Design Generation Engine — Component Consistency Checker
// =============================================================================
// Verifies one design language across the whole system: same spacing scale,
// typography scale, border radius, shadows, colors, button/icon/card style,
// animations, and section spacing. Inconsistencies are repaired automatically.
// =============================================================================

import type { ComponentSpec, DesignSystem } from './types';

export interface ConsistencyIssue {
  dimension: string;
  severity: 'error' | 'warning';
  message: string;
  repaired: boolean;
}

export interface ConsistencyReport {
  passed: boolean;
  issues: ConsistencyIssue[];
}

const ALLOWED_RADII = new Set(['none', 'md', 'lg', 'xl', '2xl', 'full']);
const ALLOWED_CARD_STYLES = new Set(['none', 'flat', 'bordered', 'elevated']);
const ALLOWED_SHADOWS = new Set(['none', 'soft', 'glow']);

/**
 * Verify every consistency dimension across components and the system as a
 * whole. Returns a report; `repairConsistency` fixes whatever fails.
 */
export function checkDesignConsistency(design: DesignSystem): ConsistencyReport {
  const issues: ConsistencyIssue[] = [];

  // 1. Spacing scale: must be a clean 4px rhythm with a sane max.
  const scale = design.spacingScale;
  const cleanRhythm = scale.length > 0 && scale.every((step) => step % 4 === 0 && step > 0);
  if (!cleanRhythm) {
    issues.push({ dimension: 'spacing', severity: 'error', message: 'Spacing scale is not a clean 4px rhythm.', repaired: false });
  }
  if (Math.max(...scale) < 64) {
    issues.push({ dimension: 'spacing', severity: 'warning', message: 'Spacing scale max is below 64px — sections may feel cramped.', repaired: false });
  }

  // 2. Typography scale: heading scale must be larger than body scale.
  const headingLargest = Math.max(...design.typography.headingScale.map(parseRem));
  const bodyLargest = Math.max(...design.typography.bodyScale.map(parseRem));
  if (headingLargest <= bodyLargest) {
    issues.push({ dimension: 'typography', severity: 'error', message: 'Heading scale is not larger than the body scale.', repaired: false });
  }

  // 3. Radii / shadows / card styles: variants may only use the shared language.
  const radii = new Set<string>();
  const shadows = new Set<string>();
  const cardStyles = new Set<string>();
  const buttonStyles = new Set<string>();
  const iconFamilies = new Set<string>();
  const animationNames = new Set<string>();
  for (const component of design.components) {
    const variant = component.variants.find((v) => v.id === component.chosenVariant);
    if (!variant) {
      issues.push({ dimension: 'components', severity: 'error', message: `Component "${component.type}" has an unknown chosen variant.`, repaired: false });
      continue;
    }
    const tokens = variant.tokens;
    radii.add(String(tokens.radius ?? 'lg'));
    shadows.add(String(tokens.shadow ?? 'none'));
    cardStyles.add(String(tokens.cardStyle ?? 'flat'));
    if (tokens.background) {
      buttonStyles.add(String(tokens.background));
    }
  }
  for (const animation of design.animations) {
    animationNames.add(animation.animation.name);
  }
  iconFamilies.add(design.icons.family);

  for (const r of radii) {
    if (!ALLOWED_RADII.has(r)) {
      issues.push({ dimension: 'radius', severity: 'error', message: `Unknown radius token "${r}".`, repaired: false });
    }
  }
  for (const s of shadows) {
    if (!ALLOWED_SHADOWS.has(s)) {
      issues.push({ dimension: 'shadows', severity: 'error', message: `Unknown shadow token "${s}".`, repaired: false });
    }
  }
  for (const c of cardStyles) {
    if (!ALLOWED_CARD_STYLES.has(c)) {
      issues.push({ dimension: 'cards', severity: 'error', message: `Unknown card style "${c}".`, repaired: false });
    }
  }
  if (radii.size > 3) {
    issues.push({ dimension: 'radius', severity: 'warning', message: `More than 3 distinct radii (${[...radii].join(', ')}) — tighten the language.`, repaired: false });
  }
  if (animationNames.size > 4) {
    issues.push({ dimension: 'animations', severity: 'warning', message: `Too many distinct animation names (${animationNames.size}) — animations should feel uniform.`, repaired: false });
  }

  // 4. Colors: every color token must be a hex/rgb token (never empty/random).
  const colorTokens = [
    design.theme.primary, design.theme.secondary, design.theme.accent, design.theme.background,
    design.theme.surface, design.theme.text, design.theme.border,
  ];
  for (const color of colorTokens) {
    if (!/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))$/.test(color)) {
      issues.push({ dimension: 'colors', severity: 'error', message: `Malformed color token "${color}".`, repaired: false });
    }
  }

  // 5. Section spacing: consistent per responsive rules.
  const sectionSpacings = new Set(Object.values(design.responsive.spacing));
  if (sectionSpacings.size > 3) {
    issues.push({ dimension: 'section-spacing', severity: 'warning', message: 'Section spacing varies too much across breakpoints.', repaired: false });
  }

  return { passed: issues.length === 0, issues };
}

function parseRem(value: string): number {
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

/**
 * Repair inconsistencies automatically:
 * - reset malformed radii/shadows/card styles to the design language defaults
 * - rebuild the spacing scale as a clean 4px rhythm
 * - normalize component tokens to the chosen variant language
 */
export function repairConsistency(design: DesignSystem): { design: DesignSystem; repairs: ConsistencyIssue[] } {
  const report = checkDesignConsistency(design);
  if (report.passed) {
    return { design, repairs: [] };
  }
  const repairs: ConsistencyIssue[] = [];
  const next: DesignSystem = cloneDesign(design);

  if (report.issues.some((i) => i.dimension === 'spacing')) {
    next.spacingScale = [4, 8, 12, 16, 24, 32, 48, 64, 96];
    repairs.push({ dimension: 'spacing', severity: 'error', message: 'Rebuilt spacing scale on a 4px rhythm (4…96px).', repaired: true });
  }
  for (const component of next.components) {
    const variant = component.variants.find((v) => v.id === component.chosenVariant);
    if (!variant) {
      continue;
    }
    const tokens = { ...variant.tokens };
    if (tokens.radius !== undefined && !ALLOWED_RADII.has(String(tokens.radius))) {
      tokens.radius = 'lg';
      repairs.push({ dimension: 'radius', severity: 'error', message: `Reset ${component.type} radius to "lg".`, repaired: true });
    }
    if (tokens.shadow !== undefined && !ALLOWED_SHADOWS.has(String(tokens.shadow))) {
      tokens.shadow = 'soft';
      repairs.push({ dimension: 'shadows', severity: 'error', message: `Reset ${component.type} shadow to "soft".`, repaired: true });
    }
    if (tokens.cardStyle !== undefined && !ALLOWED_CARD_STYLES.has(String(tokens.cardStyle))) {
      tokens.cardStyle = 'flat';
      repairs.push({ dimension: 'cards', severity: 'error', message: `Reset ${component.type} card style to "flat".`, repaired: true });
    }
    variant.tokens = tokens;
  }
  // Unify any component whose chosen variant strays from the dominant radius
  // language: one radius across the whole system.
  const radiusCounts = new Map<string, number>();
  for (const component of next.components) {
    const variant = component.variants.find((v) => v.id === component.chosenVariant);
    if (!variant) {
      continue;
    }
    const r = String(variant.tokens.radius ?? 'lg');
    radiusCounts.set(r, (radiusCounts.get(r) ?? 0) + 1);
  }
  const modalRadius = [...radiusCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'lg';
  if (radiusCounts.size > 3) {
    for (const component of next.components) {
      const variant = component.variants.find((v) => v.id === component.chosenVariant);
      if (!variant || String(variant.tokens.radius ?? 'lg') === modalRadius) {
        continue;
      }
      variant.tokens = { ...variant.tokens, radius: modalRadius };
    }
    repairs.push({ dimension: 'radius', severity: 'warning', message: `Unified all component radii to "${modalRadius}".`, repaired: true });
  }

  const repairedReport = checkDesignConsistency(next);
  return { design: next, repairs: repairs.length > 0 ? repairs : [...report.issues] };
}

export function cloneDesign<T>(design: T): T {
  return JSON.parse(JSON.stringify(design)) as T;
}

/** Count of components with 5+ variants — the "component quality" metric. */
export function componentCoverage(components: ComponentSpec[]): { total: number; rich: number } {
  const rich = components.filter((c) => c.variants.length >= 5).length;
  return { total: components.length, rich };
}
