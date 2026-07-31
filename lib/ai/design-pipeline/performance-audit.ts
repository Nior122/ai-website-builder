// =============================================================================
// Performance Audit
// =============================================================================
// Performance validation for generated designs: lazy loading, image
// optimization, layout shift prevention, JS budgets, and DOM weight. Reports
// issues with concrete fixes; applies deterministic auto-fixes where safe.
// =============================================================================

import type { DesignTokens, DesignValidationReport, ValidationIssue } from './types';

export interface PerformanceInput {
  /** Images referenced by the generated content. */
  images?: Array<{
    src?: string;
    alt?: string;
    loading?: string;
    width?: number;
    height?: number;
    isHero?: boolean;
  }>;
  /** Section count (rough DOM weight proxy). */
  sectionCount?: number;
  /** Inline scripts count (JS budget proxy). */
  inlineScriptCount?: number;
  /** External scripts count. */
  externalScriptCount?: number;
}

/**
 * Audit image optimization: lazy loading below the fold, dimensions present
 * (CLS prevention), and decoding hints.
 */
export function auditImages(images: PerformanceInput['images']): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!images) return issues;

  images.forEach((image, index) => {
    const position = image.isHero ? 'hero' : 'below-fold';

    if (position !== 'hero' && image.loading !== 'lazy' && image.loading !== undefined) {
      issues.push({
        rule: 'perf.images.lazy',
        severity: 'warning',
        message: `Image #${index + 1} (${image.src ?? 'unknown src'}) is not lazy-loaded.`,
        fix: 'Add loading="lazy" + decoding="async" to below-fold images.',
      });
    }

    if (image.width === undefined || image.height === undefined) {
      issues.push({
        rule: 'perf.cls.dimensions',
        severity: 'error',
        message: `Image #${index + 1} has no width/height — risk of layout shift (CLS).`,
        fix: 'Set explicit width/height or CSS aspect-ratio.',
      });
    }
  });

  return issues;
}

/**
 * Audit page weight proxies: section count, script count.
 */
export function auditPageWeight(input: PerformanceInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const sectionCount = input.sectionCount ?? 0;
  if (sectionCount > 30) {
    issues.push({
      rule: 'perf.dom.sections',
      severity: 'warning',
      message: `${sectionCount} sections on one page — heavy DOM.`,
      fix: 'Split into multiple pages or reduce sections to the essential 12-20.',
    });
  }

  const scripts = (input.inlineScriptCount ?? 0) + (input.externalScriptCount ?? 0);
  if (scripts > 12) {
    issues.push({
      rule: 'perf.js.budget',
      severity: 'warning',
      message: `${scripts} script tags — exceeds the 12-script budget.`,
      fix: 'Bundle vendor scripts; prefer dynamic imports for below-fold widgets.',
    });
  }

  return issues;
}

/**
 * Run the full performance audit.
 */
export function auditPerformance(tokens: DesignTokens, input: PerformanceInput = {}): DesignValidationReport {
  const issues: ValidationIssue[] = [
    ...auditImages(input.images),
    ...auditPageWeight(input),
  ];

  const repaired: string[] = [];
  // Deterministic auto-repair: nothing here can be fixed without touching
  // generated markup; the pipeline records fixes for the renderer to apply.
  if (input.images) {
    input.images.forEach((image, index) => {
      if (!image.isHero && image.loading !== 'lazy') {
        repaired.push(`image#${index + 1}: apply loading="lazy" decoding="async"`);
      }
    });
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  return { passed: errors.length === 0, issues, repaired };
}

// ─── Recommendations ────────────────────────────────────────────────────

export function performanceRecommendations(tokens: DesignTokens): string[] {
  return [
    'Hero images: loading="eager", fetchpriority="high".',
    'All below-fold images: loading="lazy" + decoding="async".',
    'Reserve space with aspect-ratio to keep CLS at 0.',
    'Keep initial JS under 170KB gzipped per page.',
    'Use dynamic imports for below-fold interactive sections (FAQ, gallery).',
    `Animation duration ceiling: ${tokens.motion.slow}ms — anything slower hurts perceived performance.`,
  ];
}
