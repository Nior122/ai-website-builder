// =============================================================================
// Renderer Types
// =============================================================================

import type { Section, Theme, SectionVisibility } from '@/types';

export interface RendererProps {
  sections: Section[];
  theme: Theme;
  isPreview?: boolean;
  className?: string;
}

export interface SectionRendererProps {
  section: Section;
  theme: Theme;
  isPreview?: boolean;
}

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveConfig {
  breakpoint: Breakpoint;
  maxWidth: number;
  columns: number;
  gap: string;
}

export interface RenderedComponent {
  type: string;
  component: React.ComponentType<SectionRendererProps>;
}
