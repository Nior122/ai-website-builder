// =============================================================================
// AI Engine Types
// =============================================================================

import type { GenerateRequest, Theme, ColorPalette } from '@/types';

export type GenerationPhase =
  | 'analyzing'
  | 'planning'
  | 'generating'
  | 'refining'
  | 'complete'
  | 'error';

export interface GenerationProgress {
  phase: GenerationPhase;
  message: string;
  progress: number;
  pagesGenerated: number;
  totalPages: number;
  currentSection: string | null;
}

export interface AIPageResult {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  isHome: boolean;
  sections: AISectionResult[];
}

export interface AISectionResult {
  type: string;
  layout: string;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  animations: Record<string, unknown>;
  images: {
    query: string;
    alt: string;
    position: number;
  }[];
}

export interface AIGenerationResult {
  projectId: string;
  pages: AIPageResult[];
  theme: Theme;
  colorPalette: ColorPalette;
  generatedAt: string;
}

export interface AIProjectOutput {
  brand: {
    name: string;
    tagline: string;
    slogan?: string;
    description?: string;
    tone: string;
    mission?: string;
    vision?: string;
    values?: string[];
    colors?: {
      primary: string;
      secondary: string;
      accent: string;
      background?: string;
      surface?: string;
      text?: string;
      textSecondary?: string;
      border?: string;
    };
    typography?: {
      heading: string;
      body: string;
      mono?: string;
    };
  };
  pages: {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    isHome: boolean;
    sections: {
      type: string;
      layout: string;
      content: Record<string, unknown>;
      styles?: Record<string, unknown>;
      animations?: Array<{
        type: string;
        duration: number;
        delay: number;
        easing?: string;
        once?: boolean;
      }>;
      images?: Array<{
        query: string;
        alt: string;
        position?: number;
      }>;
    }[];
  }[];
  theme?: {
    name?: string;
    mode?: string;
    preset?: string;
    colors?: Record<string, unknown>;
    typography?: Record<string, unknown>;
    spacing?: Record<string, unknown>;
    borderRadius?: Record<string, unknown>;
    shadows?: Record<string, unknown>;
    animations?: Record<string, unknown>;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    jsonLd?: Array<{ type: string; data: Record<string, unknown> }>;
    sitemap?: boolean;
    robotsTxt?: string;
  };
}

export interface AIServiceConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
}
