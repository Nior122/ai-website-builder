// =============================================================================
// PATCH/DELETE /api/projects/[id]/comments/[commentId]
// =============================================================================
// Update, delete, or resolve a comment.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ok, unauthorized, errorResponse, badRequest } from '@/lib/api-response';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import {
  updateComment,
  deleteComment,
  resolveComment,
} from '@/features/collaboration/services/collaboration.service';
import { z } from 'zod';

const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  resolved: z.boolean().optional(),
});

// ─── PATCH ──────────────────────────────────────────────────────────────

const PATCHHandler = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request, { body, params }) => {
        try {
          const { userId } = await auth();
          if (!userId) return unauthorized();

          const typedBody = body as { content?: string; resolved?: boolean };
          const commentId = params.commentId;

          // Resolve/unresolve
          if (typeof typedBody.resolved === 'boolean') {
            const updated = await resolveComment(commentId, userId, typedBody.resolved);
            return ok(updated);
          }

          // Update content
          if (typedBody.content) {
            const updated = await updateComment(commentId, userId, typedBody.content);
            return ok(updated);
          }

          return badRequest('No valid update fields provided');
        } catch (error) {
          return errorResponse(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { body: updateCommentSchema }
    ),
    { tier: 'free' }
  )
);

// ─── DELETE ─────────────────────────────────────────────────────────────

const DELETEHandler = withRequestLogging(
  withRateLimit(
    async (
      _request: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const { commentId } = await params;
        await deleteComment(commentId, userId);
        return ok({ deleted: true });
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);

export { PATCHHandler as PATCH, DELETEHandler as DELETE };
