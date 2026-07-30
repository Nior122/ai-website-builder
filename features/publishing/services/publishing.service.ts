// =============================================================================
// Publishing Service
// =============================================================================
// Single source of truth for the publish / unpublish state machine and the
// `Version.snapshot` written on each publish. Repository-pattern service: the
// API routes (`/api/projects/[id]/publish` & `/unpublish`) stay thin and
// delegate here so the publish flow — status transition, monotonic version
// numbering, full-project snapshot, cache invalidation — is one consistent unit
// and unit-testable in isolation.
//
// Contract:
//   - Ownership + existence: reuse `getProjectById` (project.service), which
//     throws `NotFoundError` / `ForbiddenError` (the app-wide centralized
//     errors). Publish/unpublish are therefore auth-gated at the service layer
//     in addition to Clerk protecting `/api/projects(.*)`.
//   - `status` (Prisma `Project.status`, default `'draft'`) is the single
//     source of truth for published-state. `publishedAt` records the last time
//     the project went live; it is *not* cleared on unpublish (kept as a
//     historical record — a re-publish bumps it again).
//   - On publish we write a `Version` row whose `snapshot` is a complete,
//     restorable image of the project (see `buildProjectSnapshot`), numbered
//     via `getNextVersionNumber`.
//   - Caches invalidated on every transition: `cacheKeys.project(id)` (editor
//     / dashboard reads) and `cacheKeys.projectBySlug(slug)` (public delivery).
//     The public route reads through `cacheGetOrSet(projectBySlug)`, so a
//     publish/unpublish must evict that entry or visitors would see a stale
//     404 / stale published page until TTL.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { buildPublishedUrl } from '@/lib/url';
import {
  cacheDelete,
  cacheKeys,
} from '@/lib/redis/cache';
import { getProjectById } from '@/features/projects/services/project.service';
import { logAuditEntry } from '@/features/admin/services/audit.service';
import { getNextVersionNumber } from '@/features/publishing/services/version.service';
import type { ProjectWithPages } from '@/features/projects/services/project.service';
import type {
  PublishResult,
  ProjectSnapshot,
} from '@/features/publishing/types';
import type { ProjectStatus } from '@/types';

/**
 * Public URL for a published project, as a subpath of this app:
 * `/site/<slug>`. Centralized so the API, the toolbar hook, and the dashboard
 * link all agree on the shape (Phase 12 may swap this for a custom domain).
 *
 * Re-exported here for back-compat with existing callers (tests, the API
 * route). The canonical implementation lives in '@/lib/url' so it can be
 * imported from client components without pulling in Prisma/Redis.
 */
export { buildPublishedUrl } from '@/lib/url';

// ─── Snapshot Serialization ────────────────────────────────────────────────

/**
 * Convert a Prisma-loaded project (with nested pages + sections) into the JSON
 * payload persisted to `Version.snapshot`. Pure and side-effect-free so it is
 * trivially unit-testable and deterministic.
 *
 * Dates are serialized to ISO strings — `Json` columns round-trip `Date`
 * unpredictably across drivers, so we normalize to strings here and a later
 * restore will `new Date(...)` on the way back in. The JSON columns
 * (content / styles / animations / images / visibility / globalStyles / seo /
 * settings) are passed through as-is in their raw Prisma shape: the snapshot is
 * meant to be writable straight back to the DB on restore with no coercion.
 */
