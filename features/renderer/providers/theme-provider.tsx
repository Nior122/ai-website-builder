'use client';

// =============================================================================
// Theme Provider
// =============================================================================
// Injects CSS custom properties from a Theme object into the document.
// All section components consume these variables via Tailwind arbitrary values.
// =============================================================================

import { useMemo } from 'react';
import { generateCSSVariables, generateDarkModeCSSVariables } from '../lib/css-variables';
import type { Theme } from '@/types';

interface ThemeProviderProps {
  theme: Theme;
  children: React.ReactNode;
}

export default function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const cssVars = useMemo(() => generateCSSVariables(theme), [theme]);
  const darkModeVars = useMemo(() => generateDarkModeCSSVariables(theme), [theme]);

  const themeClass = theme.mode === 'dark' ? 'dark' : theme.mode === 'system' ? 'theme-system' : 'theme-light';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars + '\n' + darkModeVars }} />
      <div className={themeClass} style={{ fontFamily: 'var(--font-body)' }}>
        {children}
      </div>
    </>
  );
}
