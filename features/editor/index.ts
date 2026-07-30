// =============================================================================
// Editor Feature — Barrel Exports
// =============================================================================
// Visual editor for sections: drag-and-drop reordering, properties panel,
// content editing, style editing, and theme customization. All state managed
// via Zustand store.
// =============================================================================

// ─── Store ─────────────────────────────────────────────────────────────────

export { useEditorStore } from './store/editor-store';
export type { EditorState } from './store/editor-store';

// ─── Hooks ─────────────────────────────────────────────────────────────────

export { useProject } from './hooks/use-project';
export type { ProjectData, PageWithSections, SectionWithParsedJSON } from './hooks/use-project';
export { useUpdateSection, useDeleteSection, useReorderSections } from './hooks/use-section-mutation';

// ─── Components ────────────────────────────────────────────────────────────

export { EditorLayout } from './components/editor-layout';
export { EditorToolbar } from './components/editor-toolbar';
export { EditorCanvas } from './components/editor-canvas';
export { SortableSection } from './components/sortable-section';
export { SortableContainer } from './components/sortable-container';

// Sidebar
export { SectionList } from './components/sidebar/section-list';
export { AddSection } from './components/sidebar/add-section';
export { PageList } from './components/sidebar/page-list';

// Theme Editor
export { ThemeEditor } from './components/theme-editor/theme-editor';
export { ColorEditor } from './components/theme-editor/color-editor';
export { TypographyEditor } from './components/theme-editor/typography-editor';

// Properties Panel
export { PropertiesPanel } from './components/properties-panel/properties-panel';
export { ContentEditor } from './components/properties-panel/content-editor';
export { StyleEditor } from './components/properties-panel/style-editor';