export function buildProjectSnapshot(
  project: ProjectWithPages
): ProjectSnapshot {
  return {
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      industry: project.industry,
      businessType: project.businessType,
      status: project.status as ProjectStatus,
      customDomain: project.customDomain,
      thumbnailUrl: project.thumbnailUrl,
      templateId: project.templateId,
      globalStyles: project.globalStyles as Record<string, unknown>,
      seo: project.seo as Record<string, unknown>,
      settings: project.settings as Record<string, unknown>,
      publishedAt: project.publishedAt ? project.publishedAt.toISOString() : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
    pages: [...project.pages]
      .sort((a, b) => a.order - b.order)
      .map((page) => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        isHome: page.isHome,
        order: page.order,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
        sections: [...page.sections]
          .sort((a, b) => a.order - b.order)
          .map((section) => ({
            id: section.id,
            type: section.type,
            layout: section.layout,
            order: section.order,
            content: section.content as Record<string, unknown>,
            styles: section.styles as Record<string, unknown>,
            animations: section.animations as Record<string, unknown>,
            images: section.images as Array<unknown>,
            visibility: section.visibility as Record<string, unknown>,
            createdAt: section.createdAt.toISOString(),
            updatedAt: section.updatedAt.toISOString(),
          })),
      })),
  };
}

// ─── Publish / Unpublish ────────────────────────────────────────────────────

/**
 * Transition a project to `published`: stamp `publishedAt = now`, write a full
 * `Version.snapshot`, and invalidate the project caches so the editor,
 * dashboard, and public delivery all see the new state immediately.
 *
 * Runs the status update + version write in a single Prisma transaction so a
 * snapshot failure cannot leave the project half-published (or vice versa).
 * The version number is resolved *outside* the transaction (a best-effort max
 * read); concurrent publishes to the same project are not a realistic concern
 * for the single-owner model, and a unique `@@index([projectId, version])`-
 * style guard can be added later if that ever changes.
 *
 * Re-publishing an already-published project is allowed (idempotent-ish): it
 * refreshes `publishedAt` and adds a new snapshot version.
 */
export async function publishProject(
  projectId: string,
  userId: string
): Promise<PublishResult> {
  // Load + ownership check (throws NotFoundError / ForbiddenError). This also
  // warms the project cache the transaction's `update` will invalidate below.
  const project = await getProjectById(projectId, userId);

  const nextVersion = await getNextVersionNumber(projectId);
  const snapshot = buildProjectSnapshot(project);

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.project.update({
      where: { id: projectId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    await tx.version.create({
      data: {
        projectId,
        version: nextVersion,
        label: `Published v${nextVersion}`,
        snapshot: snapshot as any,
        createdBy: userId,
      },
    });

    return saved;
  });

  // Evict both cache keys: the editor/dashboard project read and the public
  // by-slug read (the latter must go or /site/<slug> keeps serving the old state).
  await Promise.all([
    cacheDelete(cacheKeys.project(projectId)),
    cacheDelete(cacheKeys.projectBySlug(project.slug)),
  ]);

  // Audit log (fire-and-forget)
  await logAuditEntry({
    userId,
    action: 'project.publish',
    resource: 'project',
    resourceId: projectId,
    newValues: { version: nextVersion, slug: updated.slug },
  });

  return {
    id: updated.id,
    status: updated.status as ProjectStatus,
    publishedAt: updated.publishedAt,
    publishedUrl: buildPublishedUrl(updated.slug),
  };
}

/**
 * Transition a project back to `draft`. `publishedAt` is intentionally kept
 * (historical record of the last live window) and the existing `Version`
 * snapshots are not deleted — a future history panel still shows them. Both
 * project caches are invalidated so the public route immediately 404s and the
 * dashboard/editor reflect the draft state.
 */
export async function unpublishProject(
  projectId: string,
  userId: string
): Promise<PublishResult> {
  // Ownership + existence.
  await getProjectById(projectId, userId);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { status: 'draft' },
    select: { id: true, status: true, slug: true, publishedAt: true },
  });

  await Promise.all([
    cacheDelete(cacheKeys.project(projectId)),
    cacheDelete(cacheKeys.projectBySlug(updated.slug)),
  ]);

  // Audit log (fire-and-forget)
  await logAuditEntry({
    userId,
    action: 'project.unpublish',
    resource: 'project',
    resourceId: projectId,
    newValues: { slug: updated.slug },
  });

  return {
    id: updated.id,
    status: updated.status as ProjectStatus,
    publishedAt: updated.publishedAt,
    // No longer publicly reachable — the public route rejects non-`published`.
    publishedUrl: null,
  };
}
