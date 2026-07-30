// =============================================================================
// Publishing — Type Definitions
// =============================================================================
// Shared shapes for the publishing feature surface. Kept narrow and explicit
// (no Zod here — the services + routes validate at their own boundaries) so
// the publish/unpublish return contract and the `Version.snapshot` payload are
// documented in one place and imported by services, hooks, and the UI.
// =============================================================================

import type { ProjectStatus } from '@/types';

/**
 * Result returned by `publishProject` / `unpublishProject` and surfaced to the
 * client by the publish/unpublish API routes. `publishedUrl` is the public
 * subpath route (`/site/<slug>`) the owner can share; it is `null` after an
 * unpublish because the site is no longer publicly reachable.
 */
export interface PublishResult {
  id: string;
  status: ProjectStatus;
  publishedAt: Date | null;
  publishedUrl: string | null;
}

/**
 * List item for `listVersions` — the metadata of a saved snapshot without the
 * (potentially large) snapshot payload. A future history panel consumes this;
 * restore logic (deferred to a later phase) will fetch the full snapshot by id.
 */
export interface VersionSummary {
  id: string;
  version: number;
  label: string | null;
  createdBy: string;
  createdAt: Date;
}

/**
 * The payload persisted to `Version.snapshot` on every publish. A complete,
 * restorable image of the project at publish time: scalar project metadata,
 * the three JSON columns (globalStyles / seo / settings), and every page with
 * every section's JSON columns. Section rows are serialized by field — we
 * deliberately keep the raw Prisma JSON shape so a later restore can write
 * them back with no coercion.
 */
export interface ProjectSnapshot {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    industry: string;
    businessType: string;
    status: ProjectStatus;
    customDomain: string | null;
    thumbnailUrl: string | null;
    templateId: string | null;
    globalStyles: Record<string, unknown>;
    seo: Record<string, unknown>;
    settings: Record<string, unknown>;
    publishedAt: string | null; // ISO string — JSON-serializable
    createdAt: string;
    updatedAt: string;
  };
  pages: Array<{
    id: string;
    slug: string;
    title: string;
    metaTitle: string | null;
    metaDescription: string | null;
    isHome: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
    sections: Array<{
      id: string;
      type: string;
      layout: string;
      order: number;
      content: Record<string, unknown>;
      styles: Record<string, unknown>;
      animations: Record<string, unknown>;
      images: Array<unknown>;
      visibility: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
}
