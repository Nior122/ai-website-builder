// =============================================================================
// Skill Manager
// =============================================================================
// Loads, registers, validates, enables/disables skills, detects failures,
// recovers failed skills, and logs diagnostics.
//
// The manager is the application-facing API for the skill system. The design
// pipeline asks the manager "which skills are available and enabled for stage
// X?" and receives skill names + metadata to drive generation behavior.
// =============================================================================

import { existsSync } from 'fs';
import { resolve } from 'path';
import { logger } from '@/lib/logger';
import { getSkillsConfig, isSkillEnabled, enabledSkillsForStage, type SkillsConfig } from './config';
import { getSkill, listSkills } from './registry';
import { STAGE_SKILLS, type PipelineStage, type SkillDefinition, type SkillHealth } from './types';

const LOG = { service: 'skill-manager' } as const;

export interface SkillManagerOptions {
  /** Explicit config override (defaults to env-driven config). */
  config?: SkillsConfig;
  /** Root directory for validating skill entry points (defaults to cwd). */
  rootDir?: string;
}

export class SkillManager {
  private readonly config: SkillsConfig;
  private readonly rootDir: string;
  private health: Map<string, SkillHealth> = new Map();

  constructor(options: SkillManagerOptions = {}) {
    this.config = options.config ?? getSkillsConfig();
    this.rootDir = options.rootDir ?? process.cwd();
    this.load();
  }

  // ─── Load / Register ─────────────────────────────────────────────────

  /** Register all skills from the registry and initialize health state. */
  load(): number {
    let count = 0;
    for (const skill of listSkills()) {
      this.register(skill);
      count += 1;
    }
    logger.info(`Skill manager loaded ${count} skill(s) from registry`, LOG);
    return count;
  }

  /** Register a single skill (idempotent). */
  register(skill: SkillDefinition): void {
    const enabled = isSkillEnabled(this.config, skill);
    this.health.set(skill.name, {
      name: skill.name,
      status: enabled ? 'enabled' : 'disabled',
      installed: skill.files.length > 0,
      validated: false,
      lastCheckedAt: null,
      lastError: null,
      failureCount: 0,
      diagnostics: [`Registered v${skill.version}`],
    });
  }

  // ─── Validation ─────────────────────────────────────────────────────

  /** Validate that a skill's entry point exists on disk. */
  validate(name: string): boolean {
    const skill = getSkill(name);
    const health = this.health.get(name);
    if (!skill) {
      logger.warn(`Skill validation: unknown skill "${name}"`, LOG);
      return false;
    }
    if (!health) {
      this.register(skill);
    }

    try {
      const entryPath = resolve(this.rootDir, skill.entryPoint);
      const valid = existsSync(entryPath);
      const current = this.health.get(name)!;
      current.validated = true;
      current.lastCheckedAt = Date.now();
      current.lastError = valid ? null : `Entry point missing: ${skill.entryPoint}`;
      current.diagnostics.push(valid ? 'Entry point found' : 'Entry point MISSING');
      if (!valid) {
        current.failureCount += 1;
        current.status = 'error';
      }
      return valid;
    } catch (err) {
      const current = this.health.get(name)!;
      current.validated = false;
      current.lastError = err instanceof Error ? err.message : String(err);
      current.failureCount += 1;
      current.status = 'error';
      logger.error(`Skill validation failed for "${name}"`, {
        ...LOG,
        skill: name,
        error: current.lastError,
      });
      return false;
    }
  }

  /** Validate every registered skill; returns names that failed. */
  validateAll(): string[] {
    const failed: string[] = [];
    for (const skill of listSkills()) {
      if (!this.validate(skill.name)) failed.push(skill.name);
    }
    return failed;
  }

  // ─── Enable / Disable ───────────────────────────────────────────────

