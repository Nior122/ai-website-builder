// =============================================================================
// Billing Toggle
// =============================================================================
// Client component — a monthly/yearly switch used on the pricing page.
// Calls onToggle(interval) whenever the user switches. The parent renders
// the price cards; this component only owns the toggle state UI.
// =============================================================================

'use client';

import { useState } from 'react';
import type { BillingInterval } from '@/features/billing/types';

interface BillingToggleProps {
  /** Controlled interval (optional). If omitted the component manages its own state. */
  interval?: BillingInterval;
  onToggle?: (interval: BillingInterval) => void;
  /** Initial interval when uncontrolled. */
  defaultInterval?: BillingInterval;
}

export function BillingToggle({
  interval,
  onToggle,
  defaultInterval = 'monthly',
}: BillingToggleProps) {
  const [internal, setInternal] = useState<BillingInterval>(defaultInterval);
  const active = interval ?? internal;

  const handle = (next: BillingInterval) => {
    setInternal(next);
    onToggle?.(next);
  };

  return (
    <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white p-1">
      <button
        type="button"
        onClick={() => handle('monthly')}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          active === 'monthly'
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => handle('yearly')}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          active === 'yearly'
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        Yearly
        <span
          className={`ml-1.5 text-xs ${
            active === 'yearly' ? 'text-neutral-300' : 'text-neutral-400'
          }`}
        >
          ~2 months free
        </span>
      </button>
    </div>
  );
}
