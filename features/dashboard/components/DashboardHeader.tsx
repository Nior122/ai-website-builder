// =============================================================================
// Dashboard Header
// =============================================================================
// Top section of the dashboard with greeting, quick stats, and CTA.
// =============================================================================

'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

interface DashboardHeaderProps {
  onNewProject: () => void;
}

export function DashboardHeader({ onNewProject }: DashboardHeaderProps) {
  const { user } = useCurrentUser();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {greeting()}, {user?.firstName || 'there'}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your websites and AI-generated projects
        </p>
      </div>
      <button
        onClick={onNewProject}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 active:bg-neutral-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Project
      </button>
    </div>
  );
}
