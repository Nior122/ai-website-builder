// =============================================================================
// Page Renderer
// =============================================================================
// Takes a Page object, sorts sections by order, and renders each via
// SectionRenderer. Wraps everything in ThemeProvider for CSS variable injection.
// =============================================================================

'use client';

import type { Page, Theme } from '@/types';
import ThemeProvider from '../providers/theme-provider';
import { SectionRenderer } from './section-renderer';

interface PageRendererProps {
  page: Page;
  theme: Theme;
  isEditor?: boolean;
}

export function PageRenderer({ page, theme, isEditor = false }: PageRendererProps) {
  // Sort sections by their order field
  const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);

  return (
    <ThemeProvider theme={theme}>
      <main className="min-h-screen">
        {sortedSections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            isEditor={isEditor}
          />
        ))}
      </main>
    </ThemeProvider>
  );
}
