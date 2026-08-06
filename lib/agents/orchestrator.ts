// =============================================================================
// Agent Orchestrator
// =============================================================================
// Central coordinator: receives the user request, creates the generation
// workflow, assigns tasks to agents, passes shared context between agents,
// tracks progress, handles failures (retry → fallback → continue), validates
// outputs, and manages dependencies.
//
// Workflow: User Prompt → Orchestrator → Specialized Agents → Website
// Blueprint → Validation → Final result.
// =============================================================================

import { logger } from '@/lib/logger';
import type { DesignBrief } from '@/lib/ai/design-pipeline';
import { isRecord, type Agent } from './base';
import { ProjectContext } from './context';
import { recordExecution } from './execution-store';
import {
  logAgentFallback,
  logAgentFailure,
  logAgentRetry,
  logAgentStart,
  logAgentSuccess,
  logOrchestratorComplete,
  logOrchestratorStart,
} from './logger';
import { createDefaultAgents } from './registry';
import { ProgressTracker } from './progress';
import type { AgentResult, AgentStatus, OrchestrationResult, ProgressUpdate } from './types';

const LOG = { service: 'agent-orchestrator' } as const;

export interface OrchestratorConfig {
  /** Retry an agent once after a first failure (default true). */
  retryOnFailure: boolean;
  /** Use the deterministic fallback output when retry fails (default true). */
  useFallback: boolean;
  /** Record executions into the admin store (default true). */
  recordExecutions: boolean;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  retryOnFailure: true,
  useFallback: true,
  recordExecutions: true,
};

export interface OrchestratorOptions {
  /** Custom agent roster (defaults to the 12-agent registry). */
  agents?: Agent[];
  config?: Partial<OrchestratorConfig>;
  onProgress?: (update: ProgressUpdate) => void;
}

export class AgentOrchestrator {
  private readonly agents: Agent[];
  private readonly config: OrchestratorConfig;
  private readonly progress: ProgressTracker;

  constructor(options: OrchestratorOptions = {}) {
    this.agents = options.agents ?? createDefaultAgents();
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.progress = new ProgressTracker(options.onProgress);
  }

  /**
   * Run the full multi-agent workflow for one business request.
   */
  async run(request: DesignBrief): Promise<OrchestrationResult> {
    const context = new ProjectContext(request);
    const startedAt = Date.now();
    const results: AgentResult[] = [];
    const errors: string[] = [];

    logOrchestratorStart(request.businessType);

    for (const agent of this.agents) {
      results.push(await this.runAgent(agent, context));
    }

    const durationMs = Date.now() - startedAt;
    const success = results.every(
      (result) => result.status === 'succeeded' || result.status === 'fallback'
    );

    for (const result of results) {
      if (result.status === 'failed') {
        errors.push(`${result.agentId}: ${result.error ?? 'unknown error'}`);
      }
    }

    logOrchestratorComplete(this.agents.length, durationMs);

    return {
      success,
      context: context.toJSON(),
      results,
      progress: this.progress.getUpdates(),
      durationMs,
      errors,
    };
  }

  // ─── Agent Execution (retry → fallback → continue) ─────────────────

  private async runAgent(agent: Agent, context: ProjectContext): Promise<AgentResult> {
    const startedAt = Date.now();
    const meta = agent.meta;
    let status: AgentStatus = 'failed';
    let error: string | null = null;
    let attempts = 0;
    let usedFallback = false;

    this.progress.start(agent.id);
    logAgentStart(agent.id, meta.label);

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      attempts = attempt;
      try {
        const output = await agent.run(context);
        if (agent.validate(output)) {
          context.set(agent.outputKey, output);
          status = 'succeeded';
          error = null;
          break;
        }
        throw new Error('agent output failed validation');
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);

        if (attempt === 1 && this.config.retryOnFailure) {
          status = 'retrying';
          logAgentRetry(agent.id, meta.label, error);
          continue;
        }

        if (this.config.useFallback) {
          status = 'fallback';
          usedFallback = true;
          context.set(agent.outputKey, agent.fallback(context));
          logAgentFailure(agent.id, meta.label, error);
          logAgentFallback(agent.id, meta.label);
          break;
        }

        status = 'failed';
        logAgentFailure(agent.id, meta.label, error);
        break;
      }
    }

    const finishedAt = Date.now();
    const result: AgentResult = {
      agentId: agent.id,
      status,
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      model: agent.model,
      attempts,
      error,
      usedFallback,
      outputKey: agent.outputKey,
    };

    if (status === 'succeeded' || status === 'fallback') {
      this.progress.complete(agent.id, status === 'fallback');
      logAgentSuccess(agent.id, meta.label, result.durationMs, result.model);
    }

    if (this.config.recordExecutions) {
      recordExecution(result);
    }

    logger.info(
      `[${meta.label}] status=${status} attempts=${attempts} duration=${result.durationMs}ms${usedFallback ? ' (fallback)' : ''}`,
      { ...LOG, agent: agent.id, status }
    );

    return result;
  }
}

// ─── Website Blueprint Assembly ─────────────────────────────────────────

/**
 * Assemble the final website blueprint from the shared agent context.
 * This is the output handed to the renderer/generation pipeline.
 */
export function toWebsiteBlueprint(result: OrchestrationResult): Record<string, unknown> {
  const ctx = result.context;

  const business = isRecord(ctx.business) ? ctx.business : {};
  const brand = isRecord(ctx.brand) ? ctx.brand : {};
  const ux = isRecord(ctx.ux) ? ctx.ux : {};
  const ui = isRecord(ctx.ui) ? ctx.ui : {};
  const copy = isRecord(ctx.copy) ? ctx.copy : {};
  const images = isRecord(ctx.images) ? ctx.images : {};
  const seo = isRecord(ctx.seo) ? ctx.seo : {};
  const frontend = isRecord(ctx.frontend) ? ctx.frontend : {};

  const validation: Record<string, unknown> = {};
  for (const key of ['accessibility', 'performance', 'security', 'qa']) {
    validation[key] = isRecord(ctx[key]) ? ctx[key] : {};
  }

  return {
    business,
    brand,
    ux,
    ui,
    copy,
    images,
    seo,
    frontend,
    validation,
    orchestration: {
      success: result.success,
      durationMs: result.durationMs,
      errors: result.errors,
      agents: result.results.map((r) => ({
        agent: r.agentId,
        status: r.status,
        durationMs: r.durationMs,
        model: r.model,
      })),
    },
  };
}
