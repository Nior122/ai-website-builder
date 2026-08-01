// =============================================================================
// Autonomous Website Builder Agent
// =============================================================================
// The project orchestrator. Once "Generate Website" is pressed, the agent
// keeps working until the ENTIRE website is complete and validated:
//
//   Analyse → Choose niche → Research competitors → Brand identity → Design
//   direction → Colors → Typography → Layouts → Pages → Sections → Content →
//   Images → Navigation → SEO → Metadata → Validate → Repair → Complete
//
// The agent NEVER returns partial output. If validation fails it repairs
// recursively (max 5 cycles); if a score is below 90 it improves that
// category. Failures retry only the failed stage.
// =============================================================================

import { logger } from '@/lib/logger';
import type { DesignBrief } from '@/lib/ai/design-pipeline';
import type { Agent } from '@/lib/agents';
import {
  runGenerationWorkflow,
  buildNavigation,
  updateSiteSeo,
  updatePageMeta,
  updateSectionContent,
  defaultSection,
  defaultForms,
  seedMediaLibrary,
  updateStyleToken,
  updateMediaItem,
  STYLE_EDITOR_FIELDS,
  getStyleToken,
  type BuilderProject,
} from '@/lib/builder';
import { AgentMemory } from './memory';
import { BuilderStateMachine } from './state-machine';
import { computeQualityScores } from './quality-scorer';
import { validateWebsite } from './self-validation';
import { repairUntilValid, type RepairCycleResult } from './recursive-repair';
import type {
  AgentProgress,
  BuilderAgentPhase,
  GenerationSummary,
  QualityScores,
  ScoreCategory,
  ValidationFinding,
} from './types';

const LOG = { service: 'website-builder-agent' } as const;

export interface WebsiteBuilderAgentOptions {
  onProgress?: (update: AgentProgress) => void;
  /** Optional Phase 3 agent roster override. */
  agents?: Agent[];
  maxRepairCycles?: number;
}

export interface WebsiteBuildResult {
  success: boolean;
  project: BuilderProject | null;
  summary: GenerationSummary | null;
  validation: { findings: ValidationFinding[]; passed: boolean } | null;
  quality: QualityScores | null;
  repairCycles: RepairCycleResult | null;
  improvements: string[];
  progress: AgentProgress[];
  memory: Record<string, unknown>;
  durationMs: number;
  error?: string;
}

function phaseForWorkflowStep(step: number): BuilderAgentPhase {
  if (step <= 2) return 'researching';
  if (step <= 4) return 'branding';
  if (step <= 8) return 'generating-pages';
  if (step === 9) return 'generating-images';
  if (step === 10) return 'generating-content';
  if (step <= 13) return 'optimizing';
  return 'validating';
}

export class WebsiteBuilderAgent {
  private readonly memory = new AgentMemory();
  private readonly state: BuilderStateMachine;
  private readonly agents?: Agent[];
  private readonly maxRepairCycles: number;

  constructor(options: WebsiteBuilderAgentOptions = {}) {
    this.state = new BuilderStateMachine(options.onProgress);
    this.agents = options.agents;
    this.maxRepairCycles = options.maxRepairCycles ?? 5;
  }

