// =============================================================================
// Generate Loading Skeleton
// =============================================================================
// Shown while the AI generation page is initializing.
// =============================================================================

function PulseBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className || ''}`} />
  );
}

export default function GenerateLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <PulseBlock className="mb-2 h-8 w-64" />
        <PulseBlock className="h-4 w-96" />
      </div>

      {/* Generation Form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        {/* Description textarea */}
        <div className="mb-6">
          <PulseBlock className="mb-2 h-4 w-40" />
          <PulseBlock className="h-32 w-full rounded-lg" />
        </div>

        {/* Form fields */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <PulseBlock className="mb-2 h-3 w-20" />
            <PulseBlock className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <PulseBlock className="mb-2 h-3 w-24" />
            <PulseBlock className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <PulseBlock className="mb-2 h-3 w-16" />
            <PulseBlock className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <PulseBlock className="mb-2 h-3 w-28" />
            <PulseBlock className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Page selection */}
        <div className="mb-6">
          <PulseBlock className="mb-2 h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <PulseBlock key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <PulseBlock className="mb-2 h-4 w-28" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <PulseBlock key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Submit button */}
        <PulseBlock className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
