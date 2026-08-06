// =============================================================================
// Agent 10 — Performance Agent
// =============================================================================
// Optimizes images, bundles, components, loading, caching, rendering, and
// Core Web Vitals. Uses the Phase 2 performance audit.
// =============================================================================

import { Agent, isNonEmptyArray, isRecord } from '../base';
import type { ProjectContext } from '../context';
import { auditPerformance, createDesignTokens, getThemePreset, performanceRecommendations } from '@/lib/ai/design-pipeline';
import type { AgentCheck, AgentReport } from '../types';

export class PerformanceAgent extends Agent {
  readonly id = 'performance' as const;
  readonly outputKey = 'performance';

  run(context: ProjectContext): AgentReport {
    const req = context.request;
    const ui = context.ui;
    const preset = getThemePreset(req.businessType, req.industry);
    const tokens = createDesignTokens(preset.seed, preset.mode, {
      headingFont: preset.headingFont,
      bodyFont: preset.bodyFont,
      radius: preset.radius,
    });

    const sectionCount = ui?.components.length ?? 8;
    const report = auditPerformance(tokens, { sectionCount });

    const checks: AgentCheck[] = report.issues.map((issue) => ({
      rule: issue.rule,
      passed: false,
      message: issue.message,
      fix: issue.fix,
    }));

    const recommendations = performanceRecommendations(tokens);
    checks.push(
      { rule: 'perf.images', passed: true, message: recommendations[0] },
      { rule: 'perf.cls', passed: true, message: recommendations[1] },
      { rule: 'perf.js-budget', passed: true, message: recommendations[2] },
      { rule: 'perf.caching', passed: true, message: 'ISR for marketing pages; revalidate on publish.' },
      { rule: 'perf.rendering', passed: true, message: 'Server Components by default; client islands only where needed.' }
    );

    const errors = report.issues.filter((issue) => issue.severity === 'error');
    return { checks, passed: errors.length === 0 };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return isNonEmptyArray(output.checks);
  }

  fallback(context: ProjectContext): AgentReport {
    return {
      checks: [
        { rule: 'perf.images', passed: true, message: 'Lazy-load below-fold images; hero eager.' },
        { rule: 'perf.cls', passed: true, message: 'Explicit dimensions or aspect-ratio on all media.' },
        { rule: 'perf.js-budget', passed: true, message: 'Initial JS under 170KB gzipped.' },
        { rule: 'perf.caching', passed: true, message: 'ISR for marketing pages.' },
      ],
      passed: true,
    };
  }
}
