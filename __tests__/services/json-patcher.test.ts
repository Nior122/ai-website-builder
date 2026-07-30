// =============================================================================
// JSON Patcher Tests
// =============================================================================
// Unit tests for deep merge, section patching, diffing, reordering, and
// content path utilities.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  deepMerge,
  patchSection,
  diffSections,
  reorderSections,
  cloneSection,
  clonePage,
  getSectionContent,
  setSectionContent,
  addContentArrayItem,
  removeContentArrayItem,
  updateContentArrayItem,
} from '@/features/json-engine/services/json-patcher';
import type { Section, Page } from '@/types';

// ─── Test Data ─────────────────────────────────────────────────────────

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: 'sec_1',
    pageId: 'page_1',
    type: 'hero',
    layout: 'centered',
    order: 0,
    content: { headline: 'Hello', body: 'World' },
    styles: { backgroundColor: '#fff' } as any,
    animations: [],
    images: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    isLocked: false,
    customId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page_1',
    projectId: 'proj_1',
    slug: 'home',
    title: 'Home',
    metaTitle: 'Home',
    metaDescription: '',
    isHome: true,
    order: 0,
    sections: [makeSection()],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Page;
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('JSONPatcher', () => {
  describe('deepMerge', () => {
    it('should merge flat objects', () => {
      const result = deepMerge({ a: 1, b: 2 } as Record<string, unknown>, { b: 3, c: 4 });
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge nested objects recursively', () => {
      const result = deepMerge(
        { a: { x: 1, y: 2 }, b: 1 } as Record<string, unknown>,
        { a: { y: 3, z: 4 } }
      );
      expect(result).toEqual({ a: { x: 1, y: 3, z: 4 }, b: 1 });
    });

    it('should replace arrays instead of merging them', () => {
      const result = deepMerge(
        { items: [1, 2, 3] },
        { items: [4, 5] }
      );
      expect(result.items).toEqual([4, 5]);
    });

    it('should not mutate the original target', () => {
      const target = { a: 1, nested: { x: 1 } };
      const result = deepMerge(target, { nested: { x: 2 } });
      expect(target.nested.x).toBe(1);
      expect(result.nested.x).toBe(2);
    });

    it('should handle null and undefined source values', () => {
      const result = deepMerge({ a: 1 } as Record<string, unknown>, { a: undefined, b: null });
      expect(result.a).toBe(1);
      expect((result as Record<string, unknown>).b).toBeNull();
    });
  });

  describe('patchSection', () => {
    it('should patch content via deep merge', () => {
      const section = makeSection();
      const patched = patchSection(section, {
        content: { headline: 'Updated' },
      });

      expect(patched.content).toEqual({ headline: 'Updated', body: 'World' });
    });

    it('should patch styles via deep merge', () => {
      const section = makeSection();
      const patched = patchSection(section, {
        styles: { color: 'red' } as never,
      });

      expect(patched.styles).toEqual({ backgroundColor: '#fff', color: 'red' });
    });

    it('should replace layout', () => {
      const section = makeSection();
      const patched = patchSection(section, { layout: 'wide' as any });

      expect(patched.layout).toBe('wide');
    });

    it('should replace animations array', () => {
      const section = makeSection();
      const patched = patchSection(section, {
        animations: [{ type: 'fade-in', duration: 300, delay: 0, easing: 'ease-in', once: true }],
      });

      expect(patched.animations).toHaveLength(1);
    });

    it('should patch visibility partially', () => {
      const section = makeSection();
      const patched = patchSection(section, {
        visibility: { mobile: false },
      });

      expect(patched.visibility).toEqual({
        desktop: true,
        tablet: true,
        mobile: false,
      });
    });

    it('should not mutate original section', () => {
      const section = makeSection();
      patchSection(section, { content: { headline: 'Changed' } });

      expect(section.content).toEqual({ headline: 'Hello', body: 'World' });
    });
  });

  describe('diffSections', () => {
    it('should detect no changes', () => {
      const section = makeSection();
      const result = diffSections(section, makeSection());

      expect(result.changed).toBe(false);
      expect(result.fields).toHaveLength(0);
    });

    it('should detect content changes', () => {
      const before = makeSection();
      const after = makeSection({ content: { headline: 'Changed', body: 'World' } });
      const result = diffSections(before, after);

      expect(result.changed).toBe(true);
      expect(result.fields).toContain('content');
      expect(result.details[0].type).toBe('changed');
    });

    it('should detect layout changes', () => {
      const before = makeSection();
      const after = makeSection({ layout: 'wide' as any });
      const result = diffSections(before, after);

      expect(result.changed).toBe(true);
      expect(result.fields).toContain('layout');
    });

    it('should detect added fields', () => {
      const before = makeSection({ styles: undefined as never });
      const after = makeSection({ styles: { color: 'red' } as never });
      const result = diffSections(before, after);

      expect(result.changed).toBe(true);
      expect(result.details.some((d) => d.field === 'styles' && d.type === 'added')).toBe(true);
    });

    it('should detect removed fields', () => {
      const before = makeSection({ styles: { color: 'red' } as never });
      const after = makeSection({ styles: undefined as never });
      const result = diffSections(before, after);

      expect(result.changed).toBe(true);
      expect(result.details.some((d) => d.field === 'styles' && d.type === 'removed')).toBe(true);
    });
  });

  describe('reorderSections', () => {
    it('should move an item from one index to another', () => {
      const sections = [
        { order: 0, id: 'a' },
        { order: 1, id: 'b' },
        { order: 2, id: 'c' },
      ];

      const result = reorderSections(sections, 0, 2);

      expect(result.map((s) => s.id)).toEqual(['b', 'c', 'a']);
      expect(result.map((s) => s.order)).toEqual([0, 1, 2]);
    });

    it('should return copy when fromIndex equals toIndex', () => {
      const sections = [{ order: 0, id: 'a' }, { order: 1, id: 'b' }];
      const result = reorderSections(sections, 0, 0);

      expect(result.map((s) => s.id)).toEqual(['a', 'b']);
    });

    it('should handle out-of-bounds indices gracefully', () => {
      const sections = [{ order: 0, id: 'a' }];
      const result = reorderSections(sections, -1, 5);

      expect(result.map((s) => s.id)).toEqual(['a']);
    });

    it('should not mutate original array', () => {
      const sections = [
        { order: 0, id: 'a' },
        { order: 1, id: 'b' },
      ];

      reorderSections(sections, 0, 1);

      expect(sections.map((s) => s.id)).toEqual(['a', 'b']);
    });
  });

  describe('cloneSection', () => {
    it('should clone with a new ID', () => {
      const section = makeSection();
      const cloned = cloneSection(section);

      expect(cloned.id).not.toBe(section.id);
      expect(cloned.type).toBe(section.type);
      expect(cloned.content).toEqual(section.content);
    });

    it('should deep clone content so mutations do not affect original', () => {
      const section = makeSection();
      const cloned = cloneSection(section);

      (cloned.content as Record<string, unknown>).headline = 'Changed';

      expect((section.content as Record<string, unknown>).headline).toBe('Hello');
    });

    it('should preserve order', () => {
      const section = makeSection({ order: 5 });
      const cloned = cloneSection(section);

      expect(cloned.order).toBe(5);
    });
  });

  describe('clonePage', () => {
    it('should clone with new page ID and new section IDs', () => {
      const page = makePage();
      const cloned = clonePage(page);

      expect(cloned.id).not.toBe(page.id);
      expect(cloned.sections[0].id).not.toBe(page.sections[0].id);
      expect(cloned.slug).toBe('home');
    });

    it('should deep clone section content', () => {
      const page = makePage();
      const cloned = clonePage(page);

      (cloned.sections[0].content as Record<string, unknown>).headline = 'Changed';

      expect((page.sections[0].content as Record<string, unknown>).headline).toBe('Hello');
    });
  });

  describe('getSectionContent', () => {
    it('should get top-level value', () => {
      const section = makeSection();
      expect(getSectionContent(section, 'headline')).toBe('Hello');
    });

    it('should get nested value with dot path', () => {
      const section = makeSection({
        content: { items: [{ title: 'First' }, { title: 'Second' }] } as never,
      });

      expect(getSectionContent(section, 'items.0.title')).toBe('First');
    });

    it('should return undefined for missing path', () => {
      const section = makeSection();
      expect(getSectionContent(section, 'nonexistent')).toBeUndefined();
    });

    it('should return undefined for invalid nested path', () => {
      const section = makeSection();
      expect(getSectionContent(section, 'headline.nested')).toBeUndefined();
    });
  });

  describe('setSectionContent', () => {
    it('should set top-level value', () => {
      const section = makeSection();
      const updated = setSectionContent(section, 'headline', 'New');

      expect(updated.content).toEqual({ headline: 'New', body: 'World' });
    });

    it('should set nested value, creating intermediate objects', () => {
      const section = makeSection();
      const updated = setSectionContent(section, 'nested.deep.value', 42);

      expect((updated.content as Record<string, unknown>).nested).toEqual({
        deep: { value: 42 },
      });
    });

    it('should not mutate original section', () => {
      const section = makeSection();
      setSectionContent(section, 'headline', 'New');

      expect((section.content as Record<string, unknown>).headline).toBe('Hello');
    });
  });

  describe('addContentArrayItem', () => {
    it('should append to existing array', () => {
      const section = makeSection({
        content: { items: ['a', 'b'] } as never,
      });

      const updated = addContentArrayItem(section, 'items', 'c');
      expect(getSectionContent(updated, 'items')).toEqual(['a', 'b', 'c']);
    });

    it('should create array if path does not exist', () => {
      const section = makeSection();
      const updated = addContentArrayItem(section, 'tags', 'new');

      expect(getSectionContent(updated, 'tags')).toEqual(['new']);
    });
  });

  describe('removeContentArrayItem', () => {
    it('should remove item at index', () => {
      const section = makeSection({
        content: { items: ['a', 'b', 'c'] } as never,
      });

      const updated = removeContentArrayItem(section, 'items', 1);
      expect(getSectionContent(updated, 'items')).toEqual(['a', 'c']);
    });

    it('should return original section if path is not an array', () => {
      const section = makeSection();
      const updated = removeContentArrayItem(section, 'headline', 0);

      expect(updated).toBe(section);
    });
  });

  describe('updateContentArrayItem', () => {
    it('should replace item at index', () => {
      const section = makeSection({
        content: { items: ['a', 'b', 'c'] } as never,
      });

      const updated = updateContentArrayItem(section, 'items', 1, 'Z');
      expect(getSectionContent(updated, 'items')).toEqual(['a', 'Z', 'c']);
    });

    it('should return original section if path is not an array', () => {
      const section = makeSection();
      const updated = updateContentArrayItem(section, 'headline', 0, 'New');

      expect(updated).toBe(section);
    });
  });
});
