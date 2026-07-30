// =============================================================================
// Add Section Panel
// =============================================================================
// Searchable list of available section types grouped by category.
// Click to add a section to the current page.
// =============================================================================

'use client';

import { useState, useMemo } from 'react';
import { useEditorStore } from '@/features/editor/store/editor-store';
import { SECTION_TYPES } from '@/lib/constants';
import { Search, Plus } from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────

interface AddSectionProps {
  afterSectionId?: string | null;
}

// ─── Category Labels ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  hero: 'Hero',
  content: 'Content',
  social: 'Social Proof',
  commerce: 'Commerce',
  forms: 'Forms & Newsletter',
  media: 'Media',
  utility: 'Utility',
  layout: 'Layout',
};

// ─── Component ─────────────────────────────────────────────────────────────

export function AddSection({ afterSectionId }: AddSectionProps) {
  const [search, setSearch] = useState('');
  const addSection = useEditorStore((s) => s.addSection);

  // Group sections by category
  const groupedSections = useMemo(() => {
    const filtered = search
      ? SECTION_TYPES.filter(
          (st) =>
            st.label.toLowerCase().includes(search.toLowerCase()) ||
            st.category.toLowerCase().includes(search.toLowerCase())
        )
      : SECTION_TYPES;

    const groups: Record<string, typeof SECTION_TYPES[number][]> = {};
    for (const st of filtered) {
      if (!groups[st.category]) groups[st.category] = [];
      groups[st.category].push(st);
    }
    return groups;
  }, [search]);

  const handleAdd = (type: string) => {
    addSection(type as any, afterSectionId ?? undefined);
  };

  return (
    <div className="border-t border-neutral-200 p-3">
      <div className="mb-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Add Section
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search sections…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Grouped Sections */}
      <div className="space-y-3">
        {Object.entries(groupedSections).map(([category, types]) => (
          <div key={category}>
            <div className="mb-1 px-1 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
              {CATEGORY_LABELS[category] || category}
            </div>
            <div className="space-y-0.5">
              {types.map((st) => (
                <button
                  key={st.value}
                  onClick={() => handleAdd(st.value)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <span className="text-base">{st.icon}</span>
                  <span className="flex-1 text-xs font-medium">{st.label}</span>
                  <Plus className="h-3.5 w-3.5 text-neutral-400" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