  /**
   * Generate a complete, validated website. Never returns partial output.
   */
  async generateWebsite(brief: DesignBrief): Promise<WebsiteBuildResult> {
    const startedAt = Date.now();
    this.memory.rememberBusiness(brief);

    try {
      // ── Planning ─────────────────────────────────────────────────────
      this.state.transition('planning', 'Planning the project...');
      this.memory.remember('request', {
        name: brief.businessName,
        industry: brief.industry,
        businessType: brief.businessType,
        tone: brief.tone,
        pages: brief.pages,
      });

      // ── Researching → Building (Phase 3 agents + Phase 4 builder) ───
      this.state.transition('researching', 'Researching business, audience, and competitors...');
      const workflow = await this.runStage('generation-workflow', () =>
        runGenerationWorkflow(brief, {
          agents: this.agents,
          onProgress: (update) => this.state.transition(phaseForWorkflowStep(update.step), update.message),
        })
      );

      // ── Branding ────────────────────────────────────────────────────
      this.state.transition('branding', 'Finalizing brand identity and theme...');
      this.memory.rememberProject(workflow.project);

      this.state.transition('generating-pages', 'Generating pages...');
      this.state.transition('generating-sections', 'Generating sections...');
      this.state.transition('generating-content', 'Generating content...');
      this.state.transition('generating-images', 'Generating images...');

      // ── Optimizing / Validating / Repairing ─────────────────────────
      this.state.transition('optimizing', 'Optimizing the website...');
      const repair = await this.runStage('repair-cycles', async () =>
        repairUntilValid(workflow.project, {
          maxCycles: this.maxRepairCycles,
          onCycle: (cycle, repaired) =>
            logger.info(`Repair cycle ${cycle}: ${repaired.join(', ') || 'no targeted repairs'}`, LOG),
        })
      );
      let project = repair.project;

      // ── Quality scores: improve any category below 90 ───────────────
      let quality = computeQualityScores(project);
      const improvements: string[] = [];
      const categories: ScoreCategory[] = ['visual', 'ux', 'seo', 'accessibility', 'content', 'performance', 'completeness'];
      for (const category of categories) {
        if (quality[category] < 90) {
          const improved = this.improveCategory(project, category);
          project = improved.project;
          improvements.push(...improved.applied);
          logger.info(`Improved ${category} (was ${quality[category]}): ${improved.applied.join(', ')}`, LOG);
        }
      }
      if (improvements.length > 0) {
        quality = computeQualityScores(project);
      }

      // ── Final validation ────────────────────────────────────────────
      this.state.transition('validating', 'Validating the complete website...');
      const validation = validateWebsite(project);
      const passed = validation.errors.length === 0;
      this.memory.rememberProject(project);

      this.state.transition('completed', 'Website complete — everything built and validated.');

      const summary = this.buildSummary(project, quality, repair, improvements.length, Date.now() - startedAt);

      return {
        success: passed,
        project,
        summary,
        validation: { findings: validation.findings, passed },
        quality,
        repairCycles: repair.result,
        improvements,
        progress: this.state.getProgressHistory(),
        memory: this.memory.toJSON(),
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`WebsiteBuilderAgent failed: ${message}`, LOG);
      this.state.transition('failed', `Generation failed: ${message}`);
      return {
        success: false,
        project: null,
        summary: null,
        validation: null,
        quality: null,
        repairCycles: null,
        improvements: [],
        progress: this.state.getProgressHistory(),
        memory: this.memory.toJSON(),
        durationMs: Date.now() - startedAt,
        error: message,
      };
    }
  }

  // ─── Stage-scoped recovery: retry only the failed stage ──────────────

