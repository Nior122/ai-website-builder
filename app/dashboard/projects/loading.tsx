// =============================================================================
// Projects Loading Skeleton
// =============================================================================
// Shown while the projects list page is loading data via SWR.
// =============================================================================

function PulseBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className || ''}`} />
  );
}

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <PulseBlock className="mb-2 h-8 w-48" />
          <PulseBlock className="h-4 w-64" />
        </div>
        <PulseBlock className="h-10 w-36 rounded-lg" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
            <PulseBlock className="mb-3 h-4 w-24" />
            <PulseBlock className="mb-2 h-7 w-16" />
            <PulseBlock className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <PulseBlock className="h-10 flex-1 rounded-lg" />
        <PulseBlock className="h-10 w-24 rounded-lg" />
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4">
            <PulseBlock className="h-32 w-48 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-3 py-1">
              <PulseBlock className="h-5 w-40" />
              <PulseBlock className="h-3 w-64" />
              <div className="flex gap-2">
                <PulseBlock className="h-6 w-16 rounded-full" />
                <PulseBlock className="h-6 w-20 rounded-full" />
              </div>
              <PulseBlock className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
