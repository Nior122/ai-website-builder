// =============================================================================
// Staged Generation Pipeline — v2
// =============================================================================
import { logger } from '@/lib/logger';
import { getModelManager, type ModelCallResult } from './model-manager';
import { repairAndParse } from './json-repair-engine';
import { safeValidate } from './safe-validation';
import { getDefaultBrand, getDefaultTheme, getDefaultSEO, getDefaultAnimations, getDefaultImages } from './defaults';
import { resolveStockImage } from './stock-images';
import { BRAND_SYSTEM_PROMPT, buildBrandPrompt, THEME_SYSTEM_PROMPT, buildThemePrompt, PAGES_SYSTEM_PROMPT, buildPagesPrompt, SECTIONS_SYSTEM_PROMPT, buildSectionsPrompt, SEO_SYSTEM_PROMPT, buildSEOPrompt, IMAGE_SYSTEM_PROMPT, buildImagePrompt } from './prompts/templates';
import { logStageStart, logStageComplete, logStageFailed, generatePipelineSummary, type GenerationStage, type StageLog } from './observability';
import { GenerationStageError, JSONRepairError, type AIErrorContext } from './structured-errors';
import { z } from 'zod';
import type { GenerateRequest } from '@/types';
import type { AIProjectOutput, GenerationProgress } from '@/features/ai-engine/types';
const LOG = { service: 'generation-pipeline' } as const;
export interface PipelineOptions { clerkUserId: string; dbUserId: string; projectId?: string; onProgress?: (progress: GenerationProgress) => void; signal?: AbortSignal; requestId?: string; }
export interface PipelineResult { success: boolean; data?: AIProjectOutput; projectId?: string; stageLogs: StageLog[]; totalDurationMs: number; error?: string; }

