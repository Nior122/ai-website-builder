// =============================================================================
// Version Service
// =============================================================================
// Minimal version-history helpers for the publishing feature. The Prisma
// `Version` model (schema.prisma L258) stores a full `snapshot` of a project
// at a point in time; this service owns the reads Phase 11 needs today:
//   - `getVersionCount` / `getNextVersionNumber` — used by `publishProject` to
//     number each new snapshot monotonically inside the publish transaction.
//   - `listVersions` — the metadata-only list a future history panel will
//     render. It returns no `snapshot` payload so a history list never hauls
//     large JSON to the client. Restore is deferred to a later phase.
//
// Ownership is enforced via `getProjectById` from `project.service`, which
// throws `NotFoundError` / `ForbiddenError` (the app-wide centralized errors),
// so callers don't repeat the access check.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { getProjectById } from '@/features/projects/services/project.service';
import type { VersionSummary } from '@/features/publishing/types';

/**
 * Count of snapshots stored for a project. Used to decide the next version
 * number (`count === 0` ⇒ start at 1). Cheap `aggregate({ _count })` — no row
 * materialization, no ownership implied (the caller is within a verified
 * publish flow).
 */
export async function getVersionCount(projectId: string): Promise<number> {
  const result = await prisma.version.aggregate({
    where: { projectId },
    _count: { _all: true },
  });
  return result._count._all;
}

/**
 * The version number to assign the next snapshot: `max(version) + 1`, or `1`
 * if no snapshots exist yet. Pulled via a `groupBy` so we always step past the
 * *highest* existing version (robust to deletions / gaps in the sequence),
 * not merely past the count.
 */
export async function getNextVersionNumber(projectId: string): Promise<number> {
  const versions = await prisma.version.groupBy({
    by: ['version'],
    where: { projectId },
    orderBy: { version: 'desc' },
    take: 1,
  });

  if (versions.length === 0) return 1;
  return versions[0].version + 1;
}

/**
 * Metadata-only list of a project's snapshots, newest first. Omits the
 * `snapshot` payload on purpose — the history list needs labels and dates, not
 * megabytes of JSON. A restore flow (deferred) will fetch the full snapshot by
 * id when it actually needs it.
 *
 * Verifies ownership via `getProjectById`; the returned summaries carry only
 * the safe-to-disclose creator id (UI maps it to a name / avatar).
 */
export async function listVersions(
  projectId: string,
  userId: string
): Promise<VersionSummary[]> {
  // Ownership + existence (throws NotFoundError / ForbiddenError).
  await getProjectById(projectId, userId);

  const versions = await prisma.version.findMany({
    where: { projectId },
    select: {
      id: true,
      version: true,
      label: true,
      createdBy: true,
      createdAt: true,
    },
    orderBy: { version: 'desc' },
  });

  return versions.map((v) => ({
    id: v.id,
    version: v.version,
    label: v.label,
    createdBy: v.createdBy,
    createdAt: v.createdAt,
  }));
}
