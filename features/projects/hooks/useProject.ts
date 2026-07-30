// =============================================================================
// useProject Hook
// =============================================================================
// Client-side state management for the current project being edited.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { ProjectWithPages } from '../types';

const PROJECT_KEY = '/api/projects';

// All API routes wrap responses in { success: true, data: T } via ok().
// The default SWR fetcher returns the full JSON — we need to unwrap .data.
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Fetch a single project by ID.
 */
export function useProject(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: ProjectWithPages }>(
    projectId ? `${PROJECT_KEY}/${projectId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    project: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    refresh: () => mutate(),
  };
}

/**
 * Fetch the list of projects.
 *
 * The GET /api/projects endpoint returns Prisma model objects which use
 * `updatedAt` (ISO string) and `_count.pages`, but the ProjectCard
 * component expects `lastEditedAt` and `pageCount`.  We map here so the
 * UI doesn't crash on undefined fields.
 */
export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Array<Record<string, unknown>> }>(
    PROJECT_KEY,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const projects: Array<ProjectWithPages & { pageCount: number }> = (data?.data ?? []).map(
    (item: Record<string, unknown>) => ({
      ...item,
      lastEditedAt: (item as any).lastEditedAt ?? (item as any).updatedAt,
      pageCount: (item as any).pageCount ?? (item as any)._count?.pages ?? 0,
    } as unknown as ProjectWithPages & { pageCount: number })
  );

  return {
    projects,
    isLoading,
    isError: !!error,
    error,
    refresh: () => mutate(),
  };
}

/**
 * Optimistic update helpers for project mutations.
 */
export function useProjectMutations(projectId: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const saveProject = useCallback(
    async (data: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        const response = await fetch(`${PROJECT_KEY}/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to save');

        setLastSavedAt(new Date().toISOString());
        return true;
      } catch (error) {
        console.error('Save failed:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId]
  );

  const deleteProject = useCallback(async () => {
    const response = await fetch(`${PROJECT_KEY}/${projectId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete');
    return true;
  }, [projectId]);

  return {
    saveProject,
    deleteProject,
    isSaving,
    lastSavedAt,
  };
}
