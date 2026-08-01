// =============================================================================
// Agent System — Core Types
// =============================================================================
// Shared types for the multi-agent orchestration system: agent ids, statuses,
// results, metadata, and every agent's typed output contract.
// =============================================================================

import type { CopyBlock } from '@/lib/ai/design-pipeline';

export type AgentId =
  | 'business'
  | 'brand'
  | 'ux'
  | 'ui'
  | 'copy'
  | 'images'
  | 'seo'
  | 'frontend'
  | 'accessibility'
  | 'performance'
  | 'security'
  | 'qa';

export type AgentStatus = 'pending' | 'running' | 'succeeded' | 'retrying' | 'fallback' | 'failed';

export interface AgentMeta {
  label: string;
  purpose: string;
  dependencies: AgentId[];
  outputKey: string;
}

/** Agent execution order (dependency order). */
export const AGENT_ORDER: AgentId[] = [
  'business',
  'brand',
  'ux',
  'ui',
  'copy',
  'images',
  'seo',
  'frontend',
  'accessibility',
  'performance',
  'security',
  'qa',
];

export const AGENT_META: Record<AgentId, AgentMeta> = {
  business: {
    label: 'Business Analyst',
    purpose: 'Understand the user’s business: industry, audience, problems, offerings, goals, competitors, USP.',
    dependencies: [],
    outputKey: 'business',
  },
  brand: {
    label: 'Brand Identity',
    purpose: 'Create the visual identity: personality, colors, typography, direction, logo concept, image style, voice.',
    dependencies: ['business'],
    outputKey: 'brand',
  },
  ux: {
    label: 'UX Strategist',
    purpose: 'Plan the experience: user journey, information hierarchy, conversion flow, page structure, section order.',
    dependencies: ['business', 'brand'],
    outputKey: 'ux',
  },
  ui: {
    label: 'UI Design',
    purpose: 'Create visual design decisions: layout, components, grid, spacing, animation, interactions.',
    dependencies: ['business', 'brand', 'ux'],
    outputKey: 'ui',
  },
  copy: {
    label: 'Copywriting',
    purpose: 'Write professional, brand-voiced copy for every section.',
    dependencies: ['business', 'brand'],
    outputKey: 'copy',
  },
  images: {
    label: 'Image Direction',
    purpose: 'Direct all visuals: hero, gallery, services, team, backgrounds, illustrations, icons — one style.',
    dependencies: ['business', 'brand', 'ui'],
    outputKey: 'images',
  },
  seo: {
    label: 'SEO',
    purpose: 'Generate meta, OpenGraph, Twitter cards, schema markup, sitemap, and recommendations.',
    dependencies: ['business', 'brand', 'ux'],
    outputKey: 'seo',
  },
  frontend: {
    label: 'Frontend Architect',
    purpose: 'Translate design into component architecture, folder structure, performance patterns.',
    dependencies: ['ui', 'ux', 'brand'],
    outputKey: 'frontend',
  },
  accessibility: {
    label: 'Accessibility',
    purpose: 'Check semantic HTML, keyboard nav, ARIA, contrast, headings, screen reader, reduced motion.',
    dependencies: ['ui', 'brand'],
    outputKey: 'accessibility',
  },
  performance: {
    label: 'Performance',
    purpose: 'Optimize images, bundles, components, loading, caching, rendering, Core Web Vitals.',
    dependencies: ['ui', 'images'],
    outputKey: 'performance',
  },
  security: {
    label: 'Security',
    purpose: 'Review authentication, API exposure, secrets, input validation, data handling, dependencies.',
    dependencies: ['frontend'],
    outputKey: 'security',
  },
  qa: {
    label: 'QA',
    purpose: 'Final review: pages, sections, links, buttons, forms, responsiveness, errors, placeholders.',
    dependencies: ['ux', 'ui', 'copy', 'seo', 'frontend', 'accessibility', 'performance', 'security'],
    outputKey: 'qa',
  },
};

// ─── Agent Outputs ──────────────────────────────────────────────────────

export interface BusinessStrategy {
  industry: string;
  audience: string[];
  problems: string[];
  products: string[];
  services: string[];
  goals: string[];
  competitors: string[];
  usp: string;
}

export interface AgentBrand {
  name: string;
  tagline: string;
  personality: string;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  typography: { heading: string; body: string };
  designDirection: string;
  logoConcept: string;
  imageStyle: string;
  toneOfVoice: string;
}

export interface UxBlueprint {
  userJourney: string[];
  hierarchy: string[];
  conversionFlow: string[];
  pages: Array<{ slug: string; title: string; purpose: string }>;
  sectionOrder: string[];
}

export interface UiDesign {
  layoutPattern: string;
  components: string[];
  grid: string;
  spacing: string;
  animationStyle: string;
  interactionPatterns: string[];
}

export interface AgentCopy {
  blocks: CopyBlock[];
}

export interface ImageDirection {
  style: string;
  hero: string[];
  gallery: string[];
  services: string[];
  team: string[];
  backgrounds: string[];
  iconStyle: string;
}

export interface AgentSeo {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string | null;
  ogType: string;
  twitterCard: string;
  schema: Array<{ type: string; data: Record<string, unknown> }>;
  sitemap: boolean;
  recommendations: string[];
}

export interface ComponentArchitecture {
  components: Array<{ name: string; purpose: string; props: string[] }>;
  folderStructure: string[];
  performancePatterns: string[];
}

export interface AgentCheck {
  rule: string;
  passed: boolean;
  message: string;
  fix?: string;
}

export interface AgentReport {
  checks: AgentCheck[];
  passed: boolean;
}

// ─── Orchestration Types ────────────────────────────────────────────────

export interface AgentResult {
  agentId: AgentId;
  status: AgentStatus;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  model: string | null;
  attempts: number;
  error: string | null;
  usedFallback: boolean;
  outputKey: string;
}

export interface ProgressUpdate {
  step: number;
  total: number;
  message: string;
}

export interface OrchestrationResult {
  success: boolean;
  context: Record<string, unknown>;
  results: AgentResult[];
  progress: ProgressUpdate[];
  durationMs: number;
  errors: string[];
}
