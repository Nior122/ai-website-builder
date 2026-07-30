// =============================================================================
// General Settings Panel
// =============================================================================
// Project-level settings: name, description, language, password protection,
// and maintenance mode. These fields are persisted via the useSettings hook
// which PATCHes the existing /api/projects/[id] route.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { useSettings } from '../../hooks/use-settings';
import type { ProjectSettings } from '@/types';
import { Lock, Globe, ShieldOff } from 'lucide-react';

// ─── Component ─────────────────────────────────────────────────────────────

export function GeneralSettings() {
  const project = useEditorStore((s) => s.project);
  const { updateProject, updateSettings } = useSettings();

  if (!project) return null;

  const settings = project.settings as ProjectSettings;

  return (
    <div className="flex flex-col gap-5 p-3">
      {/* Project Name */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Project Name
        </label>
        <input
          type="text"
          value={project.name}
          onChange={(e) => updateProject({ name: e.target.value })}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </section>

      {/* Description */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Description
        </label>
        <textarea
          value={project.description ?? ''}
          onChange={(e) => updateProject({ description: e.target.value })}
          rows={3}
          placeholder="Brief description of your project"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
        />
      </section>

      {/* Language */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Language
        </label>
        <select
          value={settings.language}
          onChange={(e) => updateSettings({ language: e.target.value })}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="pt">Portuguese</option>
          <option value="ar">Arabic</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </section>

      {/* Text Direction */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Text Direction
        </label>
        <div className="flex gap-2">
          {(['ltr', 'rtl'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => updateSettings({ direction: dir })}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                settings.direction === dir
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              {dir.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <div className="h-px bg-neutral-200" />

      {/* Password Protection */}
      <section>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-neutral-500" />
            <span className="text-xs font-medium text-neutral-700">
              Password Protection
            </span>
          </div>
          <button
            onClick={() =>
              updateSettings({ passwordProtection: !settings.passwordProtection })
            }
            className={`relative h-5 w-9 rounded-full transition-colors ${
              settings.passwordProtection ? 'bg-blue-600' : 'bg-neutral-300'
            }`}
            role="switch"
            aria-checked={settings.passwordProtection}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                settings.passwordProtection ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {settings.passwordProtection && (
          <div className="mt-2">
            <input
              type="password"
              value={settings.passwordHash ?? ''}
              onChange={(e) => updateSettings({ passwordHash: e.target.value })}
              placeholder="Set a password for published site"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <p className="mt-1 text-[10px] text-neutral-400">
              Visitors will need to enter this password to view the published site.
            </p>
          </div>
        )}
      </section>

      {/* Maintenance Mode */}
      <section>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-neutral-500" />
            <span className="text-xs font-medium text-neutral-700">
              Maintenance Mode
            </span>
          </div>
          <button
            onClick={() =>
              updateSettings({ maintenanceMode: !settings.maintenanceMode })
            }
            className={`relative h-5 w-9 rounded-full transition-colors ${
              settings.maintenanceMode ? 'bg-amber-500' : 'bg-neutral-300'
            }`}
            role="switch"
            aria-checked={settings.maintenanceMode}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                settings.maintenanceMode ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-neutral-400">
          Show a maintenance page to visitors while you work on the site.
        </p>
      </section>
    </div>
  );
}
