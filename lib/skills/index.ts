// =============================================================================
// Skill System — Barrel Exports
// =============================================================================
// The skill system exposes: registry (what's installed), config (what's
// enabled), and the skill manager (runtime API for the design pipeline).
// =============================================================================

export { SKILL_REGISTRY, getSkill, listSkills, getInstalledSkills, findSkillByCapability, getSkillNames } from './registry';
export { getSkillsConfig, isSkillEnabled, enabledSkillsForStage } from './config';
export { SkillManager, getSkillManager, resetSkillManager } from './skill-manager';
export type { SkillsConfig } from './config';
export type {
  SkillStatus,
  SkillCapability,
  SkillDefinition,
  SkillHealth,
  PipelineStage,
} from './types';
export { STAGE_SKILLS } from './types';
