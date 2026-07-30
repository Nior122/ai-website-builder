// =============================================================================
// Dashboard Loading Skeleton
// =============================================================================
// Shown while the dashboard layout data (user role, nav) is loading.
// Matches the structure of app/dashboard/layout.tsx.
// =============================================================================

function PulseBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-200 ${className || ''}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* ─── Sidebar Skeleton ──────────────────────────────────────── */}
      <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5">
          <PulseBlock className="h-8 w-8 rounded-lg" />
          <PulseBlock className="h-4 w-28" />
        </div>

        {/* Org Switcher */}
        <div className="border-b border-neutral-200 px-3 py-3">
          <PulseBlock className="h-9 w-full rounded-lg" />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
              <PulseBlock className="h-5 w-5 rounded" />
              <PulseBlock className="h-4 w-20" />
            </div>
          ))}
        </nav>

        {/* User Button */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <PulseBlock className="h-8 w-8 rounded-full" />
            <PulseBlock className="h-4 w-24" />
          </div>
        </div>
      </aside>

      {/* ─── Main Content Skeleton ─────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-end border-b border-neutral-200 bg-white px-6">
          <PulseBlock className="h-8 w-8 rounded-full" />
        </div>

        {/* Content Area */}
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Page Title */}
          <PulseBlock className="mb-6 h-8 w-48" />

          {/* Stat Cards Row */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-200 bg-white p-5"
              >
                <PulseBlock className="mb-3 h-4 w-24" />
                <PulseBlock className="mb-2 h-7 w-16" />
                <PulseBlock className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Content Block */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <PulseBlock className="mb-4 h-5 w-36" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <PulseBlock key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
