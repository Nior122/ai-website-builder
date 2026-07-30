// =============================================================================
// Editor Canvas
// =============================================================================
// Center canvas that renders sections with DnD sortable wrappers.
// Click on empty space deselects all sections.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { SortableContainer } from './sortable-container';
import { SortableSection } from './sortable-section';
import ThemeProvider from '@/features/renderer/providers/theme-provider';
import { Plus } from 'lucide-react';
import type { Theme } from '@/types';

// ─── Props ─────────────────────────────────────────────────────────────────

interface EditorCanvasProps {
  theme: Theme;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function EditorCanvas({ theme }: EditorCanvasProps) {
  const currentPage = useEditorStore((s) => s.getCurrentPage());
  const selectSection = useEditorStore((s) => s.selectSection);
  const setSidebarTab = useEditorStore((s) => s.setSidebarTab);

  const sections = currentPage?.sections ?? [];
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div
      className="min-h-full bg-neutral-100 p-6"
      onClick={() => selectSection(null)}
    >
      <div className="mx-auto max-w-4xl">
        {/*
          Wrap rendered sections in ThemeProvider so the live theme (edited in
          the Theme sidebar tab) injects CSS variables into the canvas. The
          outer editor chrome keeps its neutral background so the canvas
          remains visually distinct from the page content.
        */}
        <ThemeProvider theme={theme}>
          <div
            className="overflow-hidden rounded-xl bg-white shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <SortableContainer>
              {sortedSections.length > 0 ? (
                sortedSections.map((section, index) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    index={index}
                    totalCount={sortedSections.length}
                  />
                ))
              ) : (
                <EmptyCanvas onAddSection={() => setSidebarTab('sections')} />
              )}
            </SortableContainer>

            {/* Add Section Button */}
            {sortedSections.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarTab('sections');
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 py-8 text-sm text-neutral-500 transition-colors hover:border-blue-400 hover:text-blue-600"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </button>
            )}
          </div>
        </ThemeProvider>
      </div>
    </div>
  );
}

// ─── Empty Canvas ──────────────────────────────────────────────────────────

function EmptyCanvas({ onAddSection }: { onAddSection: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white py-20">
      <div className="text-center">
        <h3 className="text-lg font-medium text-neutral-900">No sections yet</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Add your first section to start building your page.
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSection();
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>
    </div>
  );
}
