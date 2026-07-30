// =============================================================================
// Project Types
// =============================================================================

import type { Project, Page, Section } from '@/types';

export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface ProjectWithPages extends Project {
  pages: PageWithSections[];
  pageCount: number;
}

export interface PageWithSections extends Page {
  sections: Section[];
  sectionCount: number;
}

export interface ProjectCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string;
  status: ProjectStatus;
  thumbnailUrl: string | null;
  pageCount: number;
  lastEditedAt: string;
  createdAt: string;
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
  industry?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}
