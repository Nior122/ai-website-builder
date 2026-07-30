// =============================================================================
// Admin Dashboard Loading Skeleton
// =============================================================================
// Shown while admin stats and user data are loading.
// =============================================================================

function PulseBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className || ''}`} />
  );
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <PulseBlock className="mb-2 h-8 w-48" />
        <PulseBlock className="h-4 w-72" />
      </div>

      {/* Admin Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
            <PulseBlock className="mb-3 h-4 w-28" />
            <PulseBlock className="mb-2 h-7 w-20" />
            <PulseBlock className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <PulseBlock className="mb-4 h-5 w-36" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3">
              <PulseBlock className="h-3 w-3 rounded-full" />
              <div>
                <PulseBlock className="mb-1 h-3 w-16" />
                <PulseBlock className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <PulseBlock className="mb-4 h-5 w-32" />
        {/* Table Header */}
        <div className="mb-3 grid grid-cols-4 gap-4 border-b border-neutral-100 pb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <PulseBlock key={i} className="h-4 w-20" />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <PulseBlock key={j} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
