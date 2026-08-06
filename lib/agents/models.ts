// =============================================================================
// Agent System — Model Management
// =============================================================================
// Multi-model support for agents. Everything is driven by environment
// variables — never hardcoded:
//
//   PRIMARY_MODEL=openrouter/free
//   FALLBACK_MODELS=inclusionai/ling-3.0-flash:free,cohere/north-mini-code:free
//   AGENT_AI_ENABLED=true|false        (off by default — deterministic path)
//   AGENT_TIMEOUT_MS=120000
//   AGENT_<ID>_MODEL=<model>           (per-agent override, e.g. AGENT_COPY_MODEL)
// =============================================================================

import type { AgentId } from './types';

export interface AgentModelConfig {
  primary: string;
  fallbacks: string[];
  timeoutMs: number;
  aiEnabled: boolean;
}

function env(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  return process.env[name];
}

export function getAgentModelConfig(): AgentModelConfig {
  const primary = env('PRIMARY_MODEL') || 'openrouter/free';
  const fallbacks = (env('FALLBACK_MODELS') || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const timeoutMs = parseInt(env('AGENT_TIMEOUT_MS') || '120000', 10);
  const aiEnabled = (env('AGENT_AI_ENABLED') || 'false').toLowerCase() === 'true';
  return { primary, fallbacks, timeoutMs, aiEnabled };
}

/**
 * Model for a specific agent: per-agent override → primary.
 * Agents without a model configured run on the deterministic engine.
 */
export function resolveAgentModel(agentId: AgentId): string | null {
  const key = `AGENT_${agentId.toUpperCase().replace('-', '_')}_MODEL`;
  const override = env(key);
  if (override) return override;
  return getAgentModelConfig().primary;
}

/** Full model chain: primary + fallbacks, in order. */
export function modelChain(): string[] {
  const config = getAgentModelConfig();
  return [config.primary, ...config.fallbacks];
}
