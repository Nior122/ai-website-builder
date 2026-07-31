// =============================================================================
// Skill Registry
// =============================================================================
// Central registry of every skill installed in the project. The application
// (skill manager, design pipeline) consults this registry to learn which
// skills exist, what they do, and whether they are installed.
//
// The `files` arrays mirror the on-disk `skills/<name>/` folders. The registry
// is the single source of truth for skill metadata.
// =============================================================================

import type { SkillDefinition } from './types';

export const SKILL_REGISTRY: SkillDefinition[] = [
  {
    name: 'frontend-design',
    version: '1.0.0',
    purpose:
      'Professional frontend layouts: modern spacing, grid systems, visual hierarchy, and responsive composition.',
    entryPoint: 'skills/frontend-design/SKILL.md',
    status: 'installed',
    dependencies: [],
    capabilities: [
      { id: 'layouts', description: 'Modern, professional layout composition' },
      { id: 'grid-systems', description: 'Grid-based responsive structures' },
      { id: 'visual-hierarchy', description: 'Hierarchy and emphasis guidance' },
      { id: 'responsive-composition', description: 'Desktop/tablet/mobile composition' },
    ],
    files: ['skills/frontend-design/SKILL.md', 'skills/frontend-design/LICENSE.txt'],
    source: 'https://github.com/anthropics/skills (skills/frontend-design)',
  },
  {
    name: 'premium-web-design',
    version: '1.0.0',
    purpose:
      'Premium UI patterns, modern landing pages, hero layouts, premium SaaS design, and visual polish.',
    entryPoint: 'skills/premium-web-design/SKILL.md',
    status: 'installed',
    dependencies: ['frontend-design'],
    capabilities: [
      { id: 'premium-patterns', description: 'Premium hero / pricing / social-proof patterns' },
      { id: 'landing-pages', description: 'High-conversion landing page structure' },
      { id: 'visual-polish', description: 'Elevation, depth, and refinement guidance' },
    ],
    files: [
      'skills/premium-web-design/SKILL.md',
      'skills/premium-web-design/references/landing-page-patterns.md',
    ],
    source: 'authored (no canonical upstream repository)',
  },
  {
    name: 'emil-kowalski',
    version: '1.0.0',
    purpose:
      'Modern interaction design, component architecture, beautiful layouts, and animation inspiration.',
    entryPoint: 'skills/emil-kowalski/SKILL.md',
    status: 'installed',
    dependencies: [],
    capabilities: [
      { id: 'interaction-design', description: 'Modern interaction and motion design' },
      { id: 'animation-vocabulary', description: 'Shared vocabulary for animation decisions' },
      { id: 'component-architecture', description: 'Component structure guidance' },
    ],
    files: [
      'skills/emil-kowalski/SKILL.md',
      'skills/emil-kowalski/references/animation-vocabulary.md',
    ],
    source: 'https://github.com/adefemi-dev/Emil-Kowalski (skills/emil-design-eng)',
  },
  {
    name: 'impeccable',
    version: '1.0.0',
    purpose:
      'Modern CSS, spacing systems, typography, component consistency, and layout refinement.',
    entryPoint: 'skills/impeccable/SKILL.md',
    status: 'installed',
    dependencies: ['frontend-design'],
    capabilities: [
      { id: 'css-systems', description: 'Modern CSS and design-token systems' },
      { id: 'spacing-systems', description: 'Consistent spacing scales' },
      { id: 'typography', description: 'Typographic refinement and rhythm' },
      { id: 'consistency', description: 'Cross-section component consistency' },
      { id: 'craft', description: 'Detail-level craft and polish checks' },
      { id: 'critique', description: 'Structured design critique methodology' },
    ],
    files: [
      'skills/impeccable/SKILL.md',
      'skills/impeccable/agents/impeccable_asset_producer.toml',
      'skills/impeccable/agents/impeccable_documenter.toml',
      'skills/impeccable/agents/impeccable_finish_reviewer.toml',
      'skills/impeccable/agents/impeccable_manual_edit_applier.toml',
      'skills/impeccable/reference/craft.md',
      'skills/impeccable/reference/critique.md',
      'skills/impeccable/reference/adapt.md',
      'skills/impeccable/reference/colorize.md',
      'skills/impeccable/reference/distill.md',
      'skills/impeccable/reference/typographize.md',
      'skills/impeccable/reference/audit.md',
      'skills/impeccable/reference/animate.md',
      'skills/impeccable/reference/delight.md',
      'skills/impeccable/reference/doctor.md',
      'skills/impeccable/reference/harden.md',
      'skills/impeccable/reference/hooks.md',
      'skills/impeccable/reference/document.md',
      'skills/impeccable/reference/extract.md',
      'skills/impeccable/reference/init.md',
      'skills/impeccable/reference/plan.md',
      'skills/impeccable/reference/research.md',
      'skills/impeccable/reference/spec.md',
      'skills/impeccable/reference/struct.md',
    ],
    source: 'https://github.com/pbakaus/impeccable (.agents/skills/impeccable)',
  },
  {
    name: 'design-taste-frontend',
    version: '1.0.0',
    purpose:
      'Professional visual taste: color harmony, typography, visual rhythm, spacing, and design consistency.',
    entryPoint: 'skills/design-taste-frontend/SKILL.md',
    status: 'installed',
    dependencies: [],
    capabilities: [
      { id: 'visual-taste', description: 'High-level visual taste and judgement' },
      { id: 'color-harmony', description: 'Palette construction and harmony' },
      { id: 'typography', description: 'Type pairing and rhythm' },
      { id: 'visual-rhythm', description: 'Rhythm and consistency across sections' },
    ],
    files: ['skills/design-taste-frontend/SKILL.md'],
    source: 'https://github.com/lazylizardai/skill-design-taste-frontend',
  },
  {
    name: 'gpt-taste',
    version: '1.0.0',
    purpose:
      'Professional UI/UX judgement, design critiques, hierarchy, composition, and visual refinement.',
    entryPoint: 'skills/gpt-taste/SKILL.md',
    status: 'installed',
    dependencies: [],
    capabilities: [
      { id: 'ux-judgement', description: 'UI/UX judgement and critique' },
      { id: 'hierarchy', description: 'Visual hierarchy evaluation' },
      { id: 'composition', description: 'Composition and layout critique' },
      { id: 'refinement', description: 'Iterative visual refinement guidance' },
    ],
    files: ['skills/gpt-taste/SKILL.md'],
    source: 'https://github.com/evgyur/gpt-taste',
  },
  {
    name: 'copy-editing',
    version: '1.0.0',
    purpose:
      'Marketing copy: landing page writing, CTA optimization, headline improvement, and benefit-driven content.',
    entryPoint: 'skills/copy-editing/SKILL.md',
    status: 'installed',
    dependencies: [],
    capabilities: [
      { id: 'marketing-copy', description: 'Benefit-driven marketing copy' },
      { id: 'headlines', description: 'Headline and subheadline writing' },
      { id: 'ctas', description: 'Call-to-action optimization' },
      { id: 'plain-english', description: 'Plain-English rewrites of weak copy' },
    ],
    files: [
      'skills/copy-editing/SKILL.md',
      'skills/copy-editing/references/plain-english-alternatives.md',
    ],
    source: 'https://github.com/diuzhev26-glitch/copy-editing',
  },
  {
    name: 'frontend-patterns',
    version: '1.0.0',
    purpose:
      'Performance, reusable components, frontend architecture, accessibility, and modern coding patterns.',
    entryPoint: 'skills/frontend-patterns/SKILL.md',
    status: 'installed',
    dependencies: ['frontend-design'],
    capabilities: [
      { id: 'performance', description: 'Performance budgets and optimization' },
      { id: 'a11y', description: 'WCAG AA accessibility patterns' },
      { id: 'components', description: 'Reusable component architecture' },
      { id: 'semantic-html', description: 'Semantic markup guidance' },
    ],
    files: [
      'skills/frontend-patterns/SKILL.md',
      'skills/frontend-patterns/references/patterns.md',
    ],
    source: 'authored (synthesis of established frontend best practices)',
  },
];

// ─── Registry Helpers ───────────────────────────────────────────────────

export function getSkill(name: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find((skill) => skill.name === name);
}

export function listSkills(): SkillDefinition[] {
  return [...SKILL_REGISTRY];
}

export function getInstalledSkills(): SkillDefinition[] {
  return SKILL_REGISTRY.filter((skill) => skill.files.length > 0);
}

export function findSkillByCapability(capabilityId: string): SkillDefinition[] {
  return SKILL_REGISTRY.filter((skill) =>
    skill.capabilities.some((cap) => cap.id === capabilityId)
  );
}

export function getSkillNames(): string[] {
  return SKILL_REGISTRY.map((skill) => skill.name);
}
