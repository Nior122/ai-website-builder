// =============================================================================
// Agent System — Barrel Exports
// =============================================================================
// Multi-agent orchestration: 12 specialized agents, shared context, retry/
// fallback handling, model management, progress tracking, admin execution
// log, and website-blueprint assembly.
// =============================================================================

export { AgentOrchestrator, toWebsiteBlueprint, type OrchestratorConfig, type OrchestratorOptions } from './orchestrator';
export { Agent, isRecord, isNonEmptyString, isNonEmptyArray } from './base';
export { ProjectContext } from './context';
export { createDefaultAgents } from './registry';
export { getAgentModelConfig, resolveAgentModel, modelChain } from './models';
export { ProgressTracker, AGENT_PROGRESS_STEPS } from './progress';
export { recordExecution, listExecutions, clearExecutions, type ExecutionRecord } from './execution-store';
export {
  AGENT_ORDER,
  AGENT_META,
  type AgentId,
  type AgentStatus,
  type AgentMeta,
  type AgentResult,
  type ProgressUpdate,
  type OrchestrationResult,
  type BusinessStrategy,
  type AgentBrand,
  type UxBlueprint,
  type UiDesign,
  type AgentCopy,
  type ImageDirection,
  type AgentSeo,
  type ComponentArchitecture,
  type AgentCheck,
  type AgentReport,
} from './types';
