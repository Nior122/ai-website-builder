// =============================================================================
// Analytics Loading Skeleton
// =============================================================================
// Shown while analytics data and charts are loading.
// =============================================================================

function PulseBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className || ''}`} />
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <PulseBlock className="mb-2 h-8 w-40" />
          <PulseBlock className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <PulseBlock className="h-9 w-24 rounded-lg" />
          <PulseBlock className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
            <PulseBlock className="mb-3 h-4 w-24" />
            <PulseBlock className="mb-2 h-7 w-20" />
            <div className="flex items-center gap-2">
              <PulseBlock className="h-3 w-12" />
              <PulseBlock className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <PulseBlock className="mb-4 h-5 w-36" />
        <PulseBlock className="h-64 w-full rounded-lg" />
      </div>

      {/* Second Chart Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <PulseBlock className="mb-4 h-5 w-40" />
          <PulseBlock className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <PulseBlock className="mb-4 h-5 w-32" />
          <PulseBlock className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <PulseBlock className="mb-4 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-neutral-50 pb-3 last:border-0">
              <PulseBlock className="h-8 w-8 rounded-full flex-shrink-0" />
              <PulseBlock className="h-4 flex-1" />
              <PulseBlock className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
