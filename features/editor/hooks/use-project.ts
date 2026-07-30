// =============================================================================
// useProject — SWR Hook for Project Data
// =============================================================================
// Fetches project with pages and sections. Returns typed data with
// loading state, error, and mutate for cache invalidation.
// =============================================================================

'use client';

import useSWR from 'swr';
import type { Project, Page, Section } from '@/types';

// ─── Fetcher ───────────────────────────────────────────────────────────────

async function fetchProject(url: string): Promise<ProjectData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch project');
  const json = await res.json();
  return json.data;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProjectData {
  project: Project;
  pages: PageWithSections[];
}

export type PageWithSections = Page & {
  sections: SectionWithParsedJSON[];
};

export type SectionWithParsedJSON = Section & {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  animations: unknown[];
  images: unknown[];
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useProject(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProjectData>(
    projectId ? `/api/projects/${projectId}` : null,
    fetchProject,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }
  );

  return {
    project: data?.project ?? null,
    pages: data?.pages ?? [],
    isLoading,
    error,
    mutate,
  };
}
