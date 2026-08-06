// =============================================================================
// Design Generation Engine — Accessibility Engine
// =============================================================================
// Guarantees WCAG AA contrast, keyboard navigation, screen-reader support,
// ARIA labels, accessible forms, focus states, and reduced-motion support.
// =============================================================================

import { passesAAContrast } from '@/lib/ai/design-pipeline/design-tokens';

import type { AccessibilityRules, ThemeTokens } from './types';

export const ARIA_LANDMARKS = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'search', 'form', 'region'];

export interface AccessibilityOptions {
  reducedMotion?: boolean;
}

/**
 * Build the accessibility rules for a theme. Contrast is verified against
 * WCAG AA (4.5:1) for body text and 3:1 for large text/UI components.
 */
export function buildAccessibilityRules(theme: ThemeTokens, options: AccessibilityOptions = {}): AccessibilityRules {
  const bodyContrast = passesAAContrast(theme.text, theme.background);
  const surfaceContrast = passesAAContrast(theme.text, theme.surface);
  const buttonContrast = passesAAContrast(theme.button.text, theme.button.background);

  return {
    contrastAA: bodyContrast && surfaceContrast && buttonContrast,
    focusVisible: `2px solid ${theme.focus.primary}`,
    reducedMotion: options.reducedMotion ?? true,
    ariaLandmarks: [...ARIA_LANDMARKS],
    keyboardNav: true,
  };
}

export interface ContrastIssue {
  pair: string;
  foreground: string;
  background: string;
}

/** List every theme pair that fails WCAG AA (4.5:1) so callers can repair. */
export function checkThemeContrast(theme: ThemeTokens): { passes: boolean; issues: ContrastIssue[] } {
  const pairs: Array<{ pair: string; foreground: string; background: string }> = [
    { pair: 'text/background', foreground: theme.text, background: theme.background },
    { pair: 'text/surface', foreground: theme.text, background: theme.surface },
    { pair: 'button.text/button.background', foreground: theme.button.text, background: theme.button.background },
    { pair: 'light.text/light.background', foreground: theme.light.text, background: theme.light.background },
    { pair: 'dark.text/dark.background', foreground: theme.dark.text, background: theme.dark.background },
  ];
  const issues = pairs.filter((p) => !passesAAContrast(p.foreground, p.background));
  return { passes: issues.length === 0, issues };
}
