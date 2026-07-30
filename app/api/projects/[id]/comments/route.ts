// =============================================================================
// GET/POST /api/projects/[id]/comments
// =============================================================================
// List and create comments on a project.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ok, unauthorized, errorResponse } from '@/lib/api-response';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import {
  listComments,
  createComment,
} from '@/features/collaboration/services/collaboration.service';
import { z } from 'zod';

const createCommentSchema = z.object({
  sectionId: z.string().optional(),
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

// ─── GET ────────────────────────────────────────────────────────────────

const GETHandler = withRequestLogging(
  withRateLimit(
    async (
      request: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const { id: projectId } = await params;
        const sectionId = request.nextUrl.searchParams.get('sectionId') || undefined;

        const comments = await listComments(projectId, userId, sectionId);
        return ok(comments);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);

// ─── POST ───────────────────────────────────────────────────────────────

const POSTHandler = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request, { body, params }) => {
        try {
          const { userId } = await auth();
          if (!userId) return unauthorized();

          const typedBody = body as { sectionId?: string; content: string; parentId?: string };
          const projectId = params.id;
          const comment = await createComment({
            projectId,
            sectionId: typedBody.sectionId,
            authorId: userId,
            content: typedBody.content,
            parentId: typedBody.parentId,
          });

          return ok(comment, 201);
        } catch (error) {
          return errorResponse(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { body: createCommentSchema }
    ),
    { tier: 'free' }
  )
);

export { GETHandler as GET, POSTHandler as POST };
