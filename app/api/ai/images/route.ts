// =============================================================================
// POST /api/ai/images
// =============================================================================
// Generate images using DALL-E for a project's sections.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { imagePromptRequestSchema } from '@/lib/validations/ai';
import { ok, errorResponse, unauthorized, internalError } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import OpenAI from 'openai';

// Lazily constructed to keep the build green when OPENAI_API_KEY is unset.
let openaiClient: OpenAI | undefined;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export const POST = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();

      const body = await request.json();
      const parsed = imagePromptRequestSchema.parse(body);
      const prompt = `Professional ${parsed.style} image for a ${parsed.industry} ${parsed.businessType} business${parsed.subjects?.length ? ` featuring ${parsed.subjects.join(', ')}` : ''}`;
      const { width, height } = parsed.dimensions;
      const sizeStr = `${width}x${height}` as '1024x1024' | '1792x1024' | '1024x1792';

      const response = await getOpenAI().images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: sizeStr,
        quality: 'hd',
        style: 'natural',
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        return internalError('No image was generated');
      }

      return ok({
        url: imageUrl,
        revisedPrompt: response.data?.[0]?.revised_prompt,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return errorResponse(ValidationError.fromZodError(err));
      }
      return errorResponse(err instanceof Error ? err : new Error(String(err)));
    }
  },
  { tier: 'pro' }
  )
);
