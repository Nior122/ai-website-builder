// =============================================================================
// Project Service
// =============================================================================
// Database operations for projects. Implements the repository pattern
// to abstract Prisma from consuming code.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { NotFoundError, ForbiddenError } from '@/lib/errors';
import { cacheDelete, cacheGet, cacheSet, cacheKeys } from '@/lib/redis/cache';
import { logAuditEntry } from '@/features/admin/services/audit.service';
import type { Project, Page, Section } from '@prisma/client';

export type ProjectWithPages = Project & {
  pages: (Page & { sections: Section[] })[];
};

/**
 * Get a project by ID with all nested data.
 */
export async function getProjectById(
  projectId: string,
  userId: string
): Promise<ProjectWithPages> {
  // Resolve Clerk userId → DB User.id for ownership check
  // userId may be a Clerk string (user_xxx) or already a DB cuid;
  // detect by prefix to avoid unnecessary lookups.
  let dbUserId = userId;
  if (userId.startsWith('user_')) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!dbUser) throw new ForbiddenError('User not found');
    dbUserId = dbUser.id;
  }

  // Try cache first
  const cached = await cacheGet<ProjectWithPages>(cacheKeys.project(projectId));
  if (cached) return cached;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pages: {
        include: { sections: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!project) {
    throw new NotFoundError('Project', projectId);
  }

  // Check ownership
  if (project.ownerId !== dbUserId) {
    throw new ForbiddenError('You do not have access to this project');
  }

  // Cache for 5 minutes
  await cacheSet(cacheKeys.project(projectId), project, 300);

  return project as ProjectWithPages;
}

/**
 * List all projects for a user.
 */
export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId, status: { not: 'archived' } },
    include: {
      pages: { select: { id: true } },
      _count: { select: { pages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Create a new project.
 */
export async function createProject(data: {
  name: string;
  description?: string;
  industry: string;
  businessType: string;
  ownerId: string;
  organizationId?: string;
  templateId?: string;
}) {
  // Deduplicate slug: append -2, -3, etc. if slug already exists for this owner
  let baseSlug = generateProjectSlug(data.name);
  let slug = baseSlug;
  let counter = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.project.findFirst({
      where: { ownerId: data.ownerId, slug },
      select: { id: true },
    });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      industry: data.industry,
      businessType: data.businessType,
      ownerId: data.ownerId,
      organizationId: data.organizationId,
      templateId: data.templateId,
      settings: {},
      globalStyles: {},
      seo: {},
    },
  });

  // Audit log (fire-and-forget)
  await logAuditEntry({
    userId: data.ownerId,
    action: 'project.create',
    resource: 'project',
    resourceId: project.id,
    newValues: { name: data.name, industry: data.industry, businessType: data.businessType },
  });

  return project;
}

/**
 * Update a project.
 */
export async function updateProject(
  projectId: string,
  userId: string,
  data: Partial<{
    name: string;
    description: string;
    status: 'draft' | 'published' | 'archived';
    globalStyles: Record<string, unknown>;
    seo: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>
) {
  const project = await getProjectById(projectId, userId);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: data as any,
  });

  // Invalidate cache
  await cacheDelete(cacheKeys.project(projectId));

  // Audit log (fire-and-forget)
  await logAuditEntry({
    userId,
    action: 'project.update',
    resource: 'project',
    resourceId: projectId,
    newValues: data as Record<string, unknown>,
  });

  return updated;
}

/**
 * Delete a project.
 */
export async function deleteProject(projectId: string, userId: string) {
  await getProjectById(projectId, userId);

  await prisma.project.delete({
    where: { id: projectId },
  });

  await cacheDelete(cacheKeys.project(projectId));

  // Audit log (fire-and-forget)
  await logAuditEntry({
    userId,
    action: 'project.delete',
    resource: 'project',
    resourceId: projectId,
  });
}

/**
 * Duplicate a project.
 */
export async function duplicateProject(projectId: string, userId: string) {
  const original = await getProjectById(projectId, userId);

  const duplicated = await prisma.project.create({
    data: {
      name: `${original.name} (Copy)`,
      slug: generateProjectSlug(`${original.name} copy`),
      description: original.description,
      industry: original.industry,
      businessType: original.businessType,
      ownerId: userId,
      globalStyles: original.globalStyles as any,
      seo: original.seo as any,
      settings: original.settings as any,
      pages: {
        create: original.pages.map((page) => ({
          slug: page.slug,
          title: page.title,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          isHome: page.isHome,
          order: page.order,
          sections: {
            create: page.sections.map((section) => ({
              type: section.type,
              layout: section.layout,
              content: section.content as any,
              styles: section.styles as any,
              animations: section.animations as any,
              images: section.images as any,
              visibility: section.visibility as any,
              order: section.order,
            })),
          },
        })),
      } as any,
    },
    include: {
      pages: {
        include: { sections: true },
      },
    },
  });

  return duplicated;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}