  enable(name: string): boolean {
    const skill = getSkill(name);
    if (!skill) return false;
    const health = this.health.get(name);
    if (health) {
      health.status = 'enabled';
      health.lastError = null;
      health.diagnostics.push('Enabled');
    }
    return true;
  }

  disable(name: string): boolean {
    const skill = getSkill(name);
    if (!skill) return false;
    const health = this.health.get(name);
    if (health) {
      health.status = 'disabled';
      health.diagnostics.push('Disabled');
    }
    return true;
  }

  isEnabled(name: string): boolean {
    const health = this.health.get(name);
    if (!health) return false;
    return health.status === 'enabled' || health.status === 'recovering';
  }

  // ─── Failure Detection & Recovery ───────────────────────────────────

  /** Mark a skill as failed (e.g., runtime error during a pipeline stage). */
  markFailed(name: string, reason: string): void {
    const health = this.health.get(name);
    if (health) {
      health.status = 'error';
      health.lastError = reason;
      health.failureCount += 1;
      health.diagnostics.push(`Failed: ${reason}`);
      logger.error(`Skill "${name}" marked failed: ${reason}`, { ...LOG, skill: name });
    }
  }

  /** Attempt to recover a failed skill: re-validate and re-enable. */
  recover(name: string): boolean {
    const health = this.health.get(name);
    if (!health || health.status !== 'error') return true;

    health.status = 'recovering';
    health.diagnostics.push('Recovery attempt started');

    const valid = this.validate(name);
    if (valid) {
      health.status = 'enabled';
      health.lastError = null;
      health.diagnostics.push('Recovery successful');
      logger.info(`Skill "${name}" recovered`, { ...LOG, skill: name });
      return true;
    }

    health.status = 'error';
    health.diagnostics.push('Recovery FAILED — entry point still missing');
    return false;
  }

  /** Detect and recover all failed skills. Returns recovered names. */
  recoverAll(): string[] {
    const recovered: string[] = [];
    for (const [name, health] of this.health.entries()) {
      if (health.status === 'error' && this.recover(name)) recovered.push(name);
    }
    return recovered;
  }

  detectFailures(): string[] {
    const failed: string[] = [];
    for (const [name, health] of this.health.entries()) {
      if (health.status === 'error') failed.push(name);
    }
    return failed;
  }

  // ─── Queries ────────────────────────────────────────────────────────

  getHealth(name?: string): SkillHealth[] {
    if (name) {
      const health = this.health.get(name);
      return health ? [health] : [];
    }
    return Array.from(this.health.values());
  }

  getEnabledSkills(): SkillDefinition[] {
    return listSkills().filter((skill) => this.isEnabled(skill.name));
  }

  /** Skills available (and enabled) for a pipeline stage. */
  skillsForStage(stage: PipelineStage): string[] {
    return enabledSkillsForStage(this.config, stage, listSkills());
  }

  /** Primary skill for a stage (first enabled candidate). */
  primarySkillForStage(stage: PipelineStage): string | null {
    const candidates = STAGE_SKILLS[stage] ?? [];
    for (const name of candidates) {
      if (this.isEnabled(name)) return name;
    }
    return null;
  }

  getConfig(): SkillsConfig {
    return { ...this.config, enabledList: [...this.config.enabledList], overrides: { ...this.config.overrides } };
  }

  // ─── Diagnostics ────────────────────────────────────────────────────

  summary(): string {
    const all = this.getHealth();
    const enabled = all.filter((h) => h.status === 'enabled').length;
    const disabled = all.filter((h) => h.status === 'disabled').length;
    const failed = all.filter((h) => h.status === 'error').length;
    return `Skill manager: ${enabled} enabled, ${disabled} disabled, ${failed} failed (${all.length} total)`;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────

let _skillManager: SkillManager | null = null;

export function getSkillManager(): SkillManager {
  if (!_skillManager) {
    _skillManager = new SkillManager();
  }
  return _skillManager;
}

export function resetSkillManager(): void {
  _skillManager = null;
}
