// =============================================================================
// Final Validator — gates the complete AI output before it reaches the DB
// =============================================================================
// Validates the merged project against the master schemas (aiProjectOutputSchema
// + per-section content schemas). Produces descriptive, actionable issues —
// never a bare "Generation failed". The pipeline uses this as the final gate;
// if it fails, the deterministic content builders are re-run as a repair pass.
// =============================================================================

import { logger } from '@/lib/logger';
import { aiProjectOutputSchema, validateAllSections } from '@/features/json-engine/schemas/project-schemas';
import { logStageStart, logStageComplete, logStageFailed } from './observability';
import type { GenerationProgress } from '@/features/ai-engine/types';

const LOG = { service: 'final-validator' } as const;

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface FinalValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  /** Count of pages / sections that passed through intact. */
  pageCount: number;
  sectionCount: number;
}

export function validateGeneratedOutput(data: unknown): FinalValidationResult {
  const issues: ValidationIssue[] = [];
  const top = aiProjectOutputSchema.safeParse(data);

  if (!top.success) {
    for (const issue of top.error.issues.slice(0, 20)) {
      issues.push({ path: issue.path.join('.') || '<root>', message: issue.message });
    }
    return { valid: false, issues, pageCount: 0, sectionCount: 0 };
  }

  const output = top.data;
  let sectionCount = 0;
  for (const page of output.pages) {
    sectionCount += page.sections.length;
    if (page.sections.length === 0) {
      issues.push({ path: `pages.${page.slug || '?'}`, message: 'Page has no sections' });
    }
  }

  if (!output.brand || !output.brand.name) {
    issues.push({ path: 'brand.name', message: 'Brand name is missing' });
  }

  const sectionResult = validateAllSections(output.pages as never);
  if (!sectionResult.valid) {
    for (const e of sectionResult.sectionErrors.slice(0, 20)) {
      issues.push({
        path: `pages.${e.pageSlug}.sections[${e.sectionIndex}].${e.type}`,
        message: e.errors.join('; '),
      });
    }
  }

  return { valid: issues.length === 0, issues, pageCount: output.pages.length, sectionCount };
}

/** Run the validate stage (logged) — used as the pipeline's final gate. */
export function runFinalValidation(
  data: unknown,
  emit?: (p: GenerationProgress) => void
): FinalValidationResult {
  logStageStart('validate');
  const result = validateGeneratedOutput(data);
  if (result.valid) {
    logStageComplete('validate', { durationMs: 0, validationPassed: true });
  } else {
    logStageFailed('validate', result.issues.slice(0, 5).map(i => `${i.path}: ${i.message}`).join(' | '));
    logger.warn('Final validation failed — deterministic repair pass will run', { ...LOG, issues: result.issues.slice(0, 8) });
  }
  return result;
}
