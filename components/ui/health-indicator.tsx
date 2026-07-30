// =============================================================================
// Health Indicator Component
// =============================================================================
// Displays a colored dot with optional label for system health status.
// Extracted from admin/page.tsx HealthDot.
// =============================================================================

import { cn } from '@/lib/cn';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface HealthIndicatorProps {
  status: HealthStatus;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500',
};

export function HealthIndicator({
  status,
  label,
  showLabel = true,
  className,
}: HealthIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('inline-block h-2.5 w-2.5 rounded-full', STATUS_COLORS[status])} />
      {showLabel && (label ?? (
        <span className="text-sm capitalize text-neutral-700">{status}</span>
      ))}
    </div>
  );
}
