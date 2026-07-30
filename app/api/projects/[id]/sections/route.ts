// =============================================================================
// POST /api/projects/[id]/sections
// =============================================================================
// Create a new section within a project page.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma/client';
import { cacheDelete, cacheKeys } from '@/lib/redis/cache';
import { ok, errorResponse, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { getDefaultSection } from '@/features/json-engine';
import { nanoid } from 'nanoid';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { createSectionSchema } from '@/lib/validations';

export const POST = withRequestLogging(
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

          const projectId = request.nextUrl.pathname.split('/').at(-2)!;
          const { pageId, type, layout, content, afterSectionId } = body as {
            pageId: string;
            type: string;
            layout?: string;
            content?: Record<string, unknown>;
            afterSectionId?: string;
          };

          // Verify ownership
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true },
          });

          if (!project || project.ownerId !== dbUser.id) {
            return notFound('Project');
          }

          // Verify page exists within project
          const page = await prisma.page.findFirst({
            where: { id: pageId, projectId },
            include: { sections: { orderBy: { order: 'asc' } } },
          });

          if (!page) {
            return notFound('Page');
          }

          // Get default section config
          const defaults = getDefaultSection(type);
          if (!defaults) {
            return badRequest(`Unknown section type: ${type}`);
          }

          // Determine order
          let order = page.sections.length;
          if (afterSectionId) {
            const idx = page.sections.findIndex((s) => s.id === afterSectionId);
            if (idx !== -1) order = idx + 1;
          }

          // Create section
          const section = await prisma.section.create({
            data: {
              id: nanoid(),
              pageId,
              type,
              layout: layout || defaults.layout,
              content: (content || defaults.content) as any,
              styles: defaults.styles as any,
              animations: defaults.animations as any,
              images: defaults.images as any,
              visibility: defaults.visibility as any,
              order,
            } as any,
          });

          // Update order of subsequent sections
          const sectionsToReorder = page.sections.filter((s) => s.order >= order && s.id !== section.id);
          await Promise.all(
            sectionsToReorder.map((s, i) =>
              prisma.section.update({
                where: { id: s.id },
                data: { order: order + 1 + i },
              })
            )
          );

          await cacheDelete(cacheKeys.project(projectId));

          return ok(section, 201);
        } catch (error) {
          return errorResponse(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { body: createSectionSchema }
    ),
    { tier: 'free' }
  )
);
