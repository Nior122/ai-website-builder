// =============================================================================
// Editor Store — Zustand State Management
// =============================================================================
// Central state for the visual editor: project data, section selection,
// drag-and-drop ordering, and debounced persistence to the API.
// =============================================================================

'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  Project,
  Page,
  Section,
  SectionType,
  SectionStyles,
  Theme,
  ThemePreset,
  ColorPalette,
  TypographyConfig,
} from '@/types';
import {
  patchSection,
  reorderSections as reorderFn,
  cloneSection,
  getDefaultTheme,
} from '@/features/json-engine';
import { getDefaultSection } from '@/features/json-engine';

// ─── State Shape ───────────────────────────────────────────────────────────

export interface EditorState {
  // Data
  project: Project | null;
  pages: Page[];
  currentPageId: string | null;
  theme: Theme | null;

  // Selection
  selectedSectionId: string | null;
  hoveredSectionId: string | null;

  // UI State
  sidebarTab: 'sections' | 'pages' | 'theme' | 'settings';
  propertiesPanelOpen: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isThemeDirty: boolean;
  dirtySectionIds: Set<string>;

  // Actions — Initialization
  initialize: (project: Project, pages: Page[], theme?: Theme | null) => void;
  setCurrentPage: (pageId: string) => void;

  // Actions — Selection
  selectSection: (id: string | null) => void;
  hoverSection: (id: string | null) => void;
  setSidebarTab: (tab: 'sections' | 'pages' | 'theme' | 'settings') => void;

  // Actions — Theme Mutations
  updateTheme: (patch: Partial<Theme>) => void;
  selectPreset: (presetId: ThemePreset) => void;
  updateColors: (colors: Partial<ColorPalette>) => void;
  updateTypography: (typography: Partial<TypographyConfig>) => void;

  // Actions — Section Mutations (local)
  updateSectionContent: (sectionId: string, content: Record<string, unknown>) => void;
  updateSectionStyles: (sectionId: string, styles: Partial<SectionStyles>) => void;
  updateSectionLayout: (sectionId: string, layout: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addSection: (type: SectionType, afterSectionId?: string) => void;
  duplicateSection: (sectionId: string) => void;
  deleteSection: (sectionId: string) => void;

  // Actions — Persistence
  save: () => Promise<void>;
  getCurrentPage: () => Page | undefined;
  getSectionById: (sectionId: string) => Section | undefined;
}

// ─── Save Debounce ─────────────────────────────────────────────────────────

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 1500;

// ─── Store ─────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────
  project: null,
  pages: [],
  currentPageId: null,
  theme: null,
  selectedSectionId: null,
  hoveredSectionId: null,
  sidebarTab: 'sections',
  propertiesPanelOpen: false,
  isSaving: false,
  isDirty: false,
  isThemeDirty: false,
  dirtySectionIds: new Set(),

  // ── Initialization ────────────────────────────────────────────────────

  initialize: (project, pages, theme = null) => {
    const homePage = pages.find((p) => p.isHome) || pages[0];
    set({
      project,
      pages,
      currentPageId: homePage?.id || null,
      theme,
      selectedSectionId: null,
      isDirty: false,
      isThemeDirty: false,
      dirtySectionIds: new Set(),
    });
  },

  setCurrentPage: (pageId) => {
    set({ currentPageId: pageId, selectedSectionId: null });
  },

  // ── Selection ─────────────────────────────────────────────────────────

  selectSection: (id) => {
    set({ selectedSectionId: id, propertiesPanelOpen: id !== null });
  },

  hoverSection: (id) => {
    set({ hoveredSectionId: id });
  },

  setSidebarTab: (tab) => {
    set({ sidebarTab: tab });
  },

  // ── Theme Mutations ──────────────────────────────────────────────────
  //
  // The theme is a deep, structured object (colors with 11 shades each,
  // typography, spacing, borderRadius, shadows, animations). Mutations
  // merge shallowly at the top level; color/typography helpers merge one
  // level deeper. Each mutation marks `isThemeDirty` and schedules a
  // debounced save that PATCHes `globalStyles` to the project API.

