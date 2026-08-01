// =============================================================================
// Agent System — Progress Tracking
// =============================================================================
// Checkpoint-based progress (not percentage-only): every agent emits a
// human-readable stage that can be surfaced to the user.
// =============================================================================

import type { AgentId, ProgressUpdate } from './types';

export interface ProgressStep {
  agentId: AgentId;
  label: string;
  /** Message shown while the step is running. */
  running: string;
  /** Message shown when the step completes. */
  done: string;
}

export const AGENT_PROGRESS_STEPS: ProgressStep[] = [
  { agentId: 'business', label: 'Understanding business', running: 'Understanding business...', done: '✓ Understanding business' },
  { agentId: 'brand', label: 'Creating brand', running: 'Creating brand identity...', done: '✓ Creating brand' },
  { agentId: 'ux', label: 'Designing experience', running: 'Designing the user experience...', done: '✓ Designing experience' },
  { agentId: 'ui', label: 'Crafting visual system', running: 'Crafting the visual system...', done: '✓ Crafting visual system' },
  { agentId: 'copy', label: 'Writing content', running: 'Writing conversion-focused copy...', done: '✓ Writing content' },
  { agentId: 'images', label: 'Directing imagery', running: 'Directing imagery...', done: '✓ Directing imagery' },
  { agentId: 'seo', label: 'Optimizing SEO', running: 'Optimizing SEO metadata...', done: '✓ Optimizing SEO' },
  { agentId: 'frontend', label: 'Building components', running: 'Architecting components...', done: '✓ Building components' },
  { agentId: 'accessibility', label: 'Checking accessibility', running: 'Checking accessibility...', done: '✓ Checking accessibility' },
  { agentId: 'performance', label: 'Optimizing performance', running: 'Optimizing performance...', done: '✓ Optimizing performance' },
  { agentId: 'security', label: 'Reviewing security', running: 'Reviewing security...', done: '✓ Reviewing security' },
  { agentId: 'qa', label: 'Running quality checks', running: 'Running final quality checks...', done: '✓ Running quality checks' },
];

export class ProgressTracker {
  private readonly steps: ProgressStep[];
  private readonly updates: ProgressUpdate[] = [];
  private readonly onUpdate?: (update: ProgressUpdate) => void;

  constructor(onUpdate?: (update: ProgressUpdate) => void) {
    this.steps = AGENT_PROGRESS_STEPS;
    this.onUpdate = onUpdate;
  }

  private emit(step: number, message: string): void {
    const update: ProgressUpdate = {
      step,
      total: this.steps.length,
      message,
    };
    this.updates.push(update);
    this.onUpdate?.(update);
  }

  start(agentId: AgentId): void {
    const step = this.steps.find((s) => s.agentId === agentId);
    if (!step) return;
    this.emit(this.steps.indexOf(step), step.running);
  }

  complete(agentId: AgentId, recovered = false): void {
    const step = this.steps.find((s) => s.agentId === agentId);
    if (!step) return;
    this.emit(this.steps.indexOf(step), recovered ? `${step.done} (recovered)` : step.done);
  }

  getUpdates(): ProgressUpdate[] {
    return [...this.updates];
  }
}
