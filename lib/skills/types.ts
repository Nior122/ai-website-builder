// =============================================================================
// Skill System — Core Types
// =============================================================================
// Shared types for the skill registry and skill manager.
// =============================================================================

export type SkillStatus = 'installed' | 'enabled' | 'disabled' | 'error' | 'recovering';

export interface SkillCapability {
  id: string;
  description: string;
}

export interface SkillDefinition {
  /** Unique skill id (kebab-case), e.g. "frontend-design". */
  name: string;
  version: string;
  /** One-paragraph purpose statement. */
  purpose: string;
  /** Path to the skill entry point (SKILL.md), repo-relative. */
  entryPoint: string;
  status: SkillStatus;
  /** Other skill names this skill depends on. */
  dependencies: string[];
  capabilities: SkillCapability[];
  /** Installed files (repo-relative). Empty = not installed. */
  files: string[];
  /** Provenance: upstream repo or "authored". */
  source: string;
}

export interface SkillHealth {
  name: string;
  status: SkillStatus;
  installed: boolean;
  validated: boolean;
  lastCheckedAt: number | null;
  lastError: string | null;
  failureCount: number;
  diagnostics: string[];
}

export type PipelineStage =
  | 'brand'
  | 'visual-style'
  | 'layout-strategy'
  | 'section-design'
  | 'component-design'
  | 'copywriting'
  | 'interaction'
  | 'polish'
  | 'validation';

/** Map a design-pipeline stage to the skills that power it. */
export const STAGE_SKILLS: Record<PipelineStage, string[]> = {
  brand: ['gpt-taste', 'copy-editing'],
  'visual-style': ['design-taste-frontend'],
  'layout-strategy': ['premium-web-design', 'frontend-design'],
  'section-design': ['premium-web-design'],
  'component-design': ['frontend-patterns'],
  copywriting: ['copy-editing'],
  interaction: ['emil-kowalski'],
  polish: ['impeccable'],
  validation: ['frontend-patterns', 'impeccable'],
};
