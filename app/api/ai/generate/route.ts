// =============================================================================
// POST /api/ai/generate
// =============================================================================
// Initiates AI website generation with streaming progress via SSE.
// This is the core endpoint that powers the AI generation pipeline.
//
// CRITICAL: Resolves Clerk userId to DB User.id before any service calls.
// All Prisma models (Project, AIGeneration, Notification, etc.) reference
// User.id (DB cuid) — NOT User.clerkId (the Clerk user_xxx string).
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { generateRequestSchema } from '@/lib/validations/ai';
import { createEventStream } from '@/lib/ai/streaming';
import { checkRateLimit, getAIRateLimitConfig } from '@/lib/redis/rate-limit';
import { ok, errorResponse, unauthorized, tooManyRequests } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { generateWithClaude } from '@/lib/ai/generation';
import { checkSubscription } from '@/features/billing/services/subscription.service';
import { createNotification } from '@/features/notifications/services/notification.service';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import prisma from '@/lib/prisma/client';
import { logger } from '@/lib/logger';

const LOG = { route: 'POST /api/ai/generate' } as const;

/**
 * Resolve a Clerk user ID (user_xxx) to the database User.id (cuid).
 * Throws if the user doesn't exist in the database.
 */
async function resolveDbUserId(clerkUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`Database user record not found for Clerk user ${clerkUserId}`);
  }
  return user.id;
}

export const POST = withRequestLogging(async (request: NextRequest) => {
  try {
    // ── Step 1: Auth ──────────────────────────────────────────────
    logger.info('Step 1: Authenticating...', LOG);
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Step 1 FAILED: No userId from auth()', LOG);
      return unauthorized();
    }
    logger.info('Step 1 OK: clerkUserId=' + userId, LOG);

    // ── Step 2: Resolve DB User ID ───────────────────────────────
    logger.info('Step 2: Resolving database user ID...', LOG);
    const dbUserId = await resolveDbUserId(userId);
    logger.info('Step 2 OK: dbUserId=' + dbUserId, LOG);

    // ── Step 3: Rate limiting ─────────────────────────────────────
    logger.info('Step 3: Checking rate limit...', LOG);
    const rateLimitResult = await checkRateLimit(
      `ai:generate:${userId}`,
      getAIRateLimitConfig('pro')
    );
    if (!rateLimitResult.allowed) {
      logger.warn('Step 3 FAILED: Rate limit exceeded', LOG);
      return tooManyRequests(rateLimitResult.retryAfterMs);
    }
    logger.info('Step 3 OK: Rate limit passed', LOG);

    // ── Step 4: Subscription check ────────────────────────────────
    // Uses DB user ID so subscription.findFirst finds the right record.
    logger.info('Step 4: Checking subscription...', LOG);
    await checkSubscription(dbUserId);
    logger.info('Step 4 OK: Subscription valid', LOG);

    // ── Step 5: Validate request ──────────────────────────────────
    logger.info('Step 5: Validating request body...', LOG);
    const body = await request.json();
    const validatedRequest = generateRequestSchema.parse(body);
    logger.info(
      'Step 5 OK: projectId=' + validatedRequest.projectId + ' description=' + validatedRequest.description?.slice(0, 50) + ' industry=' + validatedRequest.industry,
      LOG,
    );

    // ── Step 6: Create SSE stream & start generation ──────────────
    logger.info('Step 6: Starting generation pipeline...', LOG);
    const { stream, send, complete, error } = createEventStream();

    // Run generation in background, streaming progress
    (async () => {
      try {
        logger.info('Generation: calling generateWithClaude (dbUserId=' + dbUserId + ')', LOG);
        await generateWithClaude(validatedRequest, userId, dbUserId, {
          onProgress: (progress) => {
            logger.debug('Progress: ' + progress.progress + '% - ' + progress.phase, LOG);
            send('progress', progress);
          },
          onComplete: (result) => {
            logger.info('Generation complete: projectId=' + result.projectId, LOG);
            complete();
            // Notify the user that generation finished — uses DB user ID
            createNotification({
              userId: dbUserId,
              type: 'generation_complete',
              title: 'Website Generated',
              message: `Your "${validatedRequest.description?.slice(0, 50) || 'website'}" is ready to edit.`,
              data: { projectId: result.projectId },
              actionUrl: `/editor/${result.projectId}`,
            });
          },
          onError: (msg) => {
            logger.error('Generation failed: ' + msg, LOG);
            error(msg || 'Generation failed');
          },
        });
      } catch (err) {
        logger.error('Generation threw unexpected error:', LOG, err as Error);
        error(err instanceof Error ? err.message : 'Unknown generation error');
      }
    })();

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    logger.error('Handler error:', LOG, err as Error);
    if (err instanceof z.ZodError) {
      return errorResponse(ValidationError.fromZodError(err));
    }
    return errorResponse(err instanceof Error ? err : new Error(String(err)));
  }
});
