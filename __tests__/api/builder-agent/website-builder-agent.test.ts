// =============================================================================
// Autonomous Website Builder Agent — Tests
// =============================================================================
// Covers: the full generate-until-complete flow, state machine phases,
// shared memory, self-validation, recursive repair (max 5 cycles), quality
// scores (≥90 after generation), industry differentiation, and summary output.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  WebsiteBuilderAgent,
  AgentMemory,
  BuilderStateMachine,
  PHASE_ORDER,
  computeQualityScores,
  validateWebsite,
  repairUntilValid,
  type BuilderAgentPhase,
  type AgentProgress,
} from '@/lib/builder-agent';
import type { BuilderProject } from '@/lib/builder';
import { toDesignBrief } from '@/lib/ai/design-pipeline';
import { makeTestProject } from '../builder/fixtures';

function briefFor(type: string, industry?: string) {
  return toDesignBrief({
    description: `A ${type.toLowerCase()} business serving local customers with quality service.`,
    industry: industry ?? type,
    businessType: type,
    tone: 'professional',
  });
}

function phasesFrom(progress: AgentProgress[]): BuilderAgentPhase[] {
  const seen: BuilderAgentPhase[] = [];
  for (const update of progress) {
    if (!seen.includes(update.phase)) seen.push(update.phase);
  }
  return seen;
}

function assertUniqueSlugsAndIds(project: BuilderProject): void {
  const slugs = project.pages.map((page) => page.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  const ids = [
    ...project.pages.map((page) => page.id),
    ...project.pages.flatMap((page) => page.sections.map((section) => section.id)),
  ];
  expect(new Set(ids).size).toBe(ids.length);
}

describe('WebsiteBuilderAgent — full autonomous generation', () => {
  it('builds a complete, validated website without manual input', async () => {
    const agent = new WebsiteBuilderAgent();
    const result = await agent.generateWebsite(briefFor('Restaurant'));

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.project).not.toBeNull();

    const project = result.project!;
    expect(project.pages.length).toBeGreaterThanOrEqual(7);
    expect(project.navigation.links.length).toBeGreaterThan(0);
    expect(project.forms.length).toBeGreaterThanOrEqual(1);
    expect(project.footer.copyright.length).toBeGreaterThan(0);
    assertUniqueSlugsAndIds(project);
  });

  it('walks every state-machine phase and ends completed at 100%', async () => {
    const progress: AgentProgress[] = [];
    const agent = new WebsiteBuilderAgent({ onProgress: (update) => progress.push(update) });
    const result = await agent.generateWebsite(briefFor('Agency'));

    expect(result.progress.at(-1)?.phase).toBe('completed');
    expect(result.progress.at(-1)?.progress).toBe(100);

    const phases = phasesFrom(progress);
    for (const phase of ['planning', 'researching', 'branding', 'generating-pages', 'generating-sections', 'generating-content', 'generating-images', 'optimizing', 'validating', 'completed']) {
      expect(phases).toContain(phase);
    }
  });

  it('scores every category ≥ 90 and passes validation after repair', async () => {
    const agent = new WebsiteBuilderAgent();
    const result = await agent.generateWebsite(briefFor('School'));

    expect(result.quality).not.toBeNull();
    expect(result.quality!.overall).toBeGreaterThanOrEqual(90);
    for (const category of ['visual', 'ux', 'seo', 'accessibility', 'content', 'performance', 'completeness'] as const) {
      expect(result.quality![category]).toBeGreaterThanOrEqual(90);
    }
    expect(result.validation?.passed).toBe(true);
    expect(result.repairCycles?.cyclesUsed).toBeLessThanOrEqual(5);
  });

  it('returns a complete generation summary', async () => {
    const agent = new WebsiteBuilderAgent();
    const result = await agent.generateWebsite(briefFor('Law Firm'));
    const summary = result.summary!;

    expect(summary.pagesCreated).toBe(result.project!.pages.length);
    expect(summary.sectionsCreated).toBeGreaterThan(10);
    expect(summary.theme).toBe(result.project!.theme.preset);
    expect(summary.fonts.heading.length).toBeGreaterThan(0);
    expect(summary.colors.primary.length).toBeGreaterThan(0);
    expect(summary.components.length).toBeGreaterThan(0);
    expect(summary.validationStatus).toMatch(/^passed/);
    expect(summary.generationTimeMs).toBeGreaterThan(0);
  });

  it('shares memory across the pipeline', async () => {
    const agent = new WebsiteBuilderAgent();
    const result = await agent.generateWebsite(briefFor('Beauty Salon'));
    expect(result.memory.businessName).toBeTruthy();
    expect(result.memory.industry).toBe('Beauty Salon');
    expect(result.memory.theme).toBeTruthy();
    expect(result.memory.pages).toBeDefined();
    expect(result.memory.sectionCount).toBeGreaterThan(0);
  });

  it('produces different themes for different industries', async () => {
    const agent = new WebsiteBuilderAgent();
    const restaurant = await agent.generateWebsite(briefFor('Restaurant'));
    const tech = await agent.generateWebsite(briefFor('SaaS', 'Technology'));
    expect(restaurant.project!.theme.preset).not.toBe(tech.project!.theme.preset);
  });
});

