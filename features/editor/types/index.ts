// =============================================================================
// Editor Types
// =============================================================================

import type { Section, Page } from '@/types';

export type EditorMode = 'edit' | 'preview' | 'code';

export interface EditorState {
  mode: EditorMode;
  selectedSectionId: string | null;
  selectedPageId: string | null;
  isDragging: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  undoStack: EditorSnapshot[];
  redoStack: EditorSnapshot[];
}

export interface EditorSnapshot {
  pages: Page[];
  selectedPageId: string | null;
  timestamp: string;
}

export interface DragDropResult {
  activeId: string;
  overId: string | null;
  sourcePageId: string;
  destinationPageId: string;
  sourceIndex: number;
  destinationIndex: number;
}

export interface SectionEditPayload {
  sectionId: string;
  content?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  animations?: Record<string, unknown>;
  visibility?: SectionVisibility;
}

export interface SectionVisibility {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
}

export interface EditorToolbarAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}
