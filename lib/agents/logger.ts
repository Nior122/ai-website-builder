// =============================================================================
// Agent System — Logging
// =============================================================================
// Clear, structured agent logs. Never logs secrets — only agent id, status,
// duration, model, and sanitized error messages.
// =============================================================================

import { logger } from '@/lib/logger';
import type { AgentId } from './types';

const LOG = { service: 'agent-system' } as const;

export function logAgentStart(agentId: AgentId, label: string): void {
  logger.info(`[${label}] Starting...`, { ...LOG, agent: agentId });
}

export function logAgentRetry(agentId: AgentId, label: string, error: string): void {
  logger.warn(`[${label}] Attempt 1 failed — retrying. (${error})`, { ...LOG, agent: agentId });
}

export function logAgentSuccess(agentId: AgentId, label: string, durationMs: number, model: string | null): void {
  logger.info(`[${label}] ✓ Completed in ${durationMs}ms${model ? ` (model: ${model})` : ''}`, {
    ...LOG,
    agent: agentId,
    durationMs,
    model,
  });
}

export function logAgentFallback(agentId: AgentId, label: string): void {
  logger.warn(`[${label}] Using deterministic fallback output.`, { ...LOG, agent: agentId });
}

export function logAgentFailure(agentId: AgentId, label: string, error: string): void {
  logger.error(`[${label}] Failed: ${error}`, { ...LOG, agent: agentId });
}

export function logOrchestratorStart(businessType: string): void {
  logger.info(`Agent orchestrator started for "${businessType}"`, LOG);
}

export function logOrchestratorComplete(agentCount: number, durationMs: number): void {
  logger.info(`Agent orchestrator finished: ${agentCount} agent(s) in ${durationMs}ms`, {
    ...LOG,
    agentCount,
    durationMs,
  });
}
