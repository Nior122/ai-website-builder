// =============================================================================
// PATCH /api/projects/[id]/sections/[sectionId]
// =============================================================================
// Update a specific section within a project.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma/client';
import { cacheDelete, cacheKeys } from '@/lib/redis/cache';
import { ok, errorResponse, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { updateSectionSchema } from '@/lib/validations';

export const PATCH = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request, { body }) => {
        try {
          const { userId } = await auth();
          if (!userId) return unauthorized();

          // Resolve Clerk userId → DB User.id
          const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
          });
          if (!dbUser) return unauthorized();

          const segments = request.nextUrl.pathname.split('/');
          const projectId = segments.at(-3)!;
          const sectionId = segments.at(-1)!;

          // Verify ownership
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true },
          });

          if (!project || project.ownerId !== dbUser.id) {
            return notFound('Project');
          }

          // Verify section exists within project
          const section = await prisma.section.findFirst({
            where: {
              id: sectionId,
              page: { projectId },
            },
          });

          if (!section) {
            return notFound('Section');
          }

          // Filter out undefined values
          const updateData: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
            if (value !== undefined) {
              updateData[key] = value;
            }
          }

          if (Object.keys(updateData).length === 0) {
            return badRequest('No valid fields provided');
          }

          const updated = await prisma.section.update({
            where: { id: sectionId },
            data: updateData,
          });

          // Invalidate project cache
          await cacheDelete(cacheKeys.project(projectId));

          return ok(updated);
        } catch (error) {
          return errorResponse(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { body: updateSectionSchema }
    ),
    { tier: 'free' }
  )
);

export const DELETE = withRequestLogging(
  withRateLimit(
    async (
      request: NextRequest,
      { params }: { params: Promise<{ id: string; sectionId: string }> }
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

        const { id, sectionId } = await params;

        // Verify ownership
        const project = await prisma.project.findUnique({
          where: { id },
          select: { ownerId: true },
        });

        if (!project || project.ownerId !== dbUser.id) {
          return notFound('Project');
        }

        await prisma.section.delete({
          where: { id: sectionId },
        });

        await cacheDelete(cacheKeys.project(id));

        return new NextResponse(null, { status: 204 });
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
