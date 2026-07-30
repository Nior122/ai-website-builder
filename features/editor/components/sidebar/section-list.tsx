// =============================================================================
// Section List Panel
// =============================================================================
// Lists all sections in the current page with drag handles and actions.
// Click to select, drag to reorder.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { SECTION_TYPES } from '@/lib/constants';
import { GripVertical, Trash2, Eye, EyeOff, Copy } from 'lucide-react';

// ─── Section Type Label Map ────────────────────────────────────────────────

const SECTION_LABELS: Record<string, { label: string; icon: string }> = {};
for (const st of SECTION_TYPES) {
  SECTION_LABELS[st.value] = { label: st.label, icon: st.icon };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function SectionList() {
  const currentPage = useEditorStore((s) => s.getCurrentPage());
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const selectSection = useEditorStore((s) => s.selectSection);
  const deleteSection = useEditorStore((s) => s.deleteSection);
  const duplicateSection = useEditorStore((s) => s.duplicateSection);
  const reorderSections = useEditorStore((s) => s.reorderSections);

  const sections = currentPage?.sections ?? [];
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  if (sortedSections.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-neutral-500">
        <p>No sections yet. Add one below.</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Sections ({sortedSections.length})
      </div>
      <div className="space-y-1">
        {sortedSections.map((section, index) => {
          const meta = SECTION_LABELS[section.type] || { label: section.type, icon: '📄' };
          const isSelected = selectedSectionId === section.id;

          return (
            <div
              key={section.id}
              onClick={() => selectSection(section.id)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {/* Drag Handle */}
              <GripVertical className="h-4 w-4 flex-shrink-0 text-neutral-300" />

              {/* Icon + Label */}
              <span className="flex-1 truncate">
                <span className="mr-1.5">{meta.icon}</span>
                {meta.label}
              </span>

              {/* Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle visibility — for now just show indicator
                }}
                className="flex-shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-600"
                title="Toggle visibility"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              {/* Duplicate */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateSection(section.id);
                }}
                className="flex-shrink-0 rounded p-0.5 text-neutral-400 hover:text-blue-600"
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(section.id);
                }}
                className="flex-shrink-0 rounded p-0.5 text-neutral-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
