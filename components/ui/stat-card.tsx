// =============================================================================
// Stat Card Component
// =============================================================================
// Displays a single metric with label, value, and optional icon.
// Extracted from analytics/page.tsx and admin/page.tsx.
// =============================================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-5', className)}>
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm font-medium text-neutral-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
