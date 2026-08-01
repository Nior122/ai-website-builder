// =============================================================================
// Website Builder — Generation Workflow
// =============================================================================
// The professional generation dashboard flow:
//
//   Understanding Business → Creating Brand Identity → Selecting Theme →
//   Designing Layout → Building Home/About/Services/Contact → Creating Images
//   → Writing Copy → Optimizing SEO → Performance → Accessibility → QA → Ready
//
// Every step emits a live progress update (current task, agent, model).
// =============================================================================

import type { DesignBrief } from '@/lib/ai/design-pipeline';
import {
  AgentOrchestrator,
  type Agent,
  type OrchestrationResult,
  type ProgressUpdate,
} from '@/lib/agents';
import { buildProjectFromBlueprint } from './project-builder';
import { runQualityChecks } from './quality-checks';
import type { BuilderProject, QualityReport, WorkflowProgress } from './types';

export interface WorkflowStepDef {
  id: string;
  label: string;
}

/** The 15 user-visible workflow steps. */
export const GENERATION_WORKFLOW: WorkflowStepDef[] = [
  { id: 'business', label: 'Understanding Business' },
  { id: 'brand', label: 'Creating Brand Identity' },
  { id: 'theme', label: 'Selecting Theme' },
  { id: 'layout', label: 'Designing Layout' },
  { id: 'home', label: 'Building Home Page' },
  { id: 'about', label: 'Building About Page' },
  { id: 'services', label: 'Building Services' },
  { id: 'contact', label: 'Building Contact' },
  { id: 'images', label: 'Creating Images' },
  { id: 'copy', label: 'Writing Copy' },
  { id: 'seo', label: 'Optimizing SEO' },
  { id: 'performance', label: 'Performance Optimization' },
  { id: 'accessibility', label: 'Accessibility Review' },
  { id: 'qa', label: 'Quality Assurance' },
  { id: 'ready', label: 'Website Ready' },
];

export interface GenerationWorkflowOptions {
  agents?: Agent[];
  onProgress?: (update: WorkflowProgress) => void;
}

export interface GenerationWorkflowResult {
  project: BuilderProject;
  quality: QualityReport;
  blueprint: OrchestrationResult;
  progress: WorkflowProgress[];
  durationMs: number;
}

/** Phase 3 agent-progress index → workflow step. */
const STEP_BY_AGENT_INDEX: Record<number, number> = {
  0: 1, // business
  1: 2, // brand
  2: 4, // ux
  3: 4, // ui
  4: 10, // copy
  5: 9, // images
  6: 11, // seo
  8: 13, // accessibility
  9: 12, // performance
  11: 14, // qa
};

export async function runGenerationWorkflow(
  brief: DesignBrief,
  options: GenerationWorkflowOptions = {}
): Promise<GenerationWorkflowResult> {
  const startedAt = Date.now();
  const progress: WorkflowProgress[] = [];
  const total = GENERATION_WORKFLOW.length;

  const emit = (step: number, message: string, extra?: { agent?: string; model?: string }): void => {
    const update: WorkflowProgress = {
      step,
      total,
      message,
      agent: extra?.agent,
      model: extra?.model,
    };
    progress.push(update);
    options.onProgress?.(update);
  };

  const orchestrator = new AgentOrchestrator({
    agents: options.agents,
    onProgress: (update: ProgressUpdate) => {
      const step = STEP_BY_AGENT_INDEX[update.step];
      if (step !== undefined) {
        emit(step, update.message);
      }
    },
  });

  const blueprint = await orchestrator.run(brief);

  const brandModel = blueprint.results.find((r) => r.agentId === 'brand')?.model ?? undefined;
  emit(3, '✓ Selecting Theme', { agent: 'brand', model: brandModel });

  // Build the full project.
  const raw = buildProjectFromBlueprint(brief, blueprint);

  emit(5, '✓ Building Home Page', { agent: 'frontend' });
  emit(6, '✓ Building About Page', { agent: 'frontend' });
  emit(7, '✓ Building Services', { agent: 'frontend' });
  emit(8, '✓ Building Contact', { agent: 'frontend' });

  // Quality assurance with auto-repair.
  const { project, report } = runQualityChecks(raw);
  emit(14, `✓ Quality Assurance (${report.repaired.length} auto-repair(s))`, { agent: 'qa' });
  emit(15, '✓ Website Ready', { model: blueprint.results[0]?.model ?? undefined });

  return {
    project,
    quality: report,
    blueprint,
    progress,
    durationMs: Date.now() - startedAt,
  };
}
