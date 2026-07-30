// =============================================================================
// Editor Settings Panel
// =============================================================================
// Tabbed settings panel that replaces the placeholder text in the editor
// sidebar's "Settings" tab. Composed of five sub-panels:
//   1. General — name, description, language, password protection, maintenance
//   2. SEO     — meta tags, OG image, keywords, noIndex/noFollow
//   3. Media   — favicon, project thumbnail
//   4. Custom Code — CSS, <head> HTML, analytics ID
//   5. Domains — custom domain input, DNS instructions
//
// Each tab is a self-contained panel that reads/writes through the Zustand
// editor store + useSettings hook (which debounced-PATCHes the API).
// =============================================================================

'use client';

import { useState } from 'react';
import { GeneralSettings } from './general-settings';
import { SeoSettings } from './seo-settings';
import { MediaSettings } from './media-settings';
import { CustomCodeSettings } from './custom-code-settings';
import { DomainSettings } from './domain-settings';
import { Settings, Search, Image, Code, Globe } from 'lucide-react';

// ─── Tab Definitions ───────────────────────────────────────────────────────

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'domains', label: 'Domains', icon: Globe },
] as const;

type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

// ─── Component ─────────────────────────────────────────────────────────────

export function EditorSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex border-b border-neutral-200 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 whitespace-nowrap px-2.5 py-2 text-[10px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'seo' && <SeoSettings />}
        {activeTab === 'media' && <MediaSettings />}
        {activeTab === 'code' && <CustomCodeSettings />}
        {activeTab === 'domains' && <DomainSettings />}
      </div>
    </div>
  );
}
