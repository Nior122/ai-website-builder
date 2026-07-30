// =============================================================================
// Sortable Container
// =============================================================================
// DnD Context provider that wraps the canvas sections.
// Handles drag detection, collision detection, and drop reordering.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useEditorStore } from '@/features/editor/store/editor-store';
import type { Section } from '@/types';

// ─── Props ─────────────────────────────────────────────────────────────────

interface SortableContainerProps {
  children: React.ReactNode;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function SortableContainer({ children }: SortableContainerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reorderSections = useEditorStore((s) => s.reorderSections);
  const currentPage = useEditorStore((s) => s.getCurrentPage());

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Section IDs for SortableContext
  const sectionIds = currentPage?.sections.map((s) => s.id) ?? [];

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const sections = currentPage?.sections ?? [];
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSections(oldIndex, newIndex);
      }
    },
    [currentPage, reorderSections]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// ─── Drag Preview ──────────────────────────────────────────────────────────

interface SectionDragPreviewProps {
  section: Section;
}

export function SectionDragPreview({ section }: SectionDragPreviewProps) {
  return (
    <div className="rounded-lg border-2 border-blue-500 bg-white/90 px-4 py-2 shadow-lg">
      <span className="text-xs font-medium text-blue-600 capitalize">
        {section.type}
      </span>
    </div>
  );
}
