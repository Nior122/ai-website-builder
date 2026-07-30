// =============================================================================
// Properties Panel
// =============================================================================
// Right sidebar that shows editing controls for the selected section.
// Tabs: Content, Style, Visibility.
// =============================================================================

'use client';

import { useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editor-store';
import { SECTION_TYPES } from '@/lib/constants';
import { ContentEditor } from './content-editor';
import { StyleEditor } from './style-editor';
import { X, Type, Palette, Eye } from 'lucide-react';

// ─── Tab Config ────────────────────────────────────────────────────────────

type PanelTab = 'content' | 'style' | 'visibility';

const TABS: Array<{ key: PanelTab; label: string; icon: React.ReactNode }> = [
  { key: 'content', label: 'Content', icon: <Type className="h-3.5 w-3.5" /> },
  { key: 'style', label: 'Style', icon: <Palette className="h-3.5 w-3.5" /> },
  { key: 'visibility', label: 'Visibility', icon: <Eye className="h-3.5 w-3.5" /> },
];

// ─── Component ─────────────────────────────────────────────────────────────

export function PropertiesPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>('content');
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const getSectionById = useEditorStore((s) => s.getSectionById);
  const selectSection = useEditorStore((s) => s.selectSection);
  const updateSectionStyles = useEditorStore((s) => s.updateSectionStyles);

  const section = selectedSectionId ? getSectionById(selectedSectionId) : null;
  if (!section) return null;

  const meta = SECTION_TYPES.find((st) => st.value === section.type);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900 capitalize">
            {meta?.icon} {meta?.label || section.type}
          </div>
          <div className="text-[11px] text-neutral-400">
            {section.layout} layout
          </div>
        </div>
        <button
          onClick={() => selectSection(null)}
          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'content' && <ContentEditor section={section} />}
        {activeTab === 'style' && <StyleEditor section={section} />}
        {activeTab === 'visibility' && (
          <VisibilityEditor
            sectionId={section.id}
            visibility={section.visibility}
            onUpdate={(visibility) =>
              updateSectionStyles(section.id, { visibility: visibility } as any)
            }
          />
        )}
      </div>
    </div>
  );
}

// ─── Visibility Editor ─────────────────────────────────────────────────────

function VisibilityEditor({
  sectionId,
  visibility,
  onUpdate,
}: {
  sectionId: string;
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  onUpdate: (v: Record<string, boolean>) => void;
}) {
  const devices = [
    { key: 'desktop', label: 'Desktop' },
    { key: 'tablet', label: 'Tablet' },
    { key: 'mobile', label: 'Mobile' },
  ] as const;

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Device Visibility
      </div>
      {devices.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
        >
          <span className="text-sm text-neutral-700">{label}</span>
          <input
            type="checkbox"
            checked={visibility[key]}
            onChange={(e) => onUpdate({ ...visibility, [key]: e.target.checked })}
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      ))}
    </div>
  );
}
