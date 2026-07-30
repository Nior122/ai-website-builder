// =============================================================================
// GET/POST /api/projects/[id]/blog
// =============================================================================
// List and create blog posts for a project.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ok, unauthorized, errorResponse } from '@/lib/api-response';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import {
  listBlogPosts,
  generateBlogPost,
} from '@/features/blog/services/blog.service';
import { z } from 'zod';

const listBlogPostsSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const generateBlogPostSchema = z.object({
  topic: z.string().min(1).max(200),
  tone: z.string().min(1).max(50).default('professional'),
  wordCount: z.number().int().min(300).max(5000).default(800),
  keywords: z.array(z.string()).default([]),
  includeImages: z.boolean().default(false),
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

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const query = {
          projectId,
          userId,
          status: searchParams.get('status') as 'draft' | 'published' | undefined,
          page: parseInt(searchParams.get('page') || '1'),
          limit: parseInt(searchParams.get('limit') || '20'),
        };

        const result = await listBlogPosts(query);
        return ok(result);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);

// ─── POST (generate with AI) ───────────────────────────────────────────

const POSTHandler = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request, { body, params }) => {
        try {
          const { userId } = await auth();
          if (!userId) return unauthorized();

          const projectId = params.id;
          const post = await generateBlogPost(body as any, projectId, userId);
          return ok(post, 201);
        } catch (error) {
          return errorResponse(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { body: generateBlogPostSchema }
    ),
    { tier: 'free' }
  )
);

export { GETHandler as GET, POSTHandler as POST };
