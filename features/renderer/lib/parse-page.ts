// =============================================================================
// Shared Page / Section JSON Parser
// =============================================================================
// Single source of truth for coercing Prisma `Page` + `Section` rows (whose
// `content`, `styles`, `animations`, `images`, and `visibility` columns are
// untyped `Json`) into the strongly-typed `Page` / `Section` shapes consumed by
// the renderer, editor, preview, and public delivery routes.
//
// Before this module existed, the editor page, the preview page, and (in
// Phase 11) the public route each kept their own divergent copy of this
// coercion — a drift hazard. Centralizing it guarantees every surface parses
// sections identically.
//
// NOTE on `isPublished` / `ogImage`: the app `Page` type historically declared
// these but the Prisma `Page` model has neither column. They are therefore
// omitted here. See `types/index.ts` for the reconciled Page type.
// =============================================================================

import type { Page, Section, SectionVisibility } from '@/types';

// ─── Prisma Row Types ──────────────────────────────────────────────────────
// Minimal structural types for the Prisma rows we coerce. We import the real
// Prisma `Page`/`Section` types at call sites where available, but the parser
// itself only depends on the subset of fields it reads, so we keep these local
// structural interfaces to avoid coupling to `@prisma/client` here.

interface SectionRow {
  id: string;
  pageId: string;
  type: string;
  layout: string;
  order: number;
  content: unknown;
  styles: unknown;
  animations: unknown;
  images: unknown;
  visibility: unknown;
  createdAt: Date;
  updatedAt: Date;
  // Optional columns that may be present (e.g. isLocked, customId) are passed
  // through via the spread in `parseSection`; we only declare what we touch.
  [key: string]: unknown;
}

interface PageRow {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isHome: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  sections: SectionRow[];
  [key: string]: unknown;
}

const DEFAULT_VISIBILITY: SectionVisibility = {
  desktop: true,
  tablet: true,
  mobile: true,
};

// ─── Section Parser ────────────────────────────────────────────────────────

/**
 * Coerce a single Prisma section row into the typed `Section` shape.
 *
 * `animations` is stored as a JSON array (or object in older rows); the typed
 * `Section` expects `Animation[]`, so we normalize anything that isn't an array
 * to `[]`. `images` is likewise normalized to an array. `visibility` falls back
 * to the per-device `{ true, true, true }` default when absent or malformed.
 */
export function parseSection(row: SectionRow): Section {
  const visibility =
    (row.visibility as Record<string, unknown> | null) ?? DEFAULT_VISIBILITY;

  return {
    ...row,
    type: row.type as Section['type'],
    layout: row.layout as Section['layout'],
    content: (row.content as Record<string, unknown>) ?? {},
    styles: (row.styles as Record<string, unknown>) ?? {},
    animations: Array.isArray(row.animations) ? row.animations : [],
    images: Array.isArray(row.images) ? row.images : [],
    visibility: visibility as unknown as SectionVisibility,
  } as unknown as Section;
}

// ─── Page Parser ───────────────────────────────────────────────────────────

/**
 * Coerce a Prisma `Page` row (with nested `sections`) into the typed `Page`
 * shape. Sections are parsed via `parseSection` and left unsorted — callers
 * sort by `order` as needed (the renderer already does this).
 */
export function parsePageWithSections(row: PageRow): Page {
  const sections = (row.sections ?? []).map(parseSection);

  return {
    id: row.id,
    projectId: row.projectId,
    slug: row.slug,
    title: row.title,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    sections,
    isHome: row.isHome,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as Page;
}

/**
 * Parse an array of Prisma page rows into typed `Page[]` (pages sorted by
 * `order` asc; sections within each page left for the renderer to sort).
 */
export function parseProjectPages(rows: PageRow[]): Page[] {
  return [...rows]
    .sort((a, b) => a.order - b.order)
    .map(parsePageWithSections);
}
