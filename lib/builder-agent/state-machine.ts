// =============================================================================
// Autonomous Website Builder Agent — State Machine
// =============================================================================
// The agent's lifecycle: Idle → Planning → Researching → Branding →
// Generating Pages → Generating Sections → Generating Content → Generating
// Images → Optimizing → Validating → Completed. Every transition reports
// progress (0–100).
// =============================================================================

import type { AgentProgress, BuilderAgentPhase } from './types';

export const PHASE_ORDER: BuilderAgentPhase[] = [
  'idle',
  'planning',
  'researching',
  'branding',
  'generating-pages',
  'generating-sections',
  'generating-content',
  'generating-images',
  'optimizing',
  'validating',
  'completed',
];

export class BuilderStateMachine {
  private phase: BuilderAgentPhase = 'idle';
  private readonly history: AgentProgress[] = [];

  constructor(private readonly onProgress?: (update: AgentProgress) => void) {}

  transition(next: BuilderAgentPhase, message: string): void {
    this.phase = next;
    const index = PHASE_ORDER.indexOf(next);
    const progress = index === -1 ? 100 : Math.round((index / (PHASE_ORDER.length - 1)) * 100);
    const update: AgentProgress = { phase: next, message, progress };
    this.history.push(update);
    this.onProgress?.(update);
  }

  get current(): BuilderAgentPhase {
    return this.phase;
  }

  getProgressHistory(): AgentProgress[] {
    return [...this.history];
  }
}
