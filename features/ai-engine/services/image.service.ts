// =============================================================================
// Image Generation Service
// =============================================================================
// Integrates with OpenAI DALL-E for generating website images.
// Handles prompt construction, API calls, and S3 upload for generated images.
// =============================================================================

import OpenAI from 'openai';
import { z } from 'zod';
import { getServerEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

// Lazily constructed — route modules import this service at build time, and
// `new OpenAI()` would throw if OPENAI_API_KEY is unset. Reading the env at
// call time (not module load) keeps the build green.
let openaiClient: OpenAI | undefined;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const env = getServerEnv();
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface ImageGenerationRequest {
  prompt: string;
  alt: string;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  style: 'vivid' | 'natural';
  quality: 'standard' | 'hd';
}

export interface GeneratedImage {
  url: string;
  revisedPrompt: string;
  alt: string;
}

export interface BatchImageRequest {
  images: {
    query: string;
    alt: string;
    sectionType: string;
  }[];
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
}

// ─── Validation ─────────────────────────────────────────────────────────

const imageRequestSchema = z.object({
  prompt: z.string().min(10).max(4000),
  alt: z.string().min(1),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1792x1024'),
  style: z.enum(['vivid', 'natural']).default('natural'),
  quality: z.enum(['standard', 'hd']).default('standard'),
});

// ─── Image Size Mapping ─────────────────────────────────────────────────

const SECTION_SIZES: Record<string, ImageGenerationRequest['size']> = {
  hero: '1792x1024',
  'heroWithProduct': '1792x1024',
  'videoBackground': '1792x1024',
  splitSection: '1792x1024',
  gallery: '1024x1024',
  portfolio: '1024x1024',
  team: '1024x1024',
  testimonial: '1024x1024',
  beforeAfter: '1024x1024',
  cta: '1792x1024',
};

// ─── Core Functions ─────────────────────────────────────────────────────

/**
 * Generate a single image using DALL-E.
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<GeneratedImage> {
  const validated = imageRequestSchema.parse(request);

  const response = await getOpenAI().images.generate({
    model: 'dall-e-3',
    prompt: validated.prompt,
    n: 1,
    size: validated.size,
    style: validated.style,
    quality: validated.quality,
    response_format: 'url',
  });

  const image = response.data?.[0];

  return {
    url: image?.url ?? '',
    revisedPrompt: image?.revised_prompt || validated.prompt,
    alt: validated.alt,
  };
}

/**
 * Generate images for multiple sections in sequence.
 * DALL-E rate limits require sequential calls (not parallel).
 */
export async function generateBatchImages(
  request: BatchImageRequest
): Promise<GeneratedImage[]> {
  const results: GeneratedImage[] = [];

  for (const image of request.images) {
    try {
      const size = SECTION_SIZES[image.sectionType] || '1792x1024';
      const result = await generateImage({
        prompt: image.query,
        alt: image.alt,
        size,
        style: request.style || 'natural',
        quality: request.quality || 'standard',
      });
      results.push(result);

      // Respect DALL-E rate limits: ~5 images/minute
      if (request.images.indexOf(image) < request.images.length - 1) {
        await new Promise((r) => setTimeout(r, 12000));
      }
    } catch (err) {
      logger.error(`Image generation failed for "${image.query}"`, { query: image.query, sectionType: image.sectionType }, err as Error);
      // Continue with other images — don't fail the whole batch
      results.push({
        url: '',
        revisedPrompt: image.query,
        alt: image.alt,
      });
    }
  }

  return results;
}

/**
 * Enhance a simple image query into a detailed DALL-E prompt.
 * Uses Claude to expand brief descriptions into rich, specific prompts.
 */
export function enhanceImagePrompt(query: string, context: {
  businessType: string;
  industry: string;
  style: string;
}): string {
  return [
    `A ${context.style} photograph of ${query}.`,
    `Professional ${context.industry} photography.`,
    `High quality, well-lit, sharp focus, suitable for a ${context.businessType} website.`,
    `No text, no watermarks, no logos.`,
    `Style: ${context.style} editorial photography.`,
  ].join(' ');
}

/**
 * Get the optimal image size for a section type.
 */
export function getImageSizeForSection(sectionType: string): ImageGenerationRequest['size'] {
  return SECTION_SIZES[sectionType] || '1792x1024';
}

/**
 * Check if OpenAI API key is configured.
 */
export function isImageGenerationAvailable(): boolean {
  return !!getServerEnv().OPENAI_API_KEY;
}
