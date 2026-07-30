// =============================================================================
// Project Utilities
// =============================================================================

import type { ProjectStatus } from '../types';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-amber-100 text-amber-700',
};

export function getStatusColor(status: ProjectStatus): string {
  return STATUS_COLORS[status];
}

export function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function getProjectUrl(projectId: string): string {
  return `/editor/${projectId}`;
}

export function getProjectPreviewUrl(projectSlug: string): string {
  return `/preview/${projectSlug}`;
}
