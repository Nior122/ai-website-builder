// =============================================================================
// Editor Layout
// =============================================================================
// 3-column editor layout: sidebar (left) | canvas (center) | properties panel (right).
// Initializes the Zustand store with project data on mount.
// =============================================================================

'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/features/editor/store/editor-store';
import { EditorToolbar } from './editor-toolbar';
import { EditorCanvas } from './editor-canvas';
import { PropertiesPanel } from './properties-panel/properties-panel';
import { SectionList } from './sidebar/section-list';
import { AddSection } from './sidebar/add-section';
import { PageList } from './sidebar/page-list';
import { ThemeEditor } from './theme-editor/theme-editor';
import { EditorSettings } from './settings/editor-settings';
import type { Project, Page, Theme } from '@/types';

// ─── Props ─────────────────────────────────────────────────────────────────

interface EditorLayoutProps {
  project: Project;
  pages: Page[];
  theme: Theme;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function EditorLayout({ project, pages, theme }: EditorLayoutProps) {
  const initialize = useEditorStore((s) => s.initialize);
  const sidebarTab = useEditorStore((s) => s.sidebarTab);
  const propertiesPanelOpen = useEditorStore((s) => s.propertiesPanelOpen);
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  // Read the live theme from the store so mutations (preset/color/typography)
  // re-render the canvas and sidebar controls immediately.
  const liveTheme = useEditorStore((s) => s.theme);

  // Initialize store on mount — seed the theme from the server-rendered value.
  useEffect(() => {
    initialize(project, pages, theme);
  }, [project, pages, theme, initialize]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      {/* Top Toolbar */}
      <EditorToolbar project={project} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — 280px */}
        <aside className="flex w-[280px] flex-col border-r border-neutral-200 bg-white">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-neutral-200">
            <SidebarTab tab="sections" label="Sections" />
            <SidebarTab tab="pages" label="Pages" />
            <SidebarTab tab="theme" label="Theme" />
            <SidebarTab tab="settings" label="Settings" />
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'sections' && (
              <>
                <SectionList />
                <AddSection afterSectionId={selectedSectionId} />
              </>
            )}
            {sidebarTab === 'pages' && <PageList />}
            {sidebarTab === 'theme' && <ThemeEditor />}
            {sidebarTab === 'settings' && <EditorSettings />}
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 overflow-y-auto">
          <EditorCanvas theme={liveTheme ?? theme} />
        </main>

        {/* Right Properties Panel — 320px */}
        {propertiesPanelOpen && selectedSectionId && (
          <aside className="w-[320px] border-l border-neutral-200 bg-white">
            <PropertiesPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar Tab Button ────────────────────────────────────────────────────

function SidebarTab({
  tab,
  label,
}: {
  tab: 'sections' | 'pages' | 'theme' | 'settings';
  label: string;
}) {
  const activeTab = useEditorStore((s) => s.sidebarTab);
  const setSidebarTab = useEditorStore((s) => s.setSidebarTab);
  const isActive = activeTab === tab;

  return (
    <button
      onClick={() => setSidebarTab(tab)}
      className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
        isActive
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'text-neutral-500 hover:text-neutral-700'
      }`}
    >
      {label}
    </button>
  );
}
