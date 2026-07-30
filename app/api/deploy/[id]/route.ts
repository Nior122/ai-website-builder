// =============================================================================
// GET /api/deploy/[id]
// =============================================================================
// Get deployment status.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma/client';
import { ok, errorResponse, unauthorized, notFound } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (
      request: NextRequest,
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

        const { id } = await params as { id: string };

        const deployment = await prisma.deployment.findUnique({
          where: { id },
          include: {
            project: {
              select: { ownerId: true, name: true, slug: true },
            },
          },
        });

        if (!deployment || deployment.project.ownerId !== dbUser.id) {
          return notFound('Deployment');
        }

        return ok(deployment);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
