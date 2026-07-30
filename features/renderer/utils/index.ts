// =============================================================================
// Renderer Utilities
// =============================================================================

import type { Section, Theme, ColorPalette, TypographyConfig, SectionVisibility } from '@/types';

/**
 * Generate inline CSS variables from a theme for a section.
 */
export function generateSectionStyles(
  theme: Theme,
  sectionStyles: Record<string, unknown>
): React.CSSProperties {
  const vars: Record<string, string> = {};

  if (theme.colors) {
    vars['--color-primary'] = theme.colors.primary as any;
    vars['--color-secondary'] = theme.colors.secondary as any;
    vars['--color-accent'] = theme.colors.accent as any;
    vars['--color-background'] = theme.colors.background;
    vars['--color-surface'] = theme.colors.surface;
    vars['--color-text'] = theme.colors.text;
    vars['--color-text-muted'] = theme.colors.textMuted;
  }

  if (theme.typography) {
    vars['--font-heading'] = theme.typography.fontFamily.heading;
    vars['--font-body'] = theme.typography.fontFamily.body;
    vars['--font-size-base'] = `${(theme.typography as any).baseFontSize ?? 16}px`;
  }

  return {
    ...vars,
    ...convertToCSSProperties(sectionStyles),
  } as React.CSSProperties;
}

/**
 * Check if a section is visible at a given breakpoint.
 */
export function isSectionVisible(
  visibility: SectionVisibility | Record<string, unknown> | undefined,
  breakpoint: 'desktop' | 'tablet' | 'mobile'
): boolean {
  if (!visibility) return true;
  const vis = visibility as SectionVisibility;
  return vis[breakpoint] !== false;
}

/**
 * Get the appropriate columns for a section layout at a breakpoint.
 */
export function getLayoutColumns(
  layout: string,
  breakpoint: 'desktop' | 'tablet' | 'mobile'
): number {
  const layouts: Record<string, Record<string, number>> = {
    '1-col': { desktop: 1, tablet: 1, mobile: 1 },
    '2-col': { desktop: 2, tablet: 2, mobile: 1 },
    '3-col': { desktop: 3, tablet: 2, mobile: 1 },
    '4-col': { desktop: 4, tablet: 2, mobile: 2 },
    'sidebar-left': { desktop: 3, tablet: 1, mobile: 1 },
    'sidebar-right': { desktop: 3, tablet: 1, mobile: 1 },
  };
  return layouts[layout]?.[breakpoint] ?? 1;
}

function convertToCSSProperties(styles: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(styles)) {
    if (typeof value === 'string' || typeof value === 'number') {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      result[cssKey] = String(value);
    }
  }
  return result;
}
