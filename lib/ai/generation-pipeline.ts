// =============================================================================
// Staged Generation Pipeline — v3 (Lovable/Bolt-style structured generation)
// =============================================================================
// Orchestrates the deterministic-first, LLM-refined pipeline:
//   analyze → brand → design → pages → sections (per page) → seo → merge → validate
//
// Every stage is non-fatal: it has a curated, business-specific deterministic
// fallback, so free-model outages or garbage JSON never stall generation or
// produce placeholder content. The Final Validator gates the output and, if
// anything is invalid, the deterministic builders re-run as a repair pass.
// =============================================================================
import { logger } from '@/lib/logger';
import { getModelManager } from './model-manager';
import { getDefaultAnimations } from './defaults';
import { getIndustryProfile } from './industry-profiles';
import { runBusinessAnalysis } from './business-analysis';
import { runBrandGeneration, runDesignGeneration, buildThemeFromTokens, type BrandIdentity, type DesignTokens } from './design-system';
import { runPagePlanner, type PlannedPage } from './page-planner';
import { runSectionContentGeneration, buildDefaultSections, type SectionDraft, type SectionBuildContext } from './section-content';
import { runSEOGeneration, type SiteSEO } from './seo-generator';
import { runFinalValidation } from './final-validator';
import { logStageStart, logStageComplete, logStageFailed, generatePipelineSummary, type StageLog } from './observability';
import type { AIErrorContext } from './structured-errors';
import type { GenerateRequest } from '@/types';
import type { AIProjectOutput, GenerationProgress } from '@/features/ai-engine/types';

const LOG = { service: 'generation-pipeline' } as const;

export interface PipelineOptions {
  clerkUserId: string;
  dbUserId: string;
  projectId?: string;
  onProgress?: (progress: GenerationProgress) => void;
  signal?: AbortSignal;
  requestId?: string;
}

export interface PipelineResult {
  success: boolean;
  data?: AIProjectOutput;
  projectId?: string;
  stageLogs: StageLog[];
  totalDurationMs: number;
  error?: string;
}

interface MergeInput {
  brand: BrandIdentity;
  design: DesignTokens;
  pages: PlannedPage[];
  sectionsBySlug: Map<string, SectionDraft[]>;
  seo: SiteSEO;
  request: GenerateRequest;
}

export async function runGenerationPipeline(request: GenerateRequest, options: PipelineOptions): Promise<PipelineResult> {
  const stageLogs: StageLog[] = [];
  const startTime = Date.now();
  const mm = getModelManager();
  const aiCtx: AIErrorContext = { requestId: options.requestId, userId: options.dbUserId, projectId: options.projectId };
  const totalPages = request.pages?.length || 5;
  const onStage = (p: GenerationProgress): void => emit(options, p);

  try {
    // 1. Business Analyzer
    emit(options, { phase: 'analyzing', message: 'Analyzing your business and audience...', progress: 5, pagesGenerated: 0, totalPages, currentSection: null });
    const analysis = await runBusinessAnalysis(request, mm, aiCtx, onStage);
    aborted(options.signal);

    // 2. Brand identity
    emit(options, { phase: 'planning', message: `Defining the ${analysis.businessName || 'brand'} identity...`, progress: 15, pagesGenerated: 0, totalPages, currentSection: null });
    const brand = await runBrandGeneration(analysis, request, mm, aiCtx, onStage);
    aborted(options.signal);

    // 3. Design system (colors, fonts, spacing, radius, shadows, buttons, cards, icons)
    emit(options, { phase: 'generating', message: 'Creating the visual design system...', progress: 25, pagesGenerated: 0, totalPages, currentSection: null });
    const design = await runDesignGeneration(analysis, brand, request, mm, aiCtx, onStage);
    aborted(options.signal);

    // 4. Website / page planner
    emit(options, { phase: 'generating', message: 'Planning the page structure...', progress: 38, pagesGenerated: 0, totalPages, currentSection: null });
    const pages = await runPagePlanner(analysis, request, mm, aiCtx, onStage);
    aborted(options.signal);
    const pc = Math.max(1, pages.length);

    const ctx: SectionBuildContext = { analysis, brand, design, request, profile: getIndustryProfile(analysis.industryId || request.industry) };

    // 5. Section content, one page at a time (deterministic base + LLM refinement)
    const sectionsBySlug = new Map<string, SectionDraft[]>();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      emit(options, { phase: 'generating', message: `Writing content for ${page.title}...`, progress: 45 + Math.round((i / pc) * 42), pagesGenerated: i, totalPages: pc, currentSection: page.slug });
      aborted(options.signal);
      sectionsBySlug.set(page.slug, await runSectionContentGeneration(page, ctx, mm, aiCtx, onStage));
    }

    // 6. SEO + JSON-LD
    emit(options, { phase: 'refining', message: 'Optimizing SEO and metadata...', progress: 90, pagesGenerated: pc, totalPages: pc, currentSection: null });
    const seo = await runSEOGeneration(analysis, brand, request, pages, mm, aiCtx, onStage);
    aborted(options.signal);

    // 7. Merge stages into the project output
    emit(options, { phase: 'generating', message: 'Assembling the website structure...', progress: 95, pagesGenerated: pc, totalPages: pc, currentSection: null });
    logStageStart('merge');
    let merged = buildOutput({ brand, design, pages, sectionsBySlug, seo, request });
    logStageComplete('merge', { durationMs: 0, validationPassed: true });

    // 8. Final validation gate (+ deterministic repair pass)
    let validation = runFinalValidation(merged, onStage);
    if (!validation.valid) {
      logger.warn('Final validation failed — running deterministic repair pass', { ...LOG, issues: validation.issues.slice(0, 5) });
      logStageStart('validate');
      const repaired = new Map<string, SectionDraft[]>();
      for (const page of pages) repaired.set(page.slug, buildDefaultSections(page, ctx));
      merged = buildOutput({ brand, design, pages, sectionsBySlug: repaired, seo, request });
      validation = runFinalValidation(merged, onStage);
      if (!validation.valid) {
        const err = descriptiveError(validation.issues);
        logStageFailed('validate', err);
        const td = Date.now() - startTime;
        return { success: false, error: err, projectId: options.projectId, stageLogs, totalDurationMs: td };
      }
      logStageComplete('validate', { durationMs: 0, validationPassed: true });
    }

    const td = Date.now() - startTime;
    emit(options, { phase: 'complete', message: `Website generated — ${validation.pageCount} pages, ${validation.sectionCount} sections.`, progress: 100, pagesGenerated: validation.pageCount, totalPages: validation.pageCount, currentSection: null });
    logger.info(`Pipeline completed in ${td}ms — ${validation.pageCount} pages, ${validation.sectionCount} sections`, { ...LOG, totalDurationMs: td });
    logger.info(generatePipelineSummary(stageLogs));
    return { success: true, data: merged, projectId: options.projectId, stageLogs, totalDurationMs: td };
  } catch (err) {
    const td = Date.now() - startTime;
    const cancelled = err instanceof DOMException && err.name === 'AbortError';
    const message = cancelled ? 'Generation cancelled' : err instanceof Error ? err.message : String(err);
    logger.error(`Pipeline failed after ${td}ms: ${message}`, LOG);
    return { success: false, error: message, projectId: options.projectId, stageLogs, totalDurationMs: td };
  }
}

