// =============================================================================
// JSON Patcher Utilities
// =============================================================================
// Deep merge, diff, and patch operations for section/page JSON.
// Used by the drag-and-drop editor to apply partial updates without data loss.
// =============================================================================

import { nanoid } from 'nanoid';
import type { Section, SectionStyles, Animation, ImageConfig, SectionVisibility, Page, LayoutType } from '@/types';

// ─── Deep Merge ─────────────────────────────────────────────────────────

/**
 * Deep merge two objects. Arrays are replaced (not merged).
 * Source properties override target properties recursively.
 */
export function deepMerge<T extends object>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    const targetVal = result[key];

    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }

  return result;
}

// ─── Section Patcher ────────────────────────────────────────────────────

export interface SectionPatch {
  content?: Partial<Record<string, unknown>>;
  styles?: Partial<SectionStyles>;
  layout?: string;
  animations?: Animation[];
  images?: ImageConfig[];
  visibility?: Partial<SectionVisibility>;
}

/**
 * Apply partial patches to a section. Deep merges content and styles,
 * replaces arrays.
 */
export function patchSection(
  section: Section,
  patches: SectionPatch
): Section {
  const updated = { ...section };

  if (patches.content) {
    updated.content = deepMerge(
      section.content,
      patches.content
    );
  }

  if (patches.styles) {
    updated.styles = deepMerge<SectionStyles>(
      section.styles ?? ({} as SectionStyles),
      patches.styles
    );
  }

  if (patches.layout !== undefined) {
    updated.layout = patches.layout as LayoutType;
  }

  if (patches.animations !== undefined) {
    updated.animations = patches.animations;
  }

  if (patches.images !== undefined) {
    updated.images = patches.images;
  }

  if (patches.visibility) {
    updated.visibility = {
      ...(section.visibility as SectionVisibility || { desktop: true, tablet: true, mobile: true }),
      ...patches.visibility,
    };
  }

  return updated;
}

// ─── Diff ───────────────────────────────────────────────────────────────

export interface DiffResult {
  changed: boolean;
  fields: string[];
  details: Array<{
    field: string;
    type: 'added' | 'removed' | 'changed';
    oldValue?: unknown;
    newValue?: unknown;
  }>;
}

/**
 * Compute the differences between two sections.
 * Returns which fields changed and their old/new values.
 */
export function diffSections(before: Section, after: Section): DiffResult {
  const details: DiffResult['details'] = [];
  const fields = ['content', 'styles', 'layout', 'animations', 'images', 'visibility'];

  for (const field of fields) {
    const oldVal = (before as unknown as Record<string, unknown>)[field];
    const newVal = (after as unknown as Record<string, unknown>)[field];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (oldVal === undefined || oldVal === null) {
        details.push({ field, type: 'added', newValue: newVal });
      } else if (newVal === undefined || newVal === null) {
        details.push({ field, type: 'removed', oldValue: oldVal });
      } else {
        details.push({ field, type: 'changed', oldValue: oldVal, newValue: newVal });
      }
    }
  }

  return {
    changed: details.length > 0,
    fields: details.map((d) => d.field),
    details,
  };
}

// ─── Reorder ────────────────────────────────────────────────────────────

/**
 * Reorder sections by moving an item from one index to another.
 * Returns a new array with updated `order` values.
 */
export function reorderSections<T extends { order: number }>(
  sections: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (fromIndex === toIndex) return [...sections];
  if (fromIndex < 0 || fromIndex >= sections.length) return [...sections];
  if (toIndex < 0 || toIndex >= sections.length) return [...sections];

  const result = [...sections];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);

  return result.map((item, i) => ({
    ...item,
    order: i,
  }));
}

// ─── Clone Section ──────────────────────────────────────────────────────

/**
 * Deep clone a section with a new ID.
 */
export function cloneSection(section: Section): Section {
  return {
    ...section,
    id: nanoid(),
    content: JSON.parse(JSON.stringify(section.content)),
    styles: JSON.parse(JSON.stringify(section.styles)),
    animations: JSON.parse(JSON.stringify(section.animations)),
    images: JSON.parse(JSON.stringify(section.images)),
    order: section.order,
  };
}

// ─── Clone Page ─────────────────────────────────────────────────────────

/**
 * Deep clone a page with new IDs for page and all sections.
 */
export function clonePage(page: Page): Page {
  return {
    ...page,
    id: nanoid(),
    sections: page.sections.map((section) => ({
      ...cloneSection(section),
      order: section.order,
    })),
  };
}

// ─── Section Operations ─────────────────────────────────────────────────

export function getSectionIndex(
  page: Page,
  sectionId: string
): number {
  return page.sections.findIndex((s) => s.id === sectionId);
}

export function addSection(
  page: Page,
  section: Section,
  index?: number
): Page {
  const sections = [...page.sections];
  const insertAt = index ?? sections.length;
  sections.splice(insertAt, 0, section);
  return {
    ...page,
    sections: sections.map((s, i) => ({ ...s, order: i })),
  };
}

export function removeSection(page: Page, sectionId: string): Page {
  return {
    ...page,
    sections: page.sections
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i })),
  };
}

export function moveSection(
  page: Page,
  fromIndex: number,
  toIndex: number
): Page {
  return {
    ...page,
    sections: reorderSections(page.sections, fromIndex, toIndex),
  };
}

// ─── Content Path Access ────────────────────────────────────────────────

/**
 * Get a nested value from section content using dot-notation path.
 * Example: `getSectionContent(section, 'items.0.title')`
 */
export function getSectionContent(
  section: Section,
  path: string
): unknown {
  const keys = path.split('.');
  let current: unknown = section.content;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a nested value in section content using dot-notation path.
 * Returns a new section with the updated content (immutable).
 */
export function setSectionContent(
  section: Section,
  path: string,
  value: unknown
): Section {
  const keys = path.split('.');
  const content = JSON.parse(JSON.stringify(section.content)) as Record<string, unknown>;

  let current = content;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;

  return {
    ...section,
    content,
  };
}

// ─── Array Helpers ──────────────────────────────────────────────────────

/**
 * Add an item to an array field in section content.
 */
export function addContentArrayItem<T>(
  section: Section,
  arrayPath: string,
  item: T
): Section {
  const current = getSectionContent(section, arrayPath);
  if (!Array.isArray(current)) {
    return setSectionContent(section, arrayPath, [item]);
  }
  return setSectionContent(section, arrayPath, [...current, item]);
}

/**
 * Remove an item from an array field by index.
 */
export function removeContentArrayItem(
  section: Section,
  arrayPath: string,
  index: number
): Section {
  const current = getSectionContent(section, arrayPath);
  if (!Array.isArray(current)) return section;
  const updated = current.filter((_: unknown, i: number) => i !== index);
  return setSectionContent(section, arrayPath, updated);
}

/**
 * Update an item in an array field by index.
 */
export function updateContentArrayItem<T>(
  section: Section,
  arrayPath: string,
  index: number,
  item: T
): Section {
  const current = getSectionContent(section, arrayPath);
  if (!Array.isArray(current)) return section;
  const updated = current.map((_: unknown, i: number) => (i === index ? item : _));
  return setSectionContent(section, arrayPath, updated);
}
