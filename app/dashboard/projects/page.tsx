// =============================================================================
// Projects Dashboard Page
// =============================================================================
// Main dashboard view showing project list with search, filters, and stats.
// Uses SWR for real-time data and optimistic updates for actions.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/features/projects/hooks/useProject';
import {
  DashboardHeader,
  StatsOverview,
  ProjectCard,
  EmptyState,
  NewProjectDialog,
} from '@/features/dashboard/components';
import type { ProjectCard as ProjectCardType, ProjectStatus } from '@/features/projects/types';

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, refresh } = useProjects();
  const [showNewProject, setShowNewProject] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) refresh();
    },
    [refresh]
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
      if (res.ok) refresh();
    },
    [refresh]
  );

  return (
    <div>
      <DashboardHeader onNewProject={() => setShowNewProject(true)} />

      <StatsOverview />

      {/* ─── Filters ────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Content ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-neutral-200 bg-white">
              <div className="h-40 bg-neutral-100 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 rounded bg-neutral-100" />
                <div className="h-3 w-full rounded bg-neutral-100" />
                <div className="h-3 w-1/2 rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState onNewProject={() => setShowNewProject(true)} />
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center">
          <p className="text-sm text-neutral-500">
            No projects match your filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
            className="mt-2 text-sm font-medium text-neutral-900 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project as unknown as ProjectCardType}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* ─── New Project Dialog ─────────────────────────────────── */}
      <NewProjectDialog
        isOpen={showNewProject}
        onClose={() => {
          setShowNewProject(false);
          refresh();
        }}
      />
    </div>
  );
}
