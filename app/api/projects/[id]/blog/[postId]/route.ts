// =============================================================================
// GET/PATCH/DELETE /api/projects/[id]/blog/[postId]
// =============================================================================
// Get, update, or delete a blog post.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ok, unauthorized, errorResponse } from '@/lib/api-response';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import {
  getBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '@/features/blog/services/blog.service';
import { z } from 'zod';

const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

// ─── GET ────────────────────────────────────────────────────────────────

const GETHandler = withRequestLogging(
  withRateLimit(
    async (
      _request: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const { postId, id } = await params;
        const post = await getBlogPost(postId, id, userId);
        return ok(post);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);

// ─── PATCH ──────────────────────────────────────────────────────────────

const PATCHHandler = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request, { body, params }) => {
        try {
          const { userId } = await auth();
          if (!userId) return unauthorized();

          const post = await updateBlogPost(params.postId, body as any, params.id, userId);
          return ok(post);
        } catch (error) {
          return errorResponse(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { body: updateBlogPostSchema }
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

        const { postId, id } = await params;
        await deleteBlogPost(postId, id, userId);
        return ok({ deleted: true });
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);

export { GETHandler as GET, PATCHHandler as PATCH, DELETEHandler as DELETE };
