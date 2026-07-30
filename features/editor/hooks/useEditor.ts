// =============================================================================
// useEditor Hook
// =============================================================================
// Core editor state management with undo/redo, auto-save, and section selection.
// =============================================================================

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Page, Section } from '@/types';
import type { EditorMode, EditorSnapshot } from '../types';
import { createSnapshot } from '../utils';
import { EDITOR_CONFIG } from '@/lib/constants';

const MAX_HISTORY = EDITOR_CONFIG.maxHistoryEntries;
const AUTOSAVE_DELAY = EDITOR_CONFIG.autoSaveDelayMs;

export function useEditor(initialPages: Page[], projectId: string) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialPages[0]?.id ?? null
  );
  const [mode, setMode] = useState<EditorMode>('edit');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Push to undo stack on change
  const pushHistory = useCallback(() => {
    const snapshot = createSnapshot(pages, selectedPageId);
    setUndoStack((prev) => {
      const next = [...prev, snapshot];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, [pages, selectedPageId]);

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const currentSnapshot = createSnapshot(pages, selectedPageId);
    const previous = undoStack[undoStack.length - 1];

    setRedoStack((prev) => [...prev, currentSnapshot]);
    setUndoStack((prev) => prev.slice(0, -1));
    setPages(previous.pages);
    setSelectedPageId(previous.selectedPageId);
  }, [undoStack, pages, selectedPageId]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const currentSnapshot = createSnapshot(pages, selectedPageId);
    const next = redoStack[redoStack.length - 1];

    setUndoStack((prev) => [...prev, currentSnapshot]);
    setRedoStack((prev) => prev.slice(0, -1));
    setPages(next.pages);
    setSelectedPageId(next.selectedPageId);
  }, [redoStack, pages, selectedPageId]);

  // Update a section's content
  const updateSection = useCallback(
    (sectionId: string, content: Record<string, unknown>) => {
      pushHistory();
      setPages((prev) =>
        prev.map((page) => ({
          ...page,
          sections: page.sections.map((section) =>
            section.id === sectionId
              ? { ...section, content: { ...section.content, ...content } }
              : section
          ),
        }))
      );
      setIsDirty(true);
    },
    [pushHistory]
  );

  // Reorder sections within a page
  const reorderSections = useCallback(
    (pageId: string, fromIndex: number, toIndex: number) => {
      pushHistory();
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== pageId) return page;
          const sections = [...page.sections];
          const [removed] = sections.splice(fromIndex, 1);
          sections.splice(toIndex, 0, removed);
          return { ...page, sections };
        })
      );
      setIsDirty(true);
    },
    [pushHistory]
  );

  // Add a new section
  const addSection = useCallback(
    (pageId: string, section: Section, afterIndex?: number) => {
      pushHistory();
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== pageId) return page;
          const sections = [...page.sections];
          const insertIndex = afterIndex !== undefined ? afterIndex + 1 : sections.length;
          sections.splice(insertIndex, 0, section);
          return { ...page, sections };
        })
      );
      setIsDirty(true);
    },
    [pushHistory]
  );

  // Delete a section
  const deleteSection = useCallback(
    (sectionId: string) => {
      pushHistory();
      setPages((prev) =>
        prev.map((page) => ({
          ...page,
          sections: page.sections.filter((s) => s.id !== sectionId),
        }))
      );
      setSelectedSectionId(null);
      setIsDirty(true);
    },
    [pushHistory]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return {
    pages,
    setPages,
    selectedSectionId,
    setSelectedSectionId,
    selectedPageId,
    setSelectedPageId,
    mode,
    setMode,
    isDirty,
    isSaving,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undo,
    redo,
    updateSection,
    reorderSections,
    addSection,
    deleteSection,
  };
}
