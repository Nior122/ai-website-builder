// =============================================================================
// Agent System — Execution Store (Admin)
// =============================================================================
// In-memory execution log for the admin dashboard. Records each agent run:
// status, duration, model, attempts, error, fallback usage.
// Exposed via GET /api/agents/executions.
// =============================================================================

import { nanoid } from 'nanoid';
import type { AgentId, AgentStatus } from './types';

export interface ExecutionRecord {
  id: string;
  agentId: AgentId;
  status: AgentStatus;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  model: string | null;
  error: string | null;
  attempts: number;
  usedFallback: boolean;
}

const MAX_RECORDS = 200;
const EXECUTIONS: ExecutionRecord[] = [];

export function recordExecution(
  record: Omit<ExecutionRecord, 'id'>
): ExecutionRecord {
  const full: ExecutionRecord = { ...record, id: nanoid() };
  EXECUTIONS.unshift(full);
  if (EXECUTIONS.length > MAX_RECORDS) {
    EXECUTIONS.length = MAX_RECORDS;
  }
  return full;
}

export function listExecutions(limit = 50): ExecutionRecord[] {
  return EXECUTIONS.slice(0, limit);
}

export function clearExecutions(): void {
  EXECUTIONS.length = 0;
}
