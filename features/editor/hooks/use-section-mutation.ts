// =============================================================================
// useSectionMutation — SWR-based Section Mutation Hooks
// =============================================================================
// Provides useUpdateSection, useDeleteSection, and useReorderSections.
// Each calls the appropriate API route and invalidates the project cache.
// =============================================================================

'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import type { Section, SectionStyles } from '@/types';

// ─── Mutation Helpers ──────────────────────────────────────────────────────

export function useUpdateSection(projectId: string | null) {
  const { mutate } = useSWR(projectId ? `/api/projects/${projectId}` : null);

  const updateSection = useCallback(
    async (
      sectionId: string,
      data: {
        content?: Record<string, unknown>;
        styles?: Partial<SectionStyles>;
        layout?: string;
        animations?: unknown[];
        images?: unknown[];
        visibility?: { desktop: boolean; tablet: boolean; mobile: boolean };
        order?: number;
      }
    ): Promise<Section | null> => {
      if (!projectId) return null;

      try {
        const res = await fetch(`/api/projects/${projectId}/sections/${sectionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Failed to update section');

        const json = await res.json();
        await mutate(); // Invalidate cache
        return json.data;
      } catch (error) {
        console.error('useUpdateSection error:', error);
        return null;
      }
    },
    [projectId, mutate]
  );

  return { updateSection };
}

export function useDeleteSection(projectId: string | null) {
  const { mutate } = useSWR(projectId ? `/api/projects/${projectId}` : null);

  const deleteSection = useCallback(
    async (sectionId: string): Promise<boolean> => {
      if (!projectId) return false;

      try {
        const res = await fetch(`/api/projects/${projectId}/sections/${sectionId}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete section');

        await mutate(); // Invalidate cache
        return true;
      } catch (error) {
        console.error('useDeleteSection error:', error);
        return false;
      }
    },
    [projectId, mutate]
  );

  return { deleteSection };
}

export function useReorderSections(projectId: string | null) {
  const { mutate } = useSWR(projectId ? `/api/projects/${projectId}` : null);

  const reorderSections = useCallback(
    async (
      updates: Array<{ sectionId: string; order: number }>
    ): Promise<boolean> => {
      if (!projectId) return false;

      try {
        // PATCH each section's order
        await Promise.all(
          updates.map(({ sectionId, order }) =>
            fetch(`/api/projects/${projectId}/sections/${sectionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order }),
            })
          )
        );

        await mutate(); // Invalidate cache
        return true;
      } catch (error) {
        console.error('useReorderSections error:', error);
        return false;
      }
    },
    [projectId, mutate]
  );

  return { reorderSections };
}
