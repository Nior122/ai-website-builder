// =============================================================================
// Sortable Section
// =============================================================================
// Wraps a section with DnD Kit's useSortable hook.
// Provides drag handle, selection/hover overlays, and section actions.
// =============================================================================

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useEditorStore } from '@/features/editor/store/editor-store';
import { SectionRenderer } from '@/features/renderer/components/section-renderer';
import type { Section } from '@/types';

// ─── Props ─────────────────────────────────────────────────────────────────

interface SortableSectionProps {
  section: Section;
  index: number;
  totalCount: number;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function SortableSection({ section, index, totalCount }: SortableSectionProps) {
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const hoveredSectionId = useEditorStore((s) => s.hoveredSectionId);
  const selectSection = useEditorStore((s) => s.selectSection);
  const hoverSection = useEditorStore((s) => s.hoverSection);
  const duplicateSection = useEditorStore((s) => s.duplicateSection);
  const deleteSection = useEditorStore((s) => s.deleteSection);
  const reorderSections = useEditorStore((s) => s.reorderSections);

  const isSelected = selectedSectionId === section.id;
  const isHovered = hoveredSectionId === section.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        selectSection(section.id);
      }}
      onMouseEnter={() => hoverSection(section.id)}
      onMouseLeave={() => hoverSection(null)}
    >
      {/* Hover Overlay */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 border-2 border-blue-400 pointer-events-none z-10" />
      )}

      {/* Selected Overlay */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-600 pointer-events-none z-10" />
      )}

      {/* Section Actions Toolbar */}
      {isSelected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 shadow-md">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-neutral-200" />

          {/* Move Up */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (index > 0) reorderSections(index, index - 1);
            }}
            disabled={index === 0}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          {/* Move Down */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (index < totalCount - 1) reorderSections(index, index + 1);
            }}
            disabled={index === totalCount - 1}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-neutral-200" />

          {/* Duplicate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateSection(section.id);
            }}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-blue-600"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteSection(section.id);
            }}
            className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Section Type Label (shown on hover) */}
      {isHovered && !isSelected && (
        <div className="absolute top-0 left-0 z-20 rounded-br-md bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white capitalize">
          {section.type}
        </div>
      )}

      {/* Actual Section Content */}
      <SectionRenderer section={section} isEditor />
    </div>
  );
}
