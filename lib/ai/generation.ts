// =============================================================================
// AI Generation Pipeline
// =============================================================================
// Orchestrates the full website generation flow: prompt building → Claude API →
// structured output → Zod validation → normalization → database storage.
//
// CRITICAL: Accepts separate clerkUserId (for OpenRouter API calls / rate-limit
// keys) and dbUserId (the User.id cuid from the database). NEVER use the Clerk
// user_xxx string as ownerId or userId in Prisma queries — every FK references
// User.id (cuid).
// =============================================================================

import { createStructuredCompletion } from './client';
import { buildGenerationPrompt, GENERATION_SYSTEM_PROMPT } from '@/features/ai-engine/prompts';
import { createProject } from '@/features/projects/services/project.service';
import { transformAIOutput } from '@/features/json-engine/services/json-transformer';
import { getDefaultTheme, getDefaultSEO, getDefaultProjectSettings } from '@/features/json-engine/services/project-defaults';
import prisma from '@/lib/prisma/client';
import { AIGenerationError, AITokenLimitError, AITimeoutError, AIResponseParseError, NotFoundError } from '@/lib/errors';
import { AI_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { deepLog } from '@/lib/ai/normalizer';
import type { GenerateRequest } from '@/types';
import type { GenerationProgress, AIGenerationResult, AIProjectOutput } from '@/features/ai-engine/types';

interface GenerationCallbacks {
  onProgress: (progress: GenerationProgress) => void;
  onComplete: (result: AIGenerationResult) => void;
  onError: (message: string) => void;
}

const LOG = { service: 'generateWithClaude' } as const;

/**
 * Main generation function. Generates a complete website from a description.
 *
 * @param request  - Validated generation request (may include projectId for existing projects)
 * @param _clerkUserId - Clerk user_xxx string (for API call context / rate-limit keys only)
 * @param dbUserId  - Database User.id (cuid) — used for all Prisma writes
 */
export async function generateWithClaude(
  request: GenerateRequest,
  _clerkUserId: string,
  dbUserId: string,
  callbacks: GenerationCallbacks
): Promise<void> {
  const totalPages = request.pages?.length || 5;

  try {
    // ── Phase 1: Analyzing ──────────────────────────────────────────
    logger.info('Phase 1: Analyzing business description...');
    callbacks.onProgress({
      phase: 'analyzing',
      message: 'Analyzing your business description...',
      progress: 10,
      pagesGenerated: 0,
      totalPages,
      currentSection: null,
    });

    const prompt = buildGenerationPrompt(request);

    // ── Phase 2: Planning ───────────────────────────────────────────
    logger.info('Phase 2: Planning website structure...');
    callbacks.onProgress({
      phase: 'planning',
      message: 'Planning website structure...',
      progress: 20,
      pagesGenerated: 0,
      totalPages,
      currentSection: null,
    });

    // ── Phase 3: Generating (AI Provider) ──────────────────────────
    logger.info('Phase 3: Calling AI provider...');
    callbacks.onProgress({
      phase: 'generating',
      message: 'Generating website content with AI...',
      progress: 30,
      pagesGenerated: 0,
      totalPages,
      currentSection: 'hero',
    });

    const completionParams = {
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user' as const, content: prompt }],
      schema: {
        type: 'object',
        description: 'Complete website generation result',
        properties: {
          brand: {
            type: 'object',
            description: 'Brand information',
            properties: {
              name: { type: 'string', description: 'Business name' },
              tagline: { type: 'string', description: 'Brand tagline' },
              description: { type: 'string', description: 'Brand description' },
              tone: { type: 'string', description: 'Brand tone' },
            },
          },
          pages: {
            type: 'array',
            description: 'Generated pages',
            items: {
              type: 'object',
              properties: {
                slug: { type: 'string' },
                title: { type: 'string' },
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
                isHome: { type: 'boolean' },
                sections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      layout: { type: 'string' },
                      content: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
          theme: {
            type: 'object',
            description: 'Theme configuration',
            properties: {
              preset: { type: 'string' },
              colors: { type: 'object' },
              typography: { type: 'object' },
            },
          },
        },
      },
    };

    // Attempt generation with fallback support
    // Fallback to different models on OpenRouter when primary fails.
    // Each fallback uses a completely different provider infra for redundancy.
    // Fallback models: read from env, never hardcoded.
    // OPENROUTER_FALLBACK_MODELS="openai/gpt-4o-mini,google/gemini-2.0-flash-001"
    const FALLBACK_MODELS = (process.env.OPENROUTER_FALLBACK_MODELS || '')
      .split(',')
      .map((m: string) => m.trim())
      .filter(Boolean);
    let rawResult!: AIProjectOutput;
    let lastError: Error | null = null;

    try {
      rawResult = await createStructuredCompletion<AIProjectOutput>(completionParams);
      logger.info('Phase 3 OK: AI provider returned structured output (model=' + (await import('./providers')).getAIProviderConfig().model + ')');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const { classifyProviderError } = await import('./errors');
      const classified = classifyProviderError(lastError);

      logger.warn('Phase 3 primary model failed: ' + classified.type + ' - ' + classified.message);

      // Retry with fallback models for retryable errors
      if (classified.retryable) {
        const { getAIProviderConfig } = await import('./providers');
        const config = getAIProviderConfig();
        let fallbackSucceeded = false;

        for (const fallbackModel of FALLBACK_MODELS) {
          logger.info('Phase 3: Trying fallback model: ' + fallbackModel);
          callbacks.onProgress({
            phase: 'generating',
            message: 'Retrying with ' + fallbackModel.split('/').pop() + '...',
            progress: 35,
            pagesGenerated: 0,
            totalPages,
            currentSection: 'hero',
          });

          try {
            const { createProviderWithConfig } = await import('./providers');
            const fallbackConfig = { ...config, model: fallbackModel };
            const fallbackProvider = await createProviderWithConfig(fallbackConfig, 'openrouter');
            rawResult = await fallbackProvider.createStructuredCompletion<AIProjectOutput>(completionParams);
            logger.info('Phase 3 OK: Fallback model succeeded (model=' + fallbackModel + ')');
            fallbackSucceeded = true;
            break;
          } catch (fallbackErr) {
            const fbErr = fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr));
            logger.error('Phase 3: Fallback model ' + fallbackModel + ' failed: ' + fbErr.message);
            lastError = fbErr;
          }
        }

        if (!fallbackSucceeded) {
          throw lastError || new Error('All OpenRouter models failed');
        }
      } else {
        throw lastError;
      }
    }

    // ── Phase 4: Validating + Normalizing ───────────────────────────
    logger.info('Phase 4: Validating and normalizing AI output...');
    callbacks.onProgress({
      phase: 'generating',
      message: 'Validating and normalizing content...',
      progress: 65,
      pagesGenerated: totalPages,
      totalPages,
      currentSection: null,
    });

    const rawRecord = rawResult as unknown as Record<string, unknown>;
    const transformResult = transformAIOutput(rawRecord);

    if (!transformResult.success || !transformResult.data) {
      // Log full details for debugging — never truncate, never "[object Object]"
      const errorMessages = transformResult.errors.map((e) => e.message).join('; ');
      logger.error('Phase 4 FAILED: ' + errorMessages, LOG);

      // Deep-log the full parsed object and all validation errors
      deepLog('Raw AI output that failed validation', rawRecord);
      deepLog('Validation errors', transformResult.errors);

      throw new AIResponseParseError(
        `AI output validation failed: ${errorMessages}`,
        { validationErrors: transformResult.errors }
      );
    }

    const normalized = transformResult.data;
    logger.info('Phase 4 OK: Normalized ' + (normalized.pages?.length ?? 0) + ' pages', LOG);

    // ── Phase 5: Assembling (Theme + SEO defaults) ──────────────────
    logger.info('Phase 5: Assembling theme and SEO defaults...');
    callbacks.onProgress({
      phase: 'generating',
      message: 'Assembling your website...',
      progress: 75,
      pagesGenerated: totalPages,
      totalPages,
      currentSection: null,
    });

    const theme = getDefaultTheme(
      normalized.theme?.preset as string || 'modern',
      normalized.brand.colors as { primary: string; secondary: string; accent: string } | undefined
    );

    const seo = getDefaultSEO({
      title: normalized.brand.name,
      slug: normalized.pages[0]?.slug || 'home',
      brandName: normalized.brand.name,
    });

    // ── Phase 6: Saving to database ─────────────────────────────────
    logger.info('Phase 6: Saving to database (dbUserId=' + dbUserId + ')...', LOG);
    callbacks.onProgress({
      phase: 'refining',
      message: 'Saving your website...',
      progress: 85,
      pagesGenerated: totalPages,
      totalPages,
      currentSection: null,
    });

    const projectSettings = getDefaultProjectSettings();

    // Use existing project if projectId was provided (avoids duplicate project
    // creation + Clerk-ID-vs-DB-ID bugs). Otherwise create a new project.
    let project: { id: string; name: string; slug: string };
    if (request.projectId) {
      logger.info('Phase 6: Using existing project projectId=' + request.projectId, LOG);
      const existing = await prisma.project.findUnique({
        where: { id: request.projectId },
        select: { id: true, name: true, slug: true, ownerId: true },
      });
      if (!existing) {
        throw new NotFoundError('Project', request.projectId);
      }
      project = existing;
      // Update the existing project's name, theme, SEO, and settings
      await prisma.project.update({
        where: { id: project.id },
        data: {
          name: request.businessName || normalized.brand.name || project.name,
          description: request.description,
          industry: request.industry,
          settings: projectSettings as any,
          globalStyles: theme as any,
          seo: seo as any,
        },
      });
      logger.info('Phase 6: Existing project updated projectId=' + project.id, LOG);
    } else {
      logger.info('Phase 6: Creating new project with ownerId=' + dbUserId + ' (DB user ID)', LOG);
      project = await createProject({
        name: request.businessName || normalized.brand.name || 'My Website',
        description: request.description,
        industry: request.industry,
        businessType: request.businessType,
        ownerId: dbUserId,
      });

      // Save theme and SEO to project settings
      await prisma.project.update({
        where: { id: project.id },
        data: {
          settings: projectSettings as any,
          globalStyles: theme as any,
          seo: seo as any,
        },
      });
      logger.info('Phase 6: New project created projectId=' + project.id + ' slug=' + project.slug, LOG);
    }

    // Save pages and sections
    for (let i = 0; i < normalized.pages.length; i++) {
      const aiPage = normalized.pages[i];

      callbacks.onProgress({
        phase: 'refining',
        message: `Saving ${aiPage.title}...`,
        progress: 85 + Math.round((i / normalized.pages.length) * 10),
        pagesGenerated: i + 1,
        totalPages,
        currentSection: null,
      });

      const page = await prisma.page.create({
        data: {
          projectId: project.id,
          slug: aiPage.slug,
          title: aiPage.title,
          metaTitle: aiPage.metaTitle,
          metaDescription: aiPage.metaDescription,
          isHome: aiPage.isHome,
          order: i,
        },
      });

      for (let j = 0; j < aiPage.sections.length; j++) {
        const section = aiPage.sections[j];
        await prisma.section.create({
          data: {
            pageId: page.id,
            type: section.type,
            layout: section.layout,
            content: section.content as any,
            styles: (section.styles || {}) as any,
            animations: (section.animations || []) as any,
            images: (section.images || []) as any,
            visibility: section.visibility as any,
            order: j,
          },
        });
      }
    }

    // Log the generation (uses DB user ID for FK compliance)
    logger.info('Phase 6: Creating AIGeneration record with dbUserId=' + dbUserId, LOG);
    await prisma.aIGeneration.create({
      data: {
        userId: dbUserId,
        projectId: project.id,
        prompt: request.description,
        model: AI_CONFIG.model,
        tokensUsed: 0,
        cost: 0,
        duration: 0,
        status: 'success',
        input: request as any,
        output: normalized as any,
      },
    });

    // ── Phase 7: Complete ───────────────────────────────────────────
    logger.info('Phase 7: Generation complete for projectId=' + project.id, LOG);
    callbacks.onProgress({
      phase: 'complete',
      message: 'Your website is ready!',
      progress: 100,
      pagesGenerated: totalPages,
      totalPages,
      currentSection: null,
    });

    const generationResult: AIGenerationResult = {
      projectId: project.id,
      pages: normalized.pages.map((p) => ({
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        isHome: p.isHome,
        sections: p.sections.map((s) => ({
          type: s.type,
          layout: s.layout,
          content: s.content,
          styles: s.styles as Record<string, unknown>,
          animations: s.animations as unknown as Record<string, unknown>,
          images: s.images.map((img) => ({
            query: img.placeholder || img.src,
            alt: img.alt,
            position: 0,
          })),
        })),
      })),
      theme,
      colorPalette: theme.colors,
      generatedAt: new Date().toISOString(),
    };

    callbacks.onComplete(generationResult);
  } catch (err) {
    logger.error('Generation pipeline error', LOG, err instanceof Error ? err : undefined);

    // Classify error
    if (err instanceof AIResponseParseError) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.message.includes('token') || err.message.includes('length')) {
        throw new AITokenLimitError();
      }
      if (err.message.includes('timeout')) {
        throw new AITimeoutError();
      }
    }

    throw new AIGenerationError(
      err instanceof Error ? err.message : 'Generation failed'
    );
  }
}