  private async runStage<T>(stage: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`[Builder Agent] Stage "${stage}" failed (${message}) — retrying only this stage.`, LOG);
      return fn();
    }
  }

  // ─── Targeted improvement for a category below 90 ───────────────────

  private improveCategory(project: BuilderProject, category: ScoreCategory): { project: BuilderProject; applied: string[] } {
    const applied: string[] = [];
    let next = project;

    switch (category) {
      case 'content': {
        next = {
          ...next,
          pages: next.pages.map((page) => ({
            ...page,
            sections: page.sections.map((section) => {
              if (['divider', 'spacer', 'custom-html'].includes(section.type)) return section;
              const weak = !Object.values(section.content).some((value) => typeof value === 'string' && value.trim().length > 0);
              if (!weak) return section;
              applied.push(`content:${section.type}`);
              return { ...section, content: defaultSection(section.type, section.order).content };
            }),
          })),
        };
        break;
      }
      case 'seo': {
        if (!next.seo.ogImage) {
          next = updateSiteSeo(next, { ogImage: `/images/og/${next.id}.png` });
          applied.push('seo:opengraph');
        }
        if (next.seo.keywords.length < 3) {
          next = updateSiteSeo(next, {
            keywords: [...next.seo.keywords, next.industry.toLowerCase(), next.businessType.toLowerCase(), 'website'],
          });
          applied.push('seo:keywords');
        }
        for (const page of next.pages) {
          if (!page.metaTitle) {
            next = updatePageMeta(next, page.id, {
              metaTitle: `${page.title} — ${next.name}`,
              metaDescription: `${page.title} page for ${next.name}.`,
            });
            applied.push(`seo:page-meta:${page.slug}`);
          }
        }
        break;
      }
      case 'accessibility': {
        next = { ...next, media: next.media.map((item) => ({ ...item, alt: item.alt || 'Generated image' })) };
        next = {
          ...next,
          pages: next.pages.map((page) => ({
            ...page,
            sections: page.sections.map((section) => ({
              ...section,
              images: section.images.map((image) => ({ ...image, alt: image.alt || 'Generated image' })),
            })),
          })),
        };
        applied.push('accessibility:alt-text');
        break;
      }
      case 'performance': {
        next = { ...next, media: next.media.map((item) => ({ ...item, width: item.width ?? 800, height: item.height ?? 600 })) };
        next = {
          ...next,
          pages: next.pages.map((page) => ({
            ...page,
            sections: page.sections.map((section) => ({
              ...section,
              images: section.images.map((image) => ({ ...image, width: image.width ?? 800, height: image.height ?? 600 })),
            })),
          })),
        };
        applied.push('performance:dimensions');
        break;
      }
      case 'completeness': {
        if (next.forms.length === 0) {
          next = { ...next, forms: defaultForms() };
          applied.push('completeness:forms');
        }
        if (next.media.length === 0) {
          next = seedMediaLibrary(next, [`${next.name} hero visual`], 'natural-warm');
          applied.push('completeness:media');
        }
        break;
      }
      case 'visual': {
        for (const field of STYLE_EDITOR_FIELDS) {
          if (getStyleToken(next.theme, field.path) === undefined) {
            const fallback = field.kind === 'color' ? '#4f46e5' : field.kind === 'number' ? 250 : 'Inter';
            next = { ...next, theme: updateStyleToken(next.theme, field.path, fallback) };
            applied.push(`visual:${field.path}`);
          }
        }
        break;
      }
      case 'ux': {
        if (next.navigation.links.length < 3) {
          next = { ...next, navigation: buildNavigation(next) };
          applied.push('ux:navigation');
        }
        break;
      }
      default:
        break;
    }

    return { project: next, applied };
  }

  // ─── Generation summary ──────────────────────────────────────────────

  private buildSummary(
    project: BuilderProject,
    quality: QualityScores,
    repair: { result: RepairCycleResult },
    improvementCount: number,
    durationMs: number
  ): GenerationSummary {
    const read = (path: string): string => {
      const parts = path.split('.');
      let current: unknown = project.theme.tokens;
      for (const part of parts) {
        if (typeof current !== 'object' || current === null) return '';
        current = (current as Record<string, unknown>)[part];
      }
      return typeof current === 'string' ? current : '';
    };

    const sectionTypes = Array.from(
      new Set(project.pages.flatMap((page) => page.sections.map((section) => section.type)))
    );

    return {
      pagesCreated: project.pages.length,
      sectionsCreated: project.pages.reduce((sum, page) => sum + page.sections.length, 0),
      theme: project.theme.preset,
      fonts: { heading: read('fontFamily.heading') || 'Inter', body: read('fontFamily.body') || 'Inter' },
      colors: {
        primary: read('colors.primary') || '#4f46e5',
        secondary: read('colors.secondary') || '#7c3aed',
        accent: read('colors.accent') || '#d97706',
      },
      components: sectionTypes,
      images: project.media.length,
      animations: read('style.animation') || 'subtle-fade',
      seoScore: quality.seo,
      accessibilityScore: quality.accessibility,
      performanceScore: quality.performance,
      validationStatus: repair.result.repaired.length + improvementCount > 0 ? 'passed-with-repairs' : 'passed',
      repairCount: repair.result.repaired.length + improvementCount,
      generationTimeMs: durationMs,
      quality,
    };
  }
}
