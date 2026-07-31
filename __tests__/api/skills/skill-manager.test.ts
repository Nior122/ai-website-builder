// =============================================================================
// Skill Manager Tests
// =============================================================================
import { describe, it, expect } from 'vitest';
import { SKILL_REGISTRY, listSkills, getSkill } from '@/lib/skills/registry';
import { getSkillsConfig } from '@/lib/skills/config';
import { SkillManager, getSkillManager, resetSkillManager } from '@/lib/skills/skill-manager';

describe('Skill Registry', () => {
  it('registers all 8 required skills', () => {
    const names = listSkills().map((skill) => skill.name);
    expect(names).toContain('frontend-design');
    expect(names).toContain('premium-web-design');
    expect(names).toContain('emil-kowalski');
    expect(names).toContain('impeccable');
    expect(names).toContain('design-taste-frontend');
    expect(names).toContain('gpt-taste');
    expect(names).toContain('copy-editing');
    expect(names).toContain('frontend-patterns');
    expect(names).toHaveLength(8);
  });

  it('every skill exposes the full metadata contract', () => {
    for (const skill of SKILL_REGISTRY) {
      expect(skill.name).toBeTruthy();
      expect(skill.version).toBeTruthy();
      expect(skill.purpose).toBeTruthy();
      expect(skill.entryPoint).toBeTruthy();
      expect(Array.isArray(skill.dependencies)).toBe(true);
      expect(Array.isArray(skill.capabilities)).toBe(true);
      expect(skill.capabilities.length).toBeGreaterThan(0);
      expect(skill.files.length).toBeGreaterThan(0);
      expect(skill.source).toBeTruthy();
    }
  });

  it('looks up skills by name', () => {
    expect(getSkill('copy-editing')?.purpose).toContain('Marketing copy');
    expect(getSkill('does-not-exist')).toBeUndefined();
  });
});

describe('Skill Config', () => {
  it('defaults to all-enabled when no env is set', () => {
    delete process.env.SKILLS_ENABLED;
    const config = getSkillsConfig();
    expect(config.allEnabled).toBe(true);
  });

  it('respects explicit enable lists', () => {
    process.env.SKILLS_ENABLED = 'frontend-design,copy-editing';
    const config = getSkillsConfig();
    expect(config.allEnabled).toBe(false);
    expect(config.enabledList).toEqual(['frontend-design', 'copy-editing']);
    delete process.env.SKILLS_ENABLED;
  });

  it('honors per-skill overrides', () => {
    process.env.SKILLS_ENABLED = 'all';
    process.env.SKILL_FRONTEND_DESIGN_ENABLED = 'false';
    const config = getSkillsConfig();
    expect(config.overrides['frontend-design']).toBe(false);
    expect(config.overrides['copy-editing']).toBeUndefined();
    delete process.env.SKILL_FRONTEND_DESIGN_ENABLED;
  });
});

describe('Skill Manager', () => {
  it('loads and enables skills from the registry', () => {
    const manager = new SkillManager();
    expect(manager.getEnabledSkills()).toHaveLength(8);
    expect(manager.isEnabled('frontend-design')).toBe(true);
  });

  it('validates entry points on disk', () => {
    const manager = new SkillManager();
    expect(manager.validate('frontend-design')).toBe(true);
    expect(manager.validate('copy-editing')).toBe(true);
  });

  it('disable/enable toggles status', () => {
    const manager = new SkillManager();
    expect(manager.disable('gpt-taste')).toBe(true);
    expect(manager.isEnabled('gpt-taste')).toBe(false);
    expect(manager.enable('gpt-taste')).toBe(true);
    expect(manager.isEnabled('gpt-taste')).toBe(true);
  });

  it('marks failures and recovers', () => {
    const manager = new SkillManager();
    manager.markFailed('emil-kowalski', 'runtime error');
    expect(manager.detectFailures()).toContain('emil-kowalski');
    const recovered = manager.recover('emil-kowalski');
    expect(recovered).toBe(true);
    expect(manager.detectFailures()).not.toContain('emil-kowalski');
  });

  it('maps pipeline stages to skills', () => {
    const manager = new SkillManager();
    expect(manager.skillsForStage('copywriting')).toContain('copy-editing');
    expect(manager.skillsForStage('visual-style')).toContain('design-taste-frontend');
    expect(manager.primarySkillForStage('polish')).toBe('impeccable');
  });

  it('returns a summary string', () => {
    const manager = new SkillManager();
    expect(manager.summary()).toContain('8 enabled');
  });

  it('provides a singleton', () => {
    resetSkillManager();
    expect(getSkillManager()).toBe(getSkillManager());
    resetSkillManager();
  });
});
