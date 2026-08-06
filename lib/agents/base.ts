// =============================================================================
// Agent System — Base Agent
// =============================================================================
// Every agent implements: run (produce output from shared context),
// validate (guard the output contract), fallback (deterministic recovery
// output). The orchestrator owns retry + fallback policy.
// =============================================================================

import { AGENT_META, type AgentId, type AgentMeta } from './types';
import type { ProjectContext } from './context';
import { resolveAgentModel } from './models';

export abstract class Agent {
  abstract readonly id: AgentId;

  /** Context key the agent writes its output to. */
  abstract readonly outputKey: string;

  /** Produce the agent's output from the shared context. May throw. */
  abstract run(context: ProjectContext): Promise<unknown> | unknown;

  /** Validate the produced output against the agent's output contract. */
  abstract validate(output: unknown): boolean;

  /** Deterministic recovery output when run+retry both fail. */
  abstract fallback(context: ProjectContext): unknown;

  get meta(): AgentMeta {
    return AGENT_META[this.id];
  }

  /** Model resolved for this agent (per-agent override → primary). */
  get model(): string | null {
    return resolveAgentModel(this.id);
  }
}

// ─── Shared Validation Helpers ──────────────────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}
