// =============================================================================
// POST /api/ai/refine
// =============================================================================
// Refine a single section using AI. Accepts the current section content
// and user instructions, returns refined content.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { refineSectionRequestSchema } from '@/lib/validations/ai';
import { createStructuredCompletion } from '@/lib/ai/client';
import { checkRateLimit, getAIRateLimitConfig } from '@/lib/redis/rate-limit';
import { ok, errorResponse, unauthorized, tooManyRequests, notFound } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { withRequestLogging } from '@/lib/middleware/request-logger';

const REFINE_SYSTEM_PROMPT = `You are a professional web content editor. You refine and improve website section content based on user instructions.

Rules:
1. Output ONLY valid JSON matching the same structure as the input
2. Maintain the section type and layout — only change content
3. Keep improvements focused on the user's instructions
4. Ensure content remains professional and engaging
5. Preserve all existing data unless instructed to change it`;

export const POST = withRequestLogging(async (request: NextRequest) => {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      `ai:refine:${userId}`,
      getAIRateLimitConfig('pro')
    );
    if (!rateLimitResult.allowed) {
      return tooManyRequests(rateLimitResult.retryAfterMs);
    }

    const body = await request.json();
    const { projectId, sectionId, instruction } = refineSectionRequestSchema.parse(body);

    // Fetch current section content from DB
    const { prisma } = await import('@/lib/prisma');
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) return notFound('Section');

    const currentContent = (section.content as Record<string, unknown>) || {};
    const sectionType = section.type;

    const result = await createStructuredCompletion<Record<string, unknown>>({
      system: REFINE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Refine this ${sectionType} section.\n\nCurrent content:\n${JSON.stringify(currentContent, null, 2)}\n\nInstructions: ${instruction}\n\nReturn the refined content as JSON matching the same structure.`,
        },
      ],
      schema: {
        type: 'object',
        description: `Refined ${sectionType} section content`,
        properties: Object.fromEntries(
          Object.keys(currentContent).map((key) => [key, { type: 'string', description: `Refined ${key}` }])
        ),
      },
    });

    return ok({
      content: result,
      refinedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(ValidationError.fromZodError(err));
    }
    return errorResponse(err instanceof Error ? err : new Error(String(err)));
  }
});
