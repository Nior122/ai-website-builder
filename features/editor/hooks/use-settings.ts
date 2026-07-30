// =============================================================================
// useSettings Hook
// =============================================================================
// Handles persisting project settings (settings JSON, seo JSON, top-level
// fields) via the existing PATCH /api/projects/[id] route. Each mutation
// merges the partial into the local store immediately (optimistic) and fires
// a debounced PATCH to the API. The store's `save()` is triggered on every
// mutation so the toolbar's dirty state stays accurate.
//
// The hook reads/writes through the Zustand editor store so all settings
// changes are reflected immediately in the canvas and sidebar.
// =============================================================================

'use client';

import { useCallback } from 'react';
import { useEditorStore } from '@/features/editor/store/editor-store';
import type { ProjectSettings, SEOConfig } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────

type SettingsPartial = Partial<ProjectSettings>;
type SeoPartial = Partial<SEOConfig>;

interface UseSettingsReturn {
  updateSettings: (patch: SettingsPartial) => void;
  updateSeo: (patch: SeoPartial) => void;
  updateProject: (fields: { name?: string; description?: string; customDomain?: string | null; thumbnailUrl?: string | null }) => void;
  saveSettings: () => Promise<void>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useSettings(): UseSettingsReturn {
  const project = useEditorStore((s) => s.project);

  // We need direct store access for the mutations (not selectors, to avoid
  // stale closures from the render cycle).
  const getStore = useEditorStore.getState;

  const updateSettings = useCallback(
    (patch: SettingsPartial) => {
      const current = getStore();
      if (!current.project) return;

      const currentSettings = current.project.settings;
      const merged: ProjectSettings = { ...currentSettings, ...patch };

      useEditorStore.setState({
        project: { ...current.project, settings: merged },
        isDirty: true,
      });

      // Schedule debounced API persistence
      scheduleSettingsPatch(current.project.id, { settings: merged });
    },
    [getStore]
  );

  const updateSeo = useCallback(
    (patch: SeoPartial) => {
      const current = getStore();
      if (!current.project) return;

      const currentSeo = current.project.seo;
      const merged: SEOConfig = { ...currentSeo, ...patch };

      useEditorStore.setState({
        project: { ...current.project, seo: merged },
        isDirty: true,
      });

      scheduleSettingsPatch(current.project.id, { seo: merged });
    },
    [getStore]
  );

  const updateProject = useCallback(
    (fields: { name?: string; description?: string; customDomain?: string | null }) => {
      const current = getStore();
      if (!current.project) return;

      // Optimistic local update
      const updatedProject = { ...current.project, ...fields };
      useEditorStore.setState({
        project: updatedProject,
        isDirty: true,
      });

      // API persistence
      scheduleProjectPatch(current.project.id, fields);
    },
    [getStore]
  );

  const saveSettings = useCallback(async () => {
    const current = getStore();
    if (!current.project) return;

    await persistSettingsPatch(current.project.id, {
      settings: current.project.settings,
      seo: current.project.seo,
    });

    useEditorStore.setState({ isDirty: false });
  }, [getStore]);

  return { updateSettings, updateSeo, updateProject, saveSettings };
}

// ─── Debounced Persistence ─────────────────────────────────────────────────

const SETTINGS_DEBOUNCE_MS = 1500;
let settingsTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSettingsPayload: Record<string, unknown> | null = null;
let pendingProjectId: string | null = null;

function scheduleSettingsPatch(projectId: string, payload: Record<string, unknown>) {
  pendingProjectId = projectId;
  pendingSettingsPayload = { ...pendingSettingsPayload, ...payload };

  if (settingsTimeout) clearTimeout(settingsTimeout);
  settingsTimeout = setTimeout(() => {
    if (pendingProjectId && pendingSettingsPayload) {
      persistSettingsPatch(pendingProjectId, pendingSettingsPayload);
      pendingSettingsPayload = null;
      pendingProjectId = null;
    }
  }, SETTINGS_DEBOUNCE_MS);
}

async function persistSettingsPatch(
  projectId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[useSettings] Failed to persist settings:', err);
  }
}

const PROJECT_DEBOUNCE_MS = 1500;
let projectTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingProjectPayload: Record<string, unknown> | null = null;
let pendingProjectId2: string | null = null;

function scheduleProjectPatch(projectId: string, fields: Record<string, unknown>) {
  pendingProjectId2 = projectId;
  pendingProjectPayload = { ...pendingProjectPayload, ...fields };

  if (projectTimeout) clearTimeout(projectTimeout);
  projectTimeout = setTimeout(() => {
    if (pendingProjectId2 && pendingProjectPayload) {
      persistSettingsPatch(pendingProjectId2, pendingProjectPayload);
      pendingProjectPayload = null;
      pendingProjectId2 = null;
    }
  }, PROJECT_DEBOUNCE_MS);
}
