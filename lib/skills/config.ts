// =============================================================================
// Skill System — Configuration
// =============================================================================
// Skills are NEVER hardcoded as "always on". Enable/disable via environment:
//
//   SKILLS_ENABLED=all                       (default) — every installed skill on
//   SKILLS_ENABLED=frontend-design,copy-editing  — only the listed skills on
//   SKILLS_ENABLED=none                      — skill system off (degraded mode)
//   SKILL_FRONTEND_DESIGN_ENABLED=false      — per-skill override
//
// New skills can be installed without touching application code.
// =============================================================================

import { STAGE_SKILLS, type PipelineStage, type SkillDefinition } from './types';

export interface SkillsConfig {
  /** true = all installed skills enabled; false = only `enabledList`. */
  allEnabled: boolean;
  enabledList: string[];
  /** Map of skill name → explicit per-skill override. */
  overrides: Record<string, boolean>;
}

const UPPER_TO_NAME: Record<string, string> = {
  FRONTEND_DESIGN: 'frontend-design',
  PREMIUM_WEB_DESIGN: 'premium-web-design',
  EMIL_KOWALSKI: 'emil-kowalski',
  IMPECCABLE: 'impeccable',
  DESIGN_TASTE_FRONTEND: 'design-taste-frontend',
  GPT_TASTE: 'gpt-taste',
  COPY_EDITING: 'copy-editing',
  FRONTEND_PATTERNS: 'frontend-patterns',
};

function envVar(keys: string[]): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

/**
 * Read the skill configuration from environment variables.
 */
export function getSkillsConfig(): SkillsConfig {
  const raw = envVar(['SKILLS_ENABLED']) || 'all';
  const normalized = raw.trim().toLowerCase();

  let allEnabled = true;
  let enabledList: string[] = [];

  if (normalized === 'none' || normalized === 'false') {
    allEnabled = false;
    enabledList = [];
  } else if (normalized !== 'all' && normalized !== 'true' && normalized !== '') {
    allEnabled = false;
    enabledList = normalized
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }

  const overrides: Record<string, boolean> = {};
  for (const [upper, name] of Object.entries(UPPER_TO_NAME)) {
    const value = envVar([`SKILL_${upper}_ENABLED`]);
    if (value !== undefined) {
      const parsed = value.trim().toLowerCase();
      overrides[name] = parsed !== 'false' && parsed !== '0' && parsed !== 'none';
    }
  }

  return { allEnabled, enabledList, overrides };
}

/**
 * Decide whether a skill is enabled given config + registry.
 */
export function isSkillEnabled(config: SkillsConfig, skill: SkillDefinition): boolean {
  const explicit = config.overrides[skill.name];
  if (explicit !== undefined) return explicit;

  if (config.allEnabled) return true;
  return config.enabledList.includes(skill.name);
}

/**
 * List skills required by a pipeline stage that are enabled under this config.
 */
export function enabledSkillsForStage(
  config: SkillsConfig,
  stage: PipelineStage,
  registry: SkillDefinition[]
): string[] {
  const candidates = STAGE_SKILLS[stage] ?? [];
  return candidates.filter((name) => {
    const skill = registry.find((s) => s.name === name);
    return skill !== undefined && isSkillEnabled(config, skill);
  });
}
