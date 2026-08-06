// =============================================================================
// Website Builder — Section Operations Tests
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  addSection,
  deleteSection,
  duplicateSection,
  moveSection,
  reorderSections,
  setSectionVisibility,
  setSectionLocked,
  updateSectionContent,
  copySectionToClipboard,
  pasteSection,
  saveSectionAsTemplate,
  insertTemplate,
  listSectionTemplates,
  getSection,
  sectionCount,
  type BuilderPage,
} from '@/lib/builder';
import { makeTestProject } from './fixtures';

function homePage(): BuilderPage {
  const project = makeTestProject();
  return project.pages.find((page) => page.isHome) ?? project.pages[0];
}

describe('Section Operations', () => {
  it('adds sections with normalized order', () => {
    const page = addSection(homePage(), 'faq');
    expect(sectionCount(page)).toBeGreaterThan(sectionCount(homePage()));
    expect(page.sections.map((section) => section.order)).toEqual(page.sections.map((_, i) => i));
  });

  it('adds sections at a specific index', () => {
    const base = homePage();
    const page = addSection(base, 'faq', 1);
    expect(page.sections[1].type).toBe('faq');
  });

  it('deletes sections', () => {
    const base = homePage();
    const target = base.sections[0];
    const page = deleteSection(base, target.id);
    expect(getSection(page, target.id)).toBeUndefined();
    expect(page.sections.map((section) => section.order)).toEqual(page.sections.map((_, i) => i));
  });

  it('duplicates sections with a fresh id', () => {
    const base = homePage();
    const target = base.sections[1];
    const page = duplicateSection(base, target.id);
    expect(sectionCount(page)).toBe(sectionCount(base) + 1);
    const clones = page.sections.filter((section) => section.type === target.type);
    expect(clones.length).toBeGreaterThanOrEqual(2);
    expect(new Set(clones.map((section) => section.id)).size).toBe(clones.length);
  });

  it('moves sections up and down', () => {
    const base = homePage();
    const first = base.sections[0];
    const down = moveSection(base, first.id, 'down');
    expect(down.sections[1].id).toBe(first.id);
    const up = moveSection(down, first.id, 'up');
    expect(up.sections[0].id).toBe(first.id);
  });

  it('reorders sections from a drag-and-drop result', () => {
    const base = homePage();
    const orderedIds = [...base.sections].reverse().map((section) => section.id);
    const page = reorderSections(base, orderedIds);
    expect(page.sections[0].id).toBe(orderedIds[0]);
    expect(page.sections.map((section) => section.order)).toEqual(page.sections.map((_, i) => i));
  });

  it('toggles visibility and lock', () => {
    const base = homePage();
    const target = base.sections[0];
    const hidden = setSectionVisibility(base, target.id, false);
    expect(getSection(hidden, target.id)?.visible).toBe(false);
    const locked = setSectionLocked(base, target.id, true);
    expect(getSection(locked, target.id)?.locked).toBe(true);
  });

  it('updates section content immutably', () => {
    const base = homePage();
    const target = base.sections[0];
    const page = updateSectionContent(base, target.id, { headline: 'New Headline' });
    expect(getSection(page, target.id)?.content.headline).toBe('New Headline');
    expect(getSection(base, target.id)?.content.headline).not.toBe('New Headline');
  });

  it('copies and pastes sections', () => {
    const base = homePage();
    copySectionToClipboard(base.sections[0]);
    const page = pasteSection(base);
    expect(sectionCount(page)).toBe(sectionCount(base) + 1);
  });

  it('saves and inserts section templates', () => {
    const base = homePage();
    const templateId = saveSectionAsTemplate('My Hero', base.sections[0]);
    expect(listSectionTemplates()).toContainEqual(expect.objectContaining({ id: templateId, type: base.sections[0].type }));
    const page = insertTemplate(base, templateId, 0);
    expect(page.sections[0].templateId).toBe(templateId);
  });
});
