// =============================================================================
// Autonomous Website Builder Agent — Recursive Repair
// =============================================================================
// If validation fails the agent NEVER returns. It repairs → validates →
// repairs → validates, up to 5 cycles, until the website passes. Only the
// failing task is repaired — never the whole website.
// =============================================================================

import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';
import {
  runQualityChecks,
  ensureRequiredPages,
  updateSiteSeo,
  updatePageMeta,
  updateSectionContent,
  defaultForms,
  defaultSection,
  seedMediaLibrary,
  uniqueSlug,
  type BuilderProject,
} from '@/lib/builder';
import { validateWebsite } from './self-validation';
import type { ValidationFinding } from './types';

const LOG = { service: 'builder-agent' } as const;

export interface RepairCycleResult {
  cyclesUsed: number;
  maxCycles: number;
  passed: boolean;
  repaired: string[];
}

function applyTargetedRepairs(
  project: BuilderProject,
  findings: ValidationFinding[]
): { project: BuilderProject; repaired: string[] } {
  const repaired: string[] = [];

  // Phase 4 quality gate repairs the common cases (nav, CTA, empty sections,
  // alt text, dimensions, SEO, required pages).
  const quality = runQualityChecks(project);
  let next = quality.project;
  repaired.push(...quality.report.repaired);

  next = ensureRequiredPages(next);

  for (const finding of findings) {
    if (finding.passed || finding.severity !== 'error') continue;

    switch (finding.rule) {
      case 'seo.opengraph': {
        next = updateSiteSeo(next, { ogImage: `/images/og/${next.id}.png` });
        repaired.push('seo:opengraph image assigned');
        break;
      }
      case 'seo.page-meta': {
        for (const page of next.pages) {
          if (!page.metaTitle || !page.metaDescription) {
            next = updatePageMeta(next, page.id, {
              metaTitle: page.metaTitle || `${page.title} — ${next.name}`,
              metaDescription: page.metaDescription || `${page.title} page for ${next.name}.`,
            });
          }
        }
        repaired.push('seo:page metadata filled');
        break;
      }
      case 'sections.no-empty':
      case 'content.no-empty': {
        for (const page of next.pages) {
          for (const section of page.sections) {
            if (['divider', 'spacer', 'custom-html'].includes(section.type)) continue;
            const weak = !Object.values(section.content).some((value) => typeof value === 'string' && value.trim().length > 0);
            if (weak) {
              next = updateSectionContent(next, page.id, section.id, defaultSection(section.type, section.order).content);
              repaired.push(`content:${section.type} filled`);
            }
          }
        }
        break;
      }
      case 'pages.unique-slugs': {
        const seen = new Set<string>();
        next = {
          ...next,
          pages: next.pages.map((page) => {
            if (seen.has(page.slug)) {
              repaired.push(`pages:slug "${page.slug}" deduplicated`);
              return { ...page, slug: uniqueSlug(next, `${page.slug}-2`) };
            }
            seen.add(page.slug);
            return page;
          }),
        };
        break;
      }
      case 'ids.unique': {
        next = {
          ...next,
          pages: next.pages.map((page) => ({
            ...page,
            sections: page.sections.map((section) => ({ ...section, id: nanoid() })),
          })),
          media: next.media.map((item) => ({ ...item, id: nanoid() })),
        };
        repaired.push('ids:duplicates regenerated');
        break;
      }
      case 'forms.fields': {
        if (next.forms.length === 0) {
          next = { ...next, forms: defaultForms() };
          repaired.push('forms:default contact + newsletter added');
        }
        break;
      }
      case 'media.images': {
        if (next.media.length === 0) {
          next = seedMediaLibrary(next, [`${next.name} hero visual`], 'natural-warm');
          repaired.push('media:library seeded');
        }
        break;
      }
      default:
        break;
    }
  }

  return { project: next, repaired };
}

/**
 * Repair → validate → repair → validate, until the website passes.
 * Hard cap: 5 repair cycles.
 */
export function repairUntilValid(
  project: BuilderProject,
  options: { maxCycles?: number; onCycle?: (cycle: number, repaired: string[]) => void } = {}
): { project: BuilderProject; result: RepairCycleResult } {
  const maxCycles = options.maxCycles ?? 5;
  const repaired: string[] = [];
  let current = project;

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    const { errors } = validateWebsite(current);
    if (errors.length === 0) {
      return {
        project: current,
        result: { cyclesUsed: cycle - 1, maxCycles, passed: true, repaired },
      };
    }

    logger.warn(`[Builder Agent] Validation cycle ${cycle}: ${errors.length} error(s) — repairing.`, {
      ...LOG,
      cycle,
      errorRules: errors.map((error) => error.rule),
    });

    const result = applyTargetedRepairs(current, errors);
    current = result.project;
    repaired.push(...result.repaired);
    options.onCycle?.(cycle, result.repaired);
  }

  const finalErrors = validateWebsite(current).errors;
  return {
    project: current,
    result: {
      cyclesUsed: maxCycles,
      maxCycles,
      passed: finalErrors.length === 0,
      repaired,
    },
  };
}
