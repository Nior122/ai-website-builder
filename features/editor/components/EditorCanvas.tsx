// =============================================================================
// EditorCanvas
// =============================================================================
// Main editing surface for the website builder. Renders sections in order
// and handles section selection and drag-and-drop reordering.
// =============================================================================

'use client';

import { useState } from 'react';
import type { Section, Theme } from '@/types';
import { cn } from '@/utils/cn';
import { GripVertical, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

interface EditorCanvasProps {
  sections: Section[];
  theme: Theme;
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onDeleteSection: (id: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;
  isPreview?: boolean;
}

export function EditorCanvas({
  sections,
  theme,
  selectedSectionId,
  onSelectSection,
  onDeleteSection,
  onReorderSections,
  isPreview = false,
}: EditorCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-2xl bg-neutral-100 p-6">
          <Pencil className="mb-3 h-8 w-8 text-neutral-400 mx-auto" />
          <h3 className="text-lg font-semibold text-neutral-700">No sections yet</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Add sections from the sidebar to start building your page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative min-h-[400px] w-full', isPreview && 'pointer-events-none')}>
      {sections.map((section, index) => {
        const isSelected = section.id === selectedSectionId;
        const isDragging = draggedIndex === index;

        return (
          <div
            key={section.id}
            data-section-id={section.id}
            draggable={!isPreview}
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedIndex !== null && draggedIndex !== index) {
                onReorderSections(draggedIndex, index);
              }
              setDraggedIndex(null);
            }}
            onDragEnd={() => setDraggedIndex(null)}
            onClick={(e) => {
              if (!isPreview) {
                e.stopPropagation();
                onSelectSection(section.id);
              }
            }}
            className={cn(
              'group relative border-2 border-transparent transition-all',
              isSelected && 'border-blue-500 ring-2 ring-blue-500/20',
              !isPreview && 'hover:border-blue-300 cursor-pointer',
              isDragging && 'opacity-50'
            )}
          >
            {/* Section controls */}
            {!isPreview && (
              <div
                className={cn(
                  'absolute -left-10 top-2 flex flex-col gap-1 transition-opacity',
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              >
                <button
                  className="rounded bg-white p-1 shadow-sm hover:bg-neutral-100 cursor-grab"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4 text-neutral-400" />
                </button>
              </div>
            )}

            {/* Section type badge */}
            {!isPreview && isSelected && (
              <div className="absolute -top-3 left-4 rounded bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                {section.type}
              </div>
            )}

            {/* Section content placeholder */}
            <div
              className="min-h-[120px] p-6"
              style={
                {
                  '--color-primary': theme.colors.primary,
                  '--color-secondary': theme.colors.secondary,
                } as React.CSSProperties
              }
            >
              <div className="text-sm text-neutral-400 italic">
                Section: {section.type} ({section.layout})
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
