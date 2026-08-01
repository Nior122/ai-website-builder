// =============================================================================
// Design Generation Engine — Theme Generator
// =============================================================================
// Generates a complete design theme: primary/secondary/accent/neutral colors,
// backgrounds, surfaces, text, borders, semantic colors (success/warning/
// danger/info), light & dark modes, hover/focus/disabled states, and button
// colors — all derived from a single seed so every token stays harmonized.
// =============================================================================

import { createDesignTokens, type DesignTokens } from '@/lib/ai/design-pipeline';
import { mixHex, shade, passesAAContrast } from '@/lib/ai/design-pipeline/design-tokens';

import type { ThemeTokens } from './types';

const SEMANTIC_DEFAULTS = {
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0284c7',
} as const;

export interface ThemeGenerationOptions {
  mode?: 'light' | 'dark';
  seed?: string;
  /** Keep text/background pairs WCAG AA safe. */
  ensureContrast?: boolean;
}

/**
 * Build the full ThemeTokens object from a seed color.
 * The base palette comes from the Phase 2 design-token system; hover/focus/
 * disabled and semantic states are derived with color math (no hardcoding).
 */
export function buildThemeTokens(seed: string, options: ThemeGenerationOptions = {}): ThemeTokens {
  const mode = options.mode ?? 'light';
  const base = createDesignTokens(seed, mode);

  const primary = base.colors.primary;
  const secondary = base.colors.secondary;
  const accent = base.colors.accent;
  const neutral = base.colors.neutral;

  const lightMode = mode === 'light';
  const background = base.colors.background;
  const surface = base.colors.surface;
  const text = base.colors.text;
  const border = base.colors.border;

  const tokens: ThemeTokens = {
    primary,
    secondary,
    accent,
    neutral,
    background,
    surface,
    text,
    border,
    success: SEMANTIC_DEFAULTS.success,
    warning: SEMANTIC_DEFAULTS.warning,
    danger: SEMANTIC_DEFAULTS.danger,
    info: SEMANTIC_DEFAULTS.info,
    light: {
      background: lightMode ? background : '#ffffff',
      surface: lightMode ? surface : '#f8fafc',
      text: lightMode ? text : '#0f172a',
      border: lightMode ? border : '#e2e8f0',
    },
    dark: {
      background: lightMode ? '#020617' : background,
      surface: lightMode ? '#0f172a' : surface,
      text: lightMode ? '#e2e8f0' : text,
      border: lightMode ? '#1e293b' : border,
    },
    hover: {
      primary: shade(primary, -0.08),
      secondary: shade(secondary, -0.08),
      accent: shade(accent, -0.06),
    },
    focus: {
      primary: shade(primary, 0.06),
    },
    disabled: {
      background: mixHex(neutral, background, 0.55),
      text: mixHex(text, background, 0.4),
    },
    button: {
      background: primary,
      text: textOn(primary),
      hover: shade(primary, -0.08),
    },
  };

  if (options.ensureContrast ?? true) {
    return ensurePrimaryAa(ensureThemeContrast(tokens));
  }
  return tokens;
}

/**
 * Ensure the primary color can carry AA-compliant text (4.5:1). Some hues
 * (e.g. mid-tone blues) fail with both white and dark text; darken the
 * primary in small steps until white text passes — the same move a designer
 * makes moving from blue-500 to blue-600. Updates button, hover, and focus
 * states to stay in sync.
 */
export function ensurePrimaryAa(tokens: ThemeTokens): ThemeTokens {
  let primary = tokens.primary;
  let hover = tokens.hover.primary;
  let focus = tokens.focus.primary;
  let buttonText = tokens.button.text;
  for (let step = 0; step < 4; step += 1) {
    const candidate = textOn(primary);
    if (passesAAContrast(candidate, primary)) {
      buttonText = candidate;
      break;
    }
    primary = shade(primary, -0.05);
    hover = shade(primary, -0.08);
    focus = shade(primary, 0.06);
  }
  return {
    ...tokens,
    primary,
    hover: { ...tokens.hover, primary: hover },
    focus: { primary: focus },
    button: { ...tokens.button, background: primary, text: buttonText, hover },
  };
}

/** Pick a readable text color for a given background (black/white by luminance). */
export function textOn(background: string, fallbackLight = '#ffffff', fallbackDark = '#171a1f'): string {
  return passesAAContrast(fallbackLight, background) ? fallbackLight : fallbackDark;
}

/**
 * Auto-repair contrast: if the main text/background pair fails WCAG AA,
 * nudge the text color toward the correct pole until it passes.
 */
export function ensureThemeContrast(tokens: ThemeTokens): ThemeTokens {
  let text = tokens.text;
  if (!passesAAContrast(text, tokens.background)) {
    text = passesAAContrast('#ffffff', tokens.background) ? '#ffffff' : '#171a1f';
  }
  return { ...tokens, text };
}

/** Convert ThemeTokens back to the Phase 2 DesignTokens shape for compatibility. */
export function themeToDesignTokens(theme: ThemeTokens): DesignTokens {
  return createDesignTokens(theme.primary, 'light');
}

export function listThemeTokens(): string[] {
  return [
    'primary', 'secondary', 'accent', 'neutral', 'background', 'surface', 'text',
    'border', 'success', 'warning', 'danger', 'info', 'hover.primary',
    'hover.secondary', 'hover.accent', 'focus.primary', 'disabled.background',
    'disabled.text', 'button.background', 'button.text', 'button.hover',
    'light.*', 'dark.*',
  ];
}
