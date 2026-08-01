// =============================================================================
// Agent Orchestrator Tests
// =============================================================================
// Covers: full 12-agent workflow, shared context, retry, fallback recovery,
// model management, progress tracking, admin execution store, website
// blueprint assembly, and the multi-industry differentiation acceptance test.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { toDesignBrief } from '@/lib/ai/design-pipeline';
import {
  Agent,
  AgentOrchestrator,
  createDefaultAgents,
  getAgentModelConfig,
  modelChain,
  resolveAgentModel,
  toWebsiteBlueprint,
  recordExecution,
  listExecutions,
  clearExecutions,
  AGENT_ORDER,
  type AgentId,
  type ProjectContext,
} from '@/lib/agents';

// ─── Fixtures ───────────────────────────────────────────────────────────

function briefFor(type: string) {
  return toDesignBrief({
    description: `A ${type.toLowerCase()} business serving local customers with quality service.`,
    industry: type,
    businessType: type,
    tone: 'professional',
  });
}

class FlakyAgent extends Agent {
  readonly id: AgentId = 'business';
  readonly outputKey = 'business';
  private calls = 0;

  async run(context: ProjectContext) {
    this.calls += 1;
    if (this.calls === 1) throw new Error('transient failure on first attempt');
    return {
      industry: 'Test',
      audience: ['a'],
      problems: ['p'],
      products: ['x'],
      services: ['s'],
      goals: ['g'],
      competitors: ['c'],
      usp: 'u',
    };
  }

  validate(): boolean {
    return true;
  }

  fallback(): unknown {
    return { industry: 'Test', audience: [], problems: [], products: [], services: [], goals: [], competitors: [], usp: 'f' };
  }
}

class AlwaysFailAgent extends Agent {
  readonly id: AgentId = 'ux';
  readonly outputKey = 'ux';

  async run(): Promise<unknown> {
    throw new Error('always fails');
  }

  validate(): boolean {
    return true;
  }

  fallback(): unknown {
    return {
      pages: [{ slug: 'home', title: 'Home', purpose: '' }],
      sectionOrder: ['hero'],
      userJourney: ['Discover'],
      hierarchy: ['Value'],
      conversionFlow: ['Action'],
    };
  }
}

function withReplacement(original: Agent[], replacement: Agent): Agent[] {
  return original.map((agent) => (agent.id === replacement.id ? replacement : agent));
}

// ─── Orchestrator ───────────────────────────────────────────────────────