  updateTheme: (patch) => {
    const { theme } = get();
    if (!theme) return;
    set({ theme: { ...theme, ...patch }, isThemeDirty: true });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  selectPreset: (presetId) => {
    // getDefaultTheme builds a COMPLETE Theme from a preset id — it derives
    // full 50-950 ColorShade palettes via generateShades(), and pulls
    // preset-specific borderRadius/shadows from PRESET_THEMES. Reusing it
    // here keeps the editor consistent with AI-generated projects.
    const newTheme = getDefaultTheme(presetId);
    set({ theme: newTheme, isThemeDirty: true });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  updateColors: (colors) => {
    const { theme } = get();
    if (!theme) return;
    set({
      theme: { ...theme, colors: { ...theme.colors, ...colors } },
      isThemeDirty: true,
    });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  updateTypography: (typography) => {
    const { theme } = get();
    if (!theme) return;
    set({
      theme: { ...theme, typography: { ...theme.typography, ...typography } },
      isThemeDirty: true,
    });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  // ── Section Mutations ─────────────────────────────────────────────────

  updateSectionContent: (sectionId, content) => {
    const { pages, currentPageId, dirtySectionIds } = get();
    const newDirty = new Set(dirtySectionIds);
    newDirty.add(sectionId);

    set({
      pages: pages.map((page) =>
        page.id === currentPageId
          ? {
              ...page,
              sections: page.sections.map((s) =>
                s.id === sectionId
                  ? { ...s, content: { ...s.content, ...content } }
                  : s
              ),
            }
          : page
      ),
      isDirty: true,
      dirtySectionIds: newDirty,
    });

    // Trigger debounced save
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  updateSectionStyles: (sectionId, styles) => {
    const { pages, currentPageId, dirtySectionIds } = get();
    const newDirty = new Set(dirtySectionIds);
    newDirty.add(sectionId);

    set({
      pages: pages.map((page) =>
        page.id === currentPageId
          ? {
              ...page,
              sections: page.sections.map((s) =>
                s.id === sectionId
                  ? { ...s, styles: { ...s.styles, ...styles } }
                  : s
              ),
            }
          : page
      ),
      isDirty: true,
      dirtySectionIds: newDirty,
    });

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  updateSectionLayout: (sectionId, layout) => {
    const { pages, currentPageId, dirtySectionIds } = get();
    const newDirty = new Set(dirtySectionIds);
    newDirty.add(sectionId);

    set({
      pages: pages.map((page) =>
        page.id === currentPageId
          ? {
              ...page,
              sections: page.sections.map((s) =>
                s.id === sectionId ? { ...s, layout: layout as Section['layout'] } : s
              ),
            }
          : page
      ),
      isDirty: true,
      dirtySectionIds: newDirty,
    });

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  reorderSections: (fromIndex, toIndex) => {
    const { pages, currentPageId, dirtySectionIds } = get();
    const currentPage = pages.find((p) => p.id === currentPageId);
    if (!currentPage) return;

    const reordered = reorderFn(currentPage.sections, fromIndex, toIndex);
    const newDirty = new Set(dirtySectionIds);
    reordered.forEach((s) => newDirty.add(s.id));

    set({
      pages: pages.map((page) =>
        page.id === currentPageId ? { ...page, sections: reordered } : page
      ),
      isDirty: true,
      dirtySectionIds: newDirty,
    });

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  addSection: (type, afterSectionId) => {
    const { pages, currentPageId, dirtySectionIds } = get();
    const currentPage = pages.find((p) => p.id === currentPageId);
    if (!currentPage) return;

    const defaults = getDefaultSection(type);
    if (!defaults) return;

    // Determine insertion position
    let insertIndex = currentPage.sections.length;
    if (afterSectionId) {
      const idx = currentPage.sections.findIndex((s) => s.id === afterSectionId);
      if (idx !== -1) insertIndex = idx + 1;
    }

    const newSection: Section = {
      ...defaults,
      id: nanoid(),
      pageId: currentPageId!,
      type: type as Section['type'],
      layout: defaults.layout as Section['layout'],
      order: insertIndex,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Section;

    const newSections = [...currentPage.sections];
    newSections.splice(insertIndex, 0, newSection);
    // Update order values
    const orderedSections = newSections.map((s, i) => ({ ...s, order: i }));

    const newDirty = new Set(dirtySectionIds);
    newDirty.add(newSection.id);

    set({
      pages: pages.map((page) =>
        page.id === currentPageId ? { ...page, sections: orderedSections } : page
      ),
      selectedSectionId: newSection.id,
      isDirty: true,
      dirtySectionIds: newDirty,
    });

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  duplicateSection: (sectionId) => {
    const { pages, currentPageId, dirtySectionIds } = get();
    const currentPage = pages.find((p) => p.id === currentPageId);
    if (!currentPage) return;

    const original = currentPage.sections.find((s) => s.id === sectionId);
    if (!original) return;

    const clone = cloneSection(original);
    const insertIndex = original.order + 1;

    const newSection: Section = {
      ...clone,
      pageId: currentPageId!,
      type: clone.type as Section['type'],
      layout: clone.layout as Section['layout'],
      order: insertIndex,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Section;

    const newSections = [...currentPage.sections];
    newSections.splice(insertIndex, 0, newSection);
    const orderedSections = newSections.map((s, i) => ({ ...s, order: i }));

    const newDirty = new Set(dirtySectionIds);
    newDirty.add(newSection.id);

    set({
      pages: pages.map((page) =>
        page.id === currentPageId ? { ...page, sections: orderedSections } : page
      ),
      selectedSectionId: newSection.id,
      isDirty: true,
      dirtySectionIds: newDirty,
    });

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  deleteSection: (sectionId) => {
    const { pages, currentPageId, selectedSectionId, dirtySectionIds } = get();
    const currentPage = pages.find((p) => p.id === currentPageId);
    if (!currentPage) return;

    const filtered = currentPage.sections.filter((s) => s.id !== sectionId);
    const orderedSections = filtered.map((s, i) => ({ ...s, order: i }));

    set({
      pages: pages.map((page) =>
        page.id === currentPageId ? { ...page, sections: orderedSections } : page
      ),
      selectedSectionId: selectedSectionId === sectionId ? null : selectedSectionId,
      isDirty: true,
    });

    // Also persist the deletion via API
    const project = get().project;
    if (project) {
      fetch(`/api/projects/${project.id}/sections/${sectionId}`, {
        method: 'DELETE',
      }).catch(console.error);
    }

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  // ── Persistence ───────────────────────────────────────────────────────

  save: async () => {
    const { project, pages, currentPageId, dirtySectionIds, theme, isThemeDirty } = get();
    if (!project) return;

    const sectionsDirty = dirtySectionIds.size > 0;
    if (!sectionsDirty && !isThemeDirty) return;

    set({ isSaving: true });

    const currentPage = pages.find((p) => p.id === currentPageId);

    const dirtyIds = Array.from(dirtySectionIds);
    const sectionsToSave = currentPage
      ? (dirtyIds
          .map((id) => currentPage.sections.find((s) => s.id === id))
          .filter(Boolean) as Section[])
      : [];

    try {
      const tasks: Promise<Response>[] = [];

      // Persist dirty sections
      if (sectionsDirty) {
        tasks.push(
          ...sectionsToSave.map((section) =>
            fetch(`/api/projects/${project.id}/sections/${section.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: section.content,
                styles: section.styles,
                layout: section.layout,
                animations: section.animations,
                images: section.images,
                visibility: section.visibility,
                order: section.order,
              }),
            })
          )
        );
      }

      // Persist theme changes (globalStyles)
      if (isThemeDirty && theme) {
        tasks.push(
          fetch(`/api/projects/${project.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ globalStyles: theme }),
          })
        );
      }

      await Promise.all(tasks);

      set({
        isSaving: false,
        isDirty: false,
        isThemeDirty: false,
        dirtySectionIds: new Set(),
      });
    } catch (error) {
      console.error('Failed to save editor changes:', error);
      set({ isSaving: false });
    }
  },

  getCurrentPage: () => {
    const { pages, currentPageId } = get();
    return pages.find((p) => p.id === currentPageId);
  },

  getSectionById: (sectionId) => {
    const page = get().getCurrentPage();
    return page?.sections.find((s) => s.id === sectionId);
  },
}));