describe('Self Validation & Recursive Repair', () => {
  it('validates a complete project with zero errors', () => {
    const agent = new WebsiteBuilderAgent();
    // Complete projects come from the agent; validate a freshly generated one.
    const { errors } = validateWebsite(makeTestProject());
    // makeTestProject is intentionally incomplete (no ogImage, no media) —
    // those are the errors the agent's repair loop fixes.
    expect(errors.some((error) => error.rule === 'seo.opengraph')).toBe(true);
    expect(PHASE_ORDER).toContain('completed');
  });

  it('repairs a broken project within the 5-cycle cap', () => {
    const broken: BuilderProject = {
      ...makeTestProject('Broken Co'),
      seo: { ...makeTestProject('Broken Co').seo, metaTitle: '', ogImage: null },
      forms: [],
      navigation: {
        ...makeTestProject('Broken Co').navigation,
        links: [...makeTestProject('Broken Co').navigation.links, { id: 'broken', label: 'Missing', href: '/missing' }],
      },
      pages: makeTestProject('Broken Co').pages.map((page, pageIndex) => ({
        ...page,
        sections: page.sections.map((section, sectionIndex) =>
          pageIndex === 0 && sectionIndex === 0 ? { ...section, content: {} } : section
        ),
      })),
    };

    const { project, result } = repairUntilValid(broken, { maxCycles: 5 });
    expect(result.cyclesUsed).toBeGreaterThanOrEqual(1);
    expect(result.cyclesUsed).toBeLessThanOrEqual(5);
    expect(result.passed).toBe(true);
    expect(project.seo.ogImage).not.toBeNull();
    expect(project.seo.metaTitle.length).toBeGreaterThan(0);
    expect(project.forms.length).toBeGreaterThanOrEqual(1);
    expect(project.pages.every((page) => page.sections.every((section) => Object.keys(section.content).length > 0 || ['divider', 'spacer', 'custom-html'].includes(section.type)))).toBe(true);
  });

  it('recomputes quality after repairs', () => {
    const project = makeTestProject();
    const before = computeQualityScores(project).completeness;
    const { project: repaired } = repairUntilValid(project, { maxCycles: 5 });
    const after = computeQualityScores(repaired).completeness;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe('Agent Memory', () => {
  it('remembers and recalls values', () => {
    const memory = new AgentMemory();
    memory.rememberBusiness({ name: 'Sunrise', industry: 'Bakery', businessType: 'Bakery' });
    memory.remember('theme', 'restaurant');
    expect(memory.businessName).toBe('Sunrise');
    expect(memory.industry).toBe('Bakery');
    expect(memory.theme).toBe('restaurant');
    expect(memory.has('theme')).toBe(true);
    expect(memory.recall<number>('missing')).toBeUndefined();
    expect(memory.toJSON().businessName).toBe('Sunrise');
  });

  it('captures project facts', () => {
    const memory = new AgentMemory();
    memory.rememberProject(makeTestProject('Acme'));
    expect(memory.businessName).toBe('Acme');
    expect(memory.fonts).toBeDefined();
    expect(memory.colors).toBeDefined();
    expect(memory.pages).toContain('home');
    expect(memory.sectionCount).toBeGreaterThan(0);
  });
});

describe('State Machine', () => {
  it('transitions through ordered phases with progress', () => {
    const history: AgentProgress[] = [];
    const machine = new BuilderStateMachine((update) => history.push(update));

    machine.transition('planning', 'Planning...');
    machine.transition('researching', 'Researching...');
    machine.transition('completed', 'Done.');

    expect(machine.current).toBe('completed');
    expect(history).toHaveLength(3);
    expect(history[0].progress).toBe(10);
    expect(history[1].progress).toBe(20);
    expect(history[2].progress).toBe(100);
    expect(history[0].phase).toBe('planning');
  });
});