describe('Agent Orchestrator', () => {
  it('runs all 12 agents in dependency order with a shared context', async () => {
    const orchestrator = new AgentOrchestrator();
    const result = await orchestrator.run(briefFor('Restaurant'));

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.results).toHaveLength(12);
    expect(result.results.map((r) => r.agentId)).toEqual(AGENT_ORDER);
    expect(result.results.every((r) => r.status === 'succeeded')).toBe(true);

    for (const key of ['business', 'brand', 'ux', 'ui', 'copy', 'images', 'seo', 'frontend', 'accessibility', 'performance', 'security', 'qa']) {
      expect(result.context[key]).toBeDefined();
    }
  });

  it('shares outputs between agents (copy sees brand + business)', async () => {
    const result = await new AgentOrchestrator().run(briefFor('SaaS'));
    const copy = result.context.copy as { blocks: Array<{ key: string; text: string }> };
    expect(copy.blocks.length).toBeGreaterThan(5);
    const brand = result.context.brand as { name: string };
    expect(brand.name).toBeTruthy();
  });

  it('retries a failing agent once, then succeeds', async () => {
    const agents = withReplacement(createDefaultAgents(), new FlakyAgent());
    const result = await new AgentOrchestrator({ agents }).run(briefFor('Agency'));
    const businessResult = result.results.find((r) => r.agentId === 'business');
    expect(businessResult?.status).toBe('succeeded');
    expect(businessResult?.attempts).toBe(2);
    expect(result.success).toBe(true);
  });

  it('falls back and continues when an agent always fails', async () => {
    const agents = withReplacement(createDefaultAgents(), new AlwaysFailAgent());
    const result = await new AgentOrchestrator({ agents }).run(briefFor('School'));
    const uxResult = result.results.find((r) => r.agentId === 'ux');
    expect(uxResult?.status).toBe('fallback');
    expect(uxResult?.usedFallback).toBe(true);
    // Workflow continues — later agents still succeeded.
    expect(result.success).toBe(true);
    expect(result.context.ux).toBeDefined();
  });

  it('emits human-readable progress checkpoints', async () => {
    const updates: string[] = [];
    const orchestrator = new AgentOrchestrator({
      onProgress: (update) => updates.push(update.message),
    });
    await orchestrator.run(briefFor('Fitness'));
    expect(updates).toContain('Understanding business...');
    expect(updates).toContain('✓ Understanding business');
    expect(updates).toContain('✓ Running quality checks');
  });

  it('produces different websites for different industries', async () => {
    const industries = ['Restaurant', 'SaaS', 'School', 'Hospital', 'Portfolio', 'Real Estate', 'Beauty Salon', 'Construction', 'Fitness', 'E-commerce'];
    const designLanguages = new Set<string>();
    for (const industry of industries) {
      const result = await new AgentOrchestrator().run(briefFor(industry));
      const brand = result.context.brand as { designDirection: string };
      designLanguages.add(brand.designDirection);
    }
    // At least 8 distinct design languages across the 10 industries
    // (Portfolio + E-commerce share the modern-saas fallback by design).
    expect(designLanguages.size).toBeGreaterThanOrEqual(8);
  });

  it('assembles a complete website blueprint', async () => {
    const result = await new AgentOrchestrator().run(briefFor('Law Firm'));
    const blueprint = toWebsiteBlueprint(result);
    expect(blueprint.business).toBeDefined();
    expect(blueprint.brand).toBeDefined();
    expect(blueprint.ux).toBeDefined();
    expect(blueprint.ui).toBeDefined();
    expect(blueprint.copy).toBeDefined();
    expect(blueprint.images).toBeDefined();
    expect(blueprint.seo).toBeDefined();
    expect(blueprint.frontend).toBeDefined();
    expect(blueprint.validation).toBeDefined();
    expect(blueprint.orchestration).toBeDefined();
  });
});

// ─── Model Management ───────────────────────────────────────────────────

describe('Agent Model Management', () => {
  it('reads primary + fallback models from env, never hardcoded', () => {
    process.env.PRIMARY_MODEL = 'openrouter/free';
    process.env.FALLBACK_MODELS = 'inclusionai/ling-3.0-flash:free,cohere/north-mini-code:free';
    const config = getAgentModelConfig();
    expect(config.primary).toBe('openrouter/free');
    expect(config.fallbacks).toEqual(['inclusionai/ling-3.0-flash:free', 'cohere/north-mini-code:free']);
    expect(modelChain()).toEqual(['openrouter/free', 'inclusionai/ling-3.0-flash:free', 'cohere/north-mini-code:free']);
    delete process.env.PRIMARY_MODEL;
    delete process.env.FALLBACK_MODELS;
  });

  it('honors per-agent model overrides', () => {
    process.env.AGENT_COPY_MODEL = 'custom/copy-model';
    expect(resolveAgentModel('copy')).toBe('custom/copy-model');
    delete process.env.AGENT_COPY_MODEL;
  });

  it('defaults to openrouter/free without env', () => {
    delete process.env.PRIMARY_MODEL;
    delete process.env.FALLBACK_MODELS;
    expect(getAgentModelConfig().primary).toBe('openrouter/free');
  });
});

// ─── Admin Execution Store ──────────────────────────────────────────────

describe('Agent Execution Store', () => {
  it('records and lists executions', () => {
    clearExecutions();
    recordExecution({
      agentId: 'brand',
      status: 'succeeded',
      startedAt: 1,
      finishedAt: 10,
      durationMs: 9,
      model: 'openrouter/free',
      error: null,
      attempts: 1,
      usedFallback: false,
    });
    const executions = listExecutions();
    expect(executions).toHaveLength(1);
    expect(executions[0].agentId).toBe('brand');
    expect(executions[0].status).toBe('succeeded');
    expect(executions[0].model).toBe('openrouter/free');
    clearExecutions();
  });
});