// ─── Merge ───────────────────────────────────────────────────────────────

function buildOutput(input: MergeInput): AIProjectOutput {
  const { brand, design, pages, sectionsBySlug, seo, request } = input;
  const b = {
    name: brand.name,
    tagline: brand.tagline,
    slogan: brand.tagline,
    description: brand.description,
    tone: brand.tone,
    mission: brand.mission,
    vision: brand.vision,
    values: brand.values,
    colors: {
      primary: design.colors.primary,
      secondary: design.colors.secondary,
      accent: design.colors.accent,
      background: design.colors.background,
      surface: design.colors.surface,
      text: design.colors.text,
      textSecondary: design.colors.textSecondary,
      border: design.colors.border,
    },
    typography: {
      heading: design.typography.heading,
      body: design.typography.body,
      mono: design.typography.mono,
    },
  };

  const mappedPages = pages.map((page, pi) => {
    const drafts = sectionsBySlug.get(page.slug) || [];
    const sections = drafts.map((d, si) => ({
      type: d.type,
      layout: d.layout,
      content: d.content,
      styles: {},
      animations: getDefaultAnimations(),
      images: d.images,
      order: si,
      id: `gen-${pi}-${si}`,
      customId: null,
      isLocked: false,
      visibility: { desktop: true, tablet: true, mobile: true },
    }));
    return {
      slug: page.slug,
      title: page.title,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      isHome: page.isHome,
      sections,
    };
  });

  const out = {
    brand: b,
    pages: mappedPages,
    theme: { name: brand.name, ...buildThemeFromTokens(design) },
    seo: {
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      keywords: seo.keywords,
      ogImage: seo.ogImage,
      ogType: seo.ogType,
      twitterCard: seo.twitterCard,
      noIndex: seo.noIndex,
      noFollow: seo.noFollow,
      jsonLd: seo.jsonLd,
      sitemap: seo.sitemap,
    },
    settings: { language: request.language || 'en' },
  };
  return out as unknown as AIProjectOutput;
}

function descriptiveError(issues: Array<{ path: string; message: string }>): string {
  const first = issues[0];
  if (!first) return 'Generated website failed validation with unknown issues.';
  return `Generated website has an issue at ${first.path}: ${first.message}${issues.length > 1 ? ` (and ${issues.length - 1} more)` : ''}. The deterministic repair pass could not resolve it.`;
}

function emit(o: PipelineOptions, p: GenerationProgress): void {
  if (o.onProgress) { try { o.onProgress(p); } catch { /* client disconnected — ignore */ } }
}

function aborted(s?: AbortSignal): void {
  if (s?.aborted) throw new DOMException('Cancelled', 'AbortError');
}
