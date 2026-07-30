// =============================================================================
// POST /api/projects/[id]/publish
// =============================================================================
// Transition a project to `published`: stamps `publishedAt`, writes a full
// `Version.snapshot`, and invalidates caches. Auth + ownership are enforced by
// `publishProject` (via `getProjectById`), so this handler only authenticates
// the Clerk user and delegates — `errorResponse` translates the centralized
// `NotFoundError` / `ForbiddenError` into 404 / 403.
//
// POST (not PATCH) because publish is a verb-like state transition, not a
// partial field edit (contrast the general PATCH /api/projects/[id] route).
// No request body is required. Idempotent-ish: re-publishing an already-live
// project refreshes `publishedAt` and adds a new snapshot version.
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { ok, errorResponse, unauthorized } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { publishProject } from '@/features/publishing/services/publishing.service';

export const POST = withRequestLogging(
  withRateLimit(
    async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const { id } = await params;
        const result = await publishProject(id, userId);

        return ok(result);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
