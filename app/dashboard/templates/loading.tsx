// =============================================================================
// Templates Loading Skeleton
// =============================================================================
// Shown while the template gallery is loading available templates.
// =============================================================================

function PulseBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className || ''}`} />
  );
}

export default function TemplatesLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <PulseBlock className="mb-2 h-8 w-44" />
        <PulseBlock className="h-4 w-80" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <PulseBlock key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <PulseBlock className="h-48 w-full rounded-none" />
            <div className="space-y-2 p-4">
              <PulseBlock className="h-5 w-32" />
              <PulseBlock className="h-3 w-full" />
              <PulseBlock className="h-3 w-48" />
              <div className="flex gap-2 pt-2">
                <PulseBlock className="h-6 w-16 rounded-full" />
                <PulseBlock className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
