// =============================================================================
// GET/POST /api/projects
// =============================================================================
// GET  — List all projects for the authenticated user (non-archived).
// POST — Create a new project with name, description, industry, businessType.
//
// CRITICAL: Resolves Clerk userId to DB User.id before any Prisma queries.
// All Project FK references use User.id (cuid), NOT User.clerkId (user_xxx).
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import prisma from '@/lib/prisma/client';
import { ok, errorResponse, unauthorized, badRequest } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import { checkPlanLimits } from '@/features/billing/services/subscription.service';
import { logAuditEntry } from '@/features/admin/services/audit.service';

const LOG = { route: '/api/projects' } as const;

async function resolveDbUserId(clerkUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) throw new Error('User not found — please sign in again.');
  return user.id;
}

function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  industry: z.string().min(1),
  businessType: z.string().optional().default('other'),
  templateId: z.string().optional(),
  organizationId: z.string().optional(),
});

export const POST = withRequestLogging(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();

      const dbUserId = await resolveDbUserId(userId);

      const { allowed, current, limit } = await checkPlanLimits(dbUserId, 'projects');
      if (!allowed) {
        return badRequest(`Project limit reached (${current}/${limit}). Upgrade your plan to create more.`);
      }

      const body = await request.json();
      const validated = createSchema.parse(body);

      const baseSlug = generateProjectSlug(validated.name);
      let slug = baseSlug;
      let slugCounter = 2;
      while (true) {
        const existingSlug = await prisma.project.findFirst({
          where: { ownerId: dbUserId, slug },
          select: { id: true },
        });
        if (!existingSlug) break;
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }

      const project = await prisma.project.create({
        data: {
          name: validated.name, slug,
          description: validated.description,
          industry: validated.industry,
          businessType: validated.businessType || 'other',
          ownerId: dbUserId,
          organizationId: validated.organizationId,
          templateId: validated.templateId,
          settings: {}, globalStyles: {}, seo: {},
        },
      });

      logAuditEntry({
        userId: dbUserId, action: 'project.create',
        resource: 'project', resourceId: project.id,
        newValues: { name: validated.name, industry: validated.industry },
      }).catch(() => {});

      return ok(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return badRequest(err.errors.map((e) => e.message).join('; '));
      }
      return errorResponse(err instanceof Error ? err : new Error(String(err)));
    }
  }, { tier: 'free' })
);

export const GET = withRequestLogging(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();
      const dbUserId = await resolveDbUserId(userId);
      const projects = await prisma.project.findMany({
        where: { ownerId: dbUserId, status: { not: 'archived' } },
        include: { pages: { select: { id: true } }, _count: { select: { pages: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      return ok(projects);
    } catch (err) {
      return errorResponse(err instanceof Error ? err : new Error(String(err)));
    }
  }, { tier: 'free' })
);
