// =============================================================================
// CSS Variables Generator
// =============================================================================
// Converts a Theme object into CSS custom properties.
// These variables are injected via <style> tag by ThemeProvider,
// and consumed by all section components via Tailwind arbitrary values.
// =============================================================================

import type { Theme } from '@/types';

/**
 * Generate a CSS string of :root custom properties from a Theme object.
 */
export function generateCSSVariables(theme: Theme): string {
  const vars: string[] = [];

  // Safely access deeply nested fields — theme can be an empty `{}` when a
  // project is created through the dashboard (createProject sets globalStyles:
  // {}).  Guard every nested access with optional chaining so this never
  // throws at render time.
  const colors: Record<string, any> = (theme?.colors ?? {}) as Record<string, any>;
  const typography: Record<string, any> = (theme?.typography ?? {}) as Record<string, any>;
  const spacing: Record<string, any> = (theme?.spacing ?? {}) as Record<string, any>;
  const borderRadius: Record<string, any> = (theme?.borderRadius ?? {}) as Record<string, any>;
  const shadows: Record<string, any> = (theme?.shadows ?? {}) as Record<string, any>;
  const animations: Record<string, any> = (theme?.animations ?? {}) as Record<string, any>;

  // ── Colors ────────────────────────────────────────────────────────
  addShadeVarsSafe(vars, 'color-primary', colors.primary);
  addShadeVarsSafe(vars, 'color-secondary', colors.secondary);
  addShadeVarsSafe(vars, 'color-accent', colors.accent);
  addShadeVarsSafe(vars, 'color-neutral', colors.neutral);

  vars.push(`  --color-background: ${colors.background ?? '#ffffff'}`);
  vars.push(`  --color-surface: ${colors.surface ?? '#fafafa'}`);
  vars.push(`  --color-surface-hover: ${colors.surfaceHover ?? '#f5f5f5'}`);
  vars.push(`  --color-text: ${colors.text ?? '#171717'}`);
  vars.push(`  --color-text-secondary: ${colors.textSecondary ?? '#525252'}`);
  vars.push(`  --color-text-muted: ${colors.textMuted ?? '#a3a3a3'}`);
  vars.push(`  --color-border: ${colors.border ?? '#e5e5e5'}`);
  vars.push(`  --color-border-light: ${colors.borderLight ?? '#f0f0f0'}`);

  addShadeVarsSafe(vars, 'color-success', colors.success);
  addShadeVarsSafe(vars, 'color-warning', colors.warning);
  addShadeVarsSafe(vars, 'color-error', colors.error);
  addShadeVarsSafe(vars, 'color-info', colors.info);

  const gradient = (colors.gradient ?? {}) as Record<string, string>;
  vars.push(`  --gradient-primary: ${gradient.primary ?? 'transparent'}`);
  vars.push(`  --gradient-secondary: ${gradient.secondary ?? 'transparent'}`);
  vars.push(`  --gradient-accent: ${gradient.accent ?? 'transparent'}`);
  vars.push(`  --gradient-mesh: ${gradient.mesh ?? 'transparent'}`);

  // ── Typography ────────────────────────────────────────────────────
  const fontFamily = (typography.fontFamily ?? {}) as Record<string, string>;
  const lineHeight = (typography.lineHeight ?? {}) as Record<string, string>;
  vars.push(`  --font-heading: ${fontFamily.heading ?? 'inherit'}`);
  vars.push(`  --font-body: ${fontFamily.body ?? 'inherit'}`);
  vars.push(`  --font-mono: ${fontFamily.mono ?? 'monospace'}`);
  vars.push(`  --type-scale: ${typography.scale ?? '1'}`);
  vars.push(`  --leading-tight: ${lineHeight.tight ?? '1.25'}`);
  vars.push(`  --leading-snug: ${lineHeight.snug ?? '1.375'}`);
  vars.push(`  --leading-normal: ${lineHeight.normal ?? '1.5'}`);
  vars.push(`  --leading-relaxed: ${lineHeight.relaxed ?? '1.625'}`);
  vars.push(`  --leading-loose: ${lineHeight.loose ?? '2'}`);

  // ── Spacing ───────────────────────────────────────────────────────
  const unit = spacing.unit ?? 4;
  vars.push(`  --spacing-unit: ${unit}px`);
  const scale = Array.isArray(spacing.scale) ? spacing.scale : [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64];
  scale.forEach((val: number, i: number) => {
    if (typeof val === 'number') {
      vars.push(`  --spacing-${i}: ${val * unit}px`);
    }
  });

  // ── Border Radius ─────────────────────────────────────────────────
  vars.push(`  --radius-sm: ${borderRadius.sm ?? '2px'}`);
  vars.push(`  --radius-md: ${borderRadius.md ?? '4px'}`);
  vars.push(`  --radius-lg: ${borderRadius.lg ?? '8px'}`);
  vars.push(`  --radius-xl: ${borderRadius.xl ?? '12px'}`);
  vars.push(`  --radius-2xl: ${borderRadius['2xl'] ?? '16px'}`);
  vars.push(`  --radius-full: ${borderRadius.full ?? '9999px'}`);

  // ── Shadows ───────────────────────────────────────────────────────
  vars.push(`  --shadow-sm: ${shadows.sm ?? 'none'}`);
  vars.push(`  --shadow-md: ${shadows.md ?? 'none'}`);
  vars.push(`  --shadow-lg: ${shadows.lg ?? 'none'}`);
  vars.push(`  --shadow-xl: ${shadows.xl ?? 'none'}`);
  vars.push(`  --shadow-2xl: ${shadows['2xl'] ?? 'none'}`);
  vars.push(`  --shadow-inner: ${shadows.inner ?? 'none'}`);
  vars.push(`  --shadow-glow: ${shadows.glow ?? 'none'}`);

  // ── Animation ─────────────────────────────────────────────────────
  const duration = (animations.duration ?? {}) as Record<string, number>;
  const easing = (animations.easing ?? {}) as Record<string, string>;
  vars.push(`  --duration-fast: ${duration.fast ?? 150}ms`);
  vars.push(`  --duration-normal: ${duration.normal ?? 300}ms`);
  vars.push(`  --duration-slow: ${duration.slow ?? 500}ms`);
  vars.push(`  --easing-default: ${easing.default ?? 'ease'}`);
  vars.push(`  --easing-in: ${easing.in ?? 'ease-in'}`);
  vars.push(`  --easing-out: ${easing.out ?? 'ease-out'}`);
  vars.push(`  --easing-in-out: ${easing.inOut ?? 'ease-in-out'}`);

  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Like addShadeVars but tolerates a null/undefined/empty shade map.
 */
function addShadeVarsSafe(
  vars: string[],
  prefix: string,
  shade: unknown
): void {
  if (!shade || typeof shade !== 'object') return;
  for (const [key, value] of Object.entries(shade as Record<string, string>)) {
    vars.push(`  --${prefix}-${key}: ${value}`);
  }
}

/**
 * Generate dark mode CSS variables (inverted colors).
 */
export function generateDarkModeCSSVariables(theme: Theme): string {
  const vars: string[] = [];

  // In dark mode, swap background/text
  vars.push(`  --color-background: #0F172A`);
  vars.push(`  --color-surface: #1E293B`);
  vars.push(`  --color-surface-hover: #334155`);
  vars.push(`  --color-text: #F8FAFC`);
  vars.push(`  --color-text-secondary: #CBD5E1`);
  vars.push(`  --color-text-muted: #64748B`);
  vars.push(`  --color-border: #334155`);
  vars.push(`  --color-border-light: #1E293B`);

  return `@media (prefers-color-scheme: dark) {\n  .theme-system {\n${vars.map((v) => '  ' + v).join('\n')}\n  }\n}\n\n.dark {\n${vars.join('\n')}\n}`;
}

// ── Helpers ────────────────────────────────────────────────────────────

function addShadeVars(
  vars: string[],
  prefix: string,
  shade: Record<string, string>
): void {
  for (const [key, value] of Object.entries(shade)) {
    vars.push(`  --${prefix}-${key}: ${value}`);
  }
}
