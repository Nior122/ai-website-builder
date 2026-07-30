// =============================================================================
// Empty State Component
// =============================================================================
// Placeholder shown when a list or section has no data.
// Extracted from dashboard pages' inline empty states.
// =============================================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center',
        className
      )}
    >
      {icon && <div className="mb-3 text-3xl">{icon}</div>}
      <p className="mb-1 text-sm font-medium text-neutral-900">{title}</p>
      {description && (
        <p className="text-xs text-neutral-500">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
