// =============================================================================
// Autonomous Website Builder Agent — Barrel Exports
// =============================================================================
// The agent that keeps working until the entire website is complete:
// state machine, shared memory, self-validation, recursive repair, quality
// scoring, and the WebsiteBuilderAgent orchestrator.
// =============================================================================

export { WebsiteBuilderAgent, type WebsiteBuilderAgentOptions, type WebsiteBuildResult } from './website-builder-agent';
export { AgentMemory } from './memory';
export { BuilderStateMachine, PHASE_ORDER } from './state-machine';
export { computeQualityScores, darkModeTokens, SCORE_WEIGHTS } from './quality-scorer';
export { validateWebsite } from './self-validation';
export { repairUntilValid, type RepairCycleResult } from './recursive-repair';
export type {
  BuilderAgentPhase,
  AgentProgress,
  ScoreCategory,
  QualityScores,
  FindingCategory,
  ValidationFinding,
  GenerationSummary,
} from './types';
