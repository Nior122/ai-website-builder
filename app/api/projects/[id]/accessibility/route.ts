// =============================================================================
// GET /api/projects/[id]/accessibility
// =============================================================================
// Run a WCAG-oriented accessibility audit on a project's JSON structure.
// Returns issues, suggestions, scores, and per-category pass/fail summaries.
// =============================================================================

import { type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProjectById } from '@/features/projects/services/project.service';
import { auditAccessibility } from '@/features/accessibility/services/accessibility.service';
import { ok, errorResponse, unauthorized, notFound } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (
      _request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const { id } = await params;
        const project = await getProjectById(id, userId);
        if (!project) return notFound('Project');

        const result = auditAccessibility(project as never);

        return ok(result);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
