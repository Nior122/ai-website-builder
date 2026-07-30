// =============================================================================
// Settings Loading Skeleton
// =============================================================================
// Shown while the settings page is loading the user's profile data.
// =============================================================================

function PulseBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className || ''}`} />
  );
}

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <PulseBlock className="mb-2 h-8 w-40" />
        <PulseBlock className="h-4 w-72" />
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <PulseBlock className="mb-4 h-5 w-32" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <PulseBlock className="h-20 w-20 rounded-full" />
            <PulseBlock className="h-10 w-36 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <PulseBlock className="mb-2 h-3 w-20" />
              <PulseBlock className="h-10 w-full rounded-lg" />
            </div>
            <div>
              <PulseBlock className="mb-2 h-3 w-24" />
              <PulseBlock className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div>
            <PulseBlock className="mb-2 h-3 w-28" />
            <PulseBlock className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <PulseBlock className="mb-4 h-5 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <PulseBlock className="h-4 w-48" />
              <PulseBlock className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <PulseBlock className="mb-4 h-5 w-28 bg-red-100" />
        <PulseBlock className="mb-2 h-4 w-64" />
        <PulseBlock className="h-10 w-36 rounded-lg bg-red-100" />
      </div>
    </div>
  );
}
