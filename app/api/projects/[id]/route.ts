// =============================================================================
// PATCH/DELETE /api/projects/[id]
// =============================================================================
// PATCH: Update project-level fields: name, description, globalStyles, seo, settings.
// DELETE: Delete a project and all its child records (pages, sections, etc.).
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma/client';
import { cacheDelete, cacheKeys } from '@/lib/redis/cache';
import { ok, errorResponse, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { withValidation } from '@/lib/middleware/validate';
import { projectUpdateSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

const LOG = { route: 'PATCH/DELETE /api/projects/[id]' } as const;

async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  return dbUser;
}

async function getProjectOwner(projectId: string, ownerId: string) {
  return prisma.project.findUnique({
    where: { id: projectId, ownerId },
    select: { slug: true, ownerId: true },
  });
}

export const PATCH = withRequestLogging(
  withRateLimit(
    withValidation(
      async (request: NextRequest, context: any): Promise<NextResponse<unknown>> => {
        try {
          const dbUser = await getAuthUser();
          if (!dbUser) return unauthorized();

          const projectId = request.nextUrl.pathname.split('/').at(-1)!;
          const project = await getProjectOwner(projectId, dbUser.id);
          if (!project) return notFound('Project');

          const updateData: Record<string, unknown> = {};
          for (const [key, value] of Object.entries((context.body || {}) as Record<string, unknown>)) {
            if (value !== undefined) updateData[key] = value;
          }

          if (Object.keys(updateData).length === 0) {
            return badRequest('No valid fields provided for update');
          }

          const updated = await prisma.project.update({
            where: { id: projectId },
            data: updateData as any,
          });

          await cacheDelete(cacheKeys.project(projectId));
          await cacheDelete(cacheKeys.projectBySlug(updated.slug));

          return ok(updated);
        } catch (error) {
          return errorResponse(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { body: projectUpdateSchema }
    ),
    { tier: 'free' }
  )
);

// ─── DELETE — delete project and all related data ─────────────────────────

export const DELETE = withRequestLogging(
  withRateLimit(
    async (request: NextRequest): Promise<NextResponse<unknown>> => {
      try {
        const dbUser = await getAuthUser();
        if (!dbUser) return unauthorized();

        const projectId = request.nextUrl.pathname.split('/').at(-1)!;
        const project = await getProjectOwner(projectId, dbUser.id);
        if (!project) return notFound('Project');

        logger.info('Deleting project: ' + projectId + ' (slug=' + project.slug + ')', LOG);

        // Cascade delete: sections → pages → aiGeneration → project
        // Get all pages for this project first
        const pages = await prisma.page.findMany({
          where: { projectId },
          select: { id: true },
        });
        const pageIds = pages.map(p => p.id);

        // Delete sections (all pages)
        if (pageIds.length > 0) {
          await prisma.section.deleteMany({
            where: { pageId: { in: pageIds } },
          });
        }

        // Delete pages
        await prisma.page.deleteMany({
          where: { projectId },
        });

        // Delete AI generation records
        await prisma.aIGeneration.deleteMany({
          where: { projectId },
        });

        // Delete comments
        await prisma.comment.deleteMany({
          where: { projectId },
        });

        // Delete the project itself
        await prisma.project.delete({
          where: { id: projectId },
        });

        // Invalidate caches
        await cacheDelete(cacheKeys.project(projectId));
        await cacheDelete(cacheKeys.projectBySlug(project.slug));

        logger.info('Project deleted: ' + projectId, LOG);

        return ok({ deleted: true, projectId });
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