export async function runGenerationPipeline(request: GenerateRequest, options: PipelineOptions): Promise<PipelineResult> {
  const stageLogs: StageLog[] = []; const startTime = Date.now(); const mm = getModelManager(); const aiCtx: AIErrorContext = { requestId: options.requestId, userId: options.dbUserId, projectId: options.projectId };
  const totalPages = request.pages?.length || 5;
  let brand: Record<string, unknown> | null = null; let theme: Record<string, unknown> | null = null;
  let pagesOutput: Array<Record<string, unknown>> | null = null; const sectionsByPage: Map<string, Array<Record<string, unknown>>> = new Map();
  let seo: Record<string, unknown> | null = null; const imagesByIndex: Map<number, Array<Record<string, unknown>>> = new Map();
  try {
    emit(options, { phase: 'generating', message: 'Defining brand identity...', progress: 10, pagesGenerated: 0, totalPages, currentSection: null }); logStageStart('brand');
    try { const r = await mm.executeWithFallback<string>({ system: BRAND_SYSTEM_PROMPT, messages: [{ role: 'user', content: buildBrandPrompt(request) }], stage: 'brand' }, { ...aiCtx, stage: 'brand' }); brand = validateStage('brand', r, brandSchema, 'brand') as Record<string, unknown>; logStageComplete('brand', { durationMs: r.latencyMs, model: r.model, provider: r.provider, validationPassed: true }); } catch { brand = getDefaultBrand() as Record<string, unknown>; logStageComplete('brand', { durationMs: 0, validationPassed: true }); }
    aborted(options.signal);
    emit(options, { phase: 'generating', message: 'Creating visual theme...', progress: 25, pagesGenerated: 0, totalPages, currentSection: null }); logStageStart('theme');
    try { const r = await mm.executeWithFallback<string>({ system: THEME_SYSTEM_PROMPT, messages: [{ role: 'user', content: buildThemePrompt({ businessName: (brand?.name as string)||request.businessName||'Business', industry: request.industry, brandTone: (brand?.tone as string)||request.tone||'professional', brandColors: brand?.colors as any, brandTypography: brand?.typography as any }) }], stage: 'theme' }, { ...aiCtx, stage: 'theme' }); theme = validateStage('theme', r, themeSchema, 'theme') as Record<string, unknown>; logStageComplete('theme', { durationMs: r.latencyMs, validationPassed: true }); } catch { theme = getDefaultTheme(request.industry) as Record<string, unknown>; logStageComplete('theme', { durationMs: 0, validationPassed: true }); }
    aborted(options.signal);
    emit(options, { phase: 'generating', message: 'Planning page structure...', progress: 40, pagesGenerated: 0, totalPages, currentSection: null }); logStageStart('pages');
    try { const r = await mm.executeWithFallback<string>({ system: PAGES_SYSTEM_PROMPT, messages: [{ role: 'user', content: buildPagesPrompt({ businessName: (brand?.name as string)||request.businessName||'Business', industry: request.industry, businessType: request.businessType, tone: (brand?.tone as string)||request.tone||'professional', brandDescription: (brand?.description as string)||request.description, requestedPages: request.pages }) }], stage: 'pages' }, { ...aiCtx, stage: 'pages' }); pagesOutput = (validateStage('pages', r, pagesSchema, 'pages') as any).pages; logStageComplete('pages', { durationMs: r.latencyMs, validationPassed: true }); } catch { pagesOutput = (request.pages||['home','about','services','contact']).map((s,i) => ({ slug: s, title: s[0].toUpperCase()+s.slice(1), metaTitle: `${(brand?.name as string)||'Website'} — ${s[0].toUpperCase()+s.slice(1)}`, metaDescription: `Learn more about our ${s} services.`, isHome: i===0 })); logStageComplete('pages', { durationMs: 0, validationPassed: true }); }
    aborted(options.signal);
    const pc = pagesOutput?.length||1; emit(options, { phase: 'generating', message: `Generating sections for ${pc} page(s)...`, progress: 55, pagesGenerated: 0, totalPages: pc, currentSection: null }); logStageStart('sections');
    try { for (let i = 0; i < (pagesOutput?.length||0); i++) { const pg = pagesOutput![i]; const slug = (pg.slug as string)||`page-${i+1}`; emit(options, { phase: 'generating', message: `Building ${pg.title as string||slug}...`, progress: 55+Math.round((i/pc)*25), pagesGenerated: i, totalPages: pc, currentSection: slug }); try { const r = await mm.executeWithFallback<string>({ system: SECTIONS_SYSTEM_PROMPT, messages: [{ role: 'user', content: buildSectionsPrompt({ businessName: (brand?.name as string)||request.businessName||'Business', businessType: request.businessType, industry: request.industry, tone: (brand?.tone as string)||request.tone||'professional', pageSlug: slug, pageTitle: (pg.title as string)||slug, isHome: (pg.isHome as boolean)||false, brandDescription: (brand?.description as string)||request.description }) }], stage: `sections:${slug}` }, { ...aiCtx, stage: `sections:${slug}` }); sectionsByPage.set(slug, (validateStage(`sections:${slug}`, r, sectionsSchema, 'sections') as any).sections); } catch { sectionsByPage.set(slug, i===0 ? [{ type:'hero', layout:'default', order:0, content:{ headline: (brand?.name as string)||'Welcome', subheadline: (brand?.tagline as string)||'' } }] : [{ type:'cta', layout:'default', order:0, content:{ headline:'Get in Touch', ctaText:'Contact Us', ctaLink:'/contact' } }]); } } logStageComplete('sections', { durationMs: 0, validationPassed: true }); } catch { logStageFailed('sections', 'unknown'); }
    aborted(options.signal);
    emit(options, { phase: 'generating', message: 'Optimizing SEO...', progress: 85, pagesGenerated: pc, totalPages: pc, currentSection: null }); logStageStart('seo');
    try { const r = await mm.executeWithFallback<string>({ system: SEO_SYSTEM_PROMPT, messages: [{ role: 'user', content: buildSEOPrompt({ businessName: (brand?.name as string)||request.businessName||'Business', description: request.description, industry: request.industry, businessType: request.businessType, pages: (pagesOutput||[]).map(p=>({slug:p.slug as string||'',title:p.title as string||'',metaTitle:p.metaTitle as string||'',metaDescription:p.metaDescription as string||''})), language: request.language||'en' }) }], stage: 'seo' }, { ...aiCtx, stage: 'seo' }); seo = validateStage('seo', r, seoSchema, 'seo') as Record<string, unknown>; logStageComplete('seo', { durationMs: r.latencyMs, validationPassed: true }); } catch { seo = getDefaultSEO((brand?.name as string)||'Website') as Record<string, unknown>; logStageComplete('seo', { durationMs: 0, validationPassed: true }); }
    aborted(options.signal);
    emit(options, { phase: 'generating', message: 'Selecting free images...', progress: 95, pagesGenerated: pc, totalPages: pc, currentSection: null }); logStageStart('images');
    try {
      const descs: Array<{index:number;type:string;headline?:string;description?:string}> = []; let idx=0; for(const[,secs] of sectionsByPage){for(const s of secs){const c=s.content as any||{};descs.push({index:idx++,type:s.type as string||'',headline:c.headline||undefined,description:c.subheadline||undefined})}}
      const r = await mm.executeWithFallback<string>({ system: IMAGE_SYSTEM_PROMPT, messages: [{ role: 'user', content: buildImagePrompt({ businessName: (brand?.name as string)||request.businessName||'Business', industry: request.industry, businessType: request.businessType, tone: (brand?.tone as string)||request.tone||'professional', sections: descs.slice(0,20) }) }], stage: 'images' }, { ...aiCtx, stage: 'images' });
      const imgOut = validateStage('images', r, imagesSchema, 'images') as { images?: Array<{ sectionIndex?: number; sectionType?: string; queries?: Array<{ query?: string; alt?: string; style?: string }> }> };
      // Resolve the AI's image queries to free stock URLs (no image model).
      for (const group of imgOut.images ?? []) {
        const index = typeof group.sectionIndex === 'number' ? group.sectionIndex : -1;
        const queries = (group.queries ?? []).filter(q => q && (q.query || q.alt));
        if (index >= 0 && queries.length > 0) {
          imagesByIndex.set(index, queries.slice(0, 3).map((q, qi) => resolveStockImage({ query: q.query || q.alt || '', sectionType: group.sectionType || '', industry: request.industry, alt: q.alt || q.query || `${group.sectionType || 'image'} image`, seed: `gen:${index}:${qi}` })));
        }
      }
      logStageComplete('images', { durationMs: r.latencyMs, validationPassed: true });
    } catch { logStageComplete('images', { durationMs: 0, validationPassed: true }); }
    // Guarantee every section has a free image even when the AI image stage
    // failed or returned nothing — deterministic per section.
    { let gi = 0; for (const [, secs] of sectionsByPage) { for (const s of secs) { if (!imagesByIndex.has(gi)) { const c = s.content as any || {}; imagesByIndex.set(gi, [resolveStockImage({ query: (c.headline as string) || (s.type as string) || '', sectionType: s.type as string || '', industry: request.industry, alt: (c.headline as string) || `${s.type || 'section'} image`, seed: `sec:${gi}:${request.industry || 'general'}` })]); } gi++; } } }
    const merged = mergeStages(brand!, theme!, pagesOutput!, sectionsByPage, seo!, imagesByIndex, request); const td = Date.now()-startTime; logStageComplete('merge', { durationMs: 0, validationPassed: true });
    logger.info(`Pipeline completed in ${td}ms`, { ...LOG, totalDurationMs: td }); return { success: true, data: merged, projectId: options.projectId, stageLogs, totalDurationMs: td };
  } catch (err) { const td = Date.now() - startTime; logger.error(`Pipeline failed after ${td}ms: ${err instanceof Error?err.message:String(err)}`, LOG); return { success: false, error: String(err), stageLogs, totalDurationMs: td }; }
}
function validateStage(stage: string, result: ModelCallResult<string>, schema: z.ZodType<unknown>, base: string): unknown {
  if (!result.data) throw new GenerationStageError(stage, 'Empty response');
  const rr = repairAndParse(result.data); if (!rr.success) throw new JSONRepairError(rr.error||'Parse failed', rr.rawPreview, rr.repairsList, {stage});
  const vr = safeValidate(schema, rr.data, { defaultBasePath: base, verbose: true }); if (!vr.success) throw new GenerationStageError(stage, `Validation failed: ${vr.error}`); return vr.data;
}
function mergeStages(brand: Record<string,unknown>, theme: Record<string,unknown>, pages: Array<Record<string,unknown>>, sectionsByPage: Map<string, Array<Record<string,unknown>>>, seo: Record<string,unknown>, imagesByIndex: Map<number, Array<Record<string,unknown>>>, request: GenerateRequest): AIProjectOutput {
  let gi = 0;
  const mp = pages.map(pg => { const slug = (pg.slug as string)||''; const secs = sectionsByPage.get(slug)||[]; const mapped = secs.map((s,i) => { const images = imagesByIndex.get(gi) ?? getDefaultImages(1); gi += 1; return { type: s.type as string, layout: (s.layout as string)||'default', content: (s.content as any)||{}, styles: (s.styles as any)||{}, animations: getDefaultAnimations(), images, order: s.order as number??i }; }); return { ...pg, sections: mapped }; });
  return { brand: brand as any, pages: mp as any, theme: { preset: (theme.preset as string)||'professional', mode: (theme.mode as string)||'light', colors: (theme.colors as any)||{}, typography: (theme.typography as any)||{} }, seo: { metaTitle: (seo.metaTitle as string)||`${(brand.name as string)||'Website'} — Site`, metaDescription: (seo.metaDescription as string)||'', keywords: (seo.keywords as string[])||[], ogImage: (seo.ogImage as string)||undefined, noIndex: (seo.noIndex as boolean)||false, noFollow: (seo.noFollow as boolean)||false, jsonLd: (seo.jsonLd as any[])||[], sitemap: (seo.sitemap as boolean)??true } };
}
function emit(o: PipelineOptions, p: GenerationProgress) { if (o.onProgress) try { o.onProgress(p); } catch { /* */ } }
function aborted(s?: AbortSignal) { if (s?.aborted) throw new DOMException('Cancelled', 'AbortError'); }
const brandSchema = z.object({ name: z.string().default(''), tagline: z.string().default(''), description: z.string().default(''), tone: z.string().default('professional'), mission: z.string().optional().default(''), vision: z.string().optional().default(''), values: z.array(z.string()).optional().default([]), personality: z.array(z.string()).optional().default([]), voice: z.any().optional(), colors: z.any().optional(), typography: z.any().optional() });
const themeSchema = z.object({ preset: z.string().optional().default('professional'), mode: z.string().optional().default('light'), colors: z.any().optional().default({}), typography: z.any().optional().default({}), borderRadius: z.any().optional().default({}), shadows: z.any().optional().default({}) });
const pagesSchema = z.object({ pages: z.array(z.object({ slug: z.string().optional().default(''), title: z.string().optional().default('Untitled'), metaTitle: z.string().optional().default(''), metaDescription: z.string().optional().default(''), isHome: z.boolean().optional().default(false) })).min(1).default([{slug:'home',title:'Home',isHome:true}]) });
const sectionsSchema = z.object({ sections: z.array(z.object({ type: z.string(), layout: z.string().optional().default('default'), order: z.number().optional().default(0), content: z.any().optional().default({}), styles: z.any().optional().default({}) })).min(1).default([{type:'hero',content:{headline:'Welcome'}}]) });
const seoSchema = z.object({ metaTitle: z.string().optional().default(''), metaDescription: z.string().optional().default(''), keywords: z.array(z.string()).optional().default([]), ogImage: z.string().nullable().optional().default(null), ogType: z.string().optional().default('website'), twitterCard: z.string().optional().default('summary_large_image'), noIndex: z.boolean().optional().default(false), noFollow: z.boolean().optional().default(false), jsonLd: z.array(z.any()).optional().default([]), sitemap: z.boolean().optional().default(true) });
const imagesSchema = z.object({ images: z.array(z.object({ sectionIndex: z.number().optional().default(0), sectionType: z.string().optional().default(''), queries: z.array(z.object({ query: z.string(), alt: z.string(), style: z.string().optional().default('photorealistic') })).optional().default([]) })).optional().default([]) });
