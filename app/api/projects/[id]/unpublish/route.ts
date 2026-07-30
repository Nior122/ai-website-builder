// =============================================================================
// POST /api/projects/[id]/unpublish
// =============================================================================
// Transition a project back to `draft` so it is no longer reachable at
// `/site/<slug>`. `publishedAt` and existing `Version` snapshots are retained
// as historical record. Auth + ownership are enforced inside
// `unpublishProject` (via `getProjectById`); this handler authenticates the
// Clerk user and delegates, letting `errorResponse` map the centralized errors
// to 404 / 403. POST (not PATCH) mirrors the sibling `publish` route — it's a
// state transition, not a field edit.
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { ok, errorResponse, unauthorized } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { unpublishProject } from '@/features/publishing/services/publishing.service';

export const POST = withRequestLogging(
  withRateLimit(
    async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const { id } = await params;
        const result = await unpublishProject(id, userId);

        return ok(result);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
