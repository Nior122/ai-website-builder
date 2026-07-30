// =============================================================================
// Empty State
// =============================================================================
// Shown when the user has no projects yet. Encourages creating first project.
// =============================================================================

interface EmptyStateProps {
  onNewProject: () => void;
}

export function EmptyState({ onNewProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
        🎨
      </div>
      <h3 className="mb-1 text-lg font-semibold text-neutral-900">
        No projects yet
      </h3>
      <p className="mb-6 max-w-sm text-sm text-neutral-500">
        Create your first AI-powered website by describing your business in plain English. The AI will generate a complete, professional site in seconds.
      </p>
      <button
        onClick={onNewProject}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Create Your First Website
      </button>
    </div>
  );
}
