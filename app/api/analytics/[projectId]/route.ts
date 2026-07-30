// =============================================================================
// GET /api/analytics/[projectId]
// =============================================================================
// Returns analytics dashboard data for a project. Verifies project ownership
// before returning data. Uses placeholder data from the analytics service
// until real analytics tracking is wired in.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import prisma from '@/lib/prisma/client';
import { getProjectById } from '@/features/projects/services/project.service';
import { getProjectAnalytics } from '@/features/analytics/services/analytics.service';
import { ok, errorResponse, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
});

export const GET = withRequestLogging(
  withRateLimit(
    async (
      _request: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        // Resolve Clerk userId → DB User.id
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (!dbUser) return unauthorized();

        const { projectId } = await params as { projectId: string };

        // Verify project ownership
        const project = await getProjectById(projectId, dbUser.id);
        if (!project) return notFound('Project');
        if (project.ownerId !== dbUser.id) return forbidden('You do not own this project');

        // Parse query params
        const { searchParams } = new URL(_request.url);
        const { period } = querySchema.parse({ period: searchParams.get('period') });

        const analytics = await getProjectAnalytics(projectId, period);

        return ok(analytics);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return badRequest('Invalid query parameters');
        }
        return errorResponse(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    { tier: 'free' }
  )
);
