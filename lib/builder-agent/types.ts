// =============================================================================
// Autonomous Website Builder Agent — Core Types
// =============================================================================
// The agent's state machine phases, quality scores, validation findings, and
// the generation summary it returns when the website is COMPLETE.
// =============================================================================

export type BuilderAgentPhase =
  | 'idle'
  | 'planning'
  | 'researching'
  | 'branding'
  | 'generating-pages'
  | 'generating-sections'
  | 'generating-content'
  | 'generating-images'
  | 'optimizing'
  | 'validating'
  | 'completed'
  | 'failed';

export interface AgentProgress {
  phase: BuilderAgentPhase;
  message: string;
  progress: number;
}

export type ScoreCategory = 'visual' | 'ux' | 'seo' | 'accessibility' | 'content' | 'performance' | 'completeness';

export interface QualityScores {
  overall: number;
  visual: number;
  ux: number;
  seo: number;
  accessibility: number;
  content: number;
  performance: number;
  completeness: number;
}

export type FindingCategory =
  | 'pages'
  | 'sections'
  | 'content'
  | 'links'
  | 'seo'
  | 'theme'
  | 'forms'
  | 'media'
  | 'metadata';

export interface ValidationFinding {
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning';
  category: FindingCategory;
}

export interface GenerationSummary {
  pagesCreated: number;
  sectionsCreated: number;
  theme: string;
  fonts: { heading: string; body: string };
  colors: { primary: string; secondary: string; accent: string };
  components: string[];
  images: number;
  animations: string;
  seoScore: number;
  accessibilityScore: number;
  performanceScore: number;
  validationStatus: 'passed' | 'passed-with-repairs';
  repairCount: number;
  generationTimeMs: number;
  quality: QualityScores;
}
