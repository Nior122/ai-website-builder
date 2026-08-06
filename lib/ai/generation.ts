// =============================================================================
// AI Generation Pipeline — v2 (Entry Point)
// =============================================================================
import { runGenerationPipeline } from './generation-pipeline';
import { createProject, updateProject } from '@/features/projects/services/project.service';
import { transformAIOutput } from '@/features/json-engine/services/json-transformer';
import { getDefaultProjectSettings } from '@/features/json-engine/services/project-defaults';
import { getModelManager } from './model-manager';
import prisma from '@/lib/prisma/client';
import { AIGenerationError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { GenerateRequest, Theme } from '@/types';
import type { GenerationProgress, AIGenerationResult, AIProjectOutput } from '@/features/ai-engine/types';
import { nanoid } from 'nanoid';

const LOG = { service: 'generateWithClaude' } as const;

interface GenerationCallbacks {
  onProgress: (progress: GenerationProgress) => void;
  onComplete: (result: AIGenerationResult) => void;
  onError: (message: string) => void;
}

export async function generateWithClaude(
  request: GenerateRequest,
  clerkUserId: string,
  dbUserId: string,
  callbacks: GenerationCallbacks
): Promise<void> {
  try {
    const totalPages = request.pages?.length || 5;
    callbacks.onProgress({ phase: 'analyzing', message: 'Setting up project...', progress: 5, pagesGenerated: 0, totalPages, currentSection: null });
    let projectId = request.projectId;
    if (!projectId) {
      // createProject seeds settings:{}, globalStyles:{}, seo:{} internally —
      // full default settings (incl. brand) are applied via updateProject below.
      const project = await createProject({ name: request.businessName || `${request.industry} Website`, description: request.description, industry: request.industry, businessType: request.businessType, ownerId: dbUserId });
      projectId = project.id;
      logger.info(`Created project: ${projectId}`, LOG);
    }
    callbacks.onProgress({ phase: 'planning', message: 'Planning website structure...', progress: 8, pagesGenerated: 0, totalPages, currentSection: null });
    const pipelineResult = await runGenerationPipeline(request, { clerkUserId, dbUserId, projectId, onProgress: (progress) => { callbacks.onProgress(progress); } });
    if (!pipelineResult.success || !pipelineResult.data) throw new AIGenerationError(pipelineResult.error || 'Generation pipeline failed', { projectId, ...pipelineResult });
    callbacks.onProgress({ phase: 'generating', message: 'Saving website data...', progress: 98, pagesGenerated: totalPages, totalPages, currentSection: null });
    const transformed = transformAIOutput(pipelineResult.data as unknown as Record<string, unknown>);
    if (!transformed.success) logger.warn(`Transform had ${transformed.errors.length} non-fatal errors`, { ...LOG, errors: transformed.errors.slice(0, 5) });
    await updateProject(projectId, dbUserId, { name: pipelineResult.data.brand.name || request.businessName || `${request.industry} Website`, description: pipelineResult.data.brand.description || request.description, seo: pipelineResult.data.seo, settings: { ...getDefaultProjectSettings(), language: request.language || 'en', brand: pipelineResult.data.brand } });
    const savedPages = await savePagesAndSections(projectId, pipelineResult.data);
    callbacks.onProgress({ phase: 'complete', message: 'Website generated successfully!', progress: 100, pagesGenerated: savedPages.length, totalPages: savedPages.length, currentSection: null });
    callbacks.onComplete({
      projectId,
      pages: savedPages.map(p => ({ slug: p.slug, title: p.title, metaTitle: p.metaTitle || p.title, metaDescription: p.metaDescription || '', isHome: p.isHome, sections: (p.sections || []).map((s: any) => ({ type: s.type, layout: s.layout || 'default', content: s.content || {}, styles: s.styles || {}, animations: s.animations || [], images: s.images || [] })) })),
      theme: (pipelineResult.data.theme || {}) as unknown as Theme,
      colorPalette: (pipelineResult.data.theme as any)?.colors || {},
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown generation error';
    logger.error('Generation failed', LOG, err instanceof Error ? err : undefined);
    callbacks.onError(message);
  }
}

async function savePagesAndSections(projectId: string, data: AIProjectOutput) {
  const savedPages: Array<{ id: string; slug: string; title: string; metaTitle: string; metaDescription: string; isHome: boolean; sections: Array<Record<string, unknown>> }> = [];
  for (let i = 0; i < data.pages.length; i++) {
    const pageData = data.pages[i];
    const pageId = nanoid();
    const page = await prisma.page.create({ data: { id: pageId, projectId, slug: pageData.slug, title: pageData.title, metaTitle: pageData.metaTitle || pageData.title, metaDescription: pageData.metaDescription || '', isHome: pageData.isHome, order: i } });
    const savedSections: Array<Record<string, unknown>> = [];
    for (let j = 0; j < (pageData.sections || []).length; j++) {
      const sectionData = pageData.sections[j];
      const sectionId = nanoid();
      await prisma.section.create({ data: { id: sectionId, pageId, type: sectionData.type, layout: sectionData.layout || 'default', content: (sectionData.content || {}) as any, styles: (sectionData.styles || {}) as any, animations: (sectionData.animations || []) as any, images: (sectionData.images || []) as any, order: j } });
      savedSections.push({ id: sectionId, type: sectionData.type, layout: sectionData.layout, content: sectionData.content, styles: sectionData.styles, animations: sectionData.animations, images: sectionData.images });
    }
    savedPages.push({ id: pageId, slug: page.slug, title: page.title, metaTitle: page.metaTitle || page.title, metaDescription: page.metaDescription || '', isHome: page.isHome, sections: savedSections });
  }
  return savedPages;
}
