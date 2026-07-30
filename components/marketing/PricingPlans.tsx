// =============================================================================
// Pricing Plans (client)
// =============================================================================
// Client component that renders the three pricing tiers from PLANS and reacts
// to the monthly/yearly BillingToggle. Pricing data is server-owned (PLANS),
// passed in as props so the page stays mostly a server component.
// =============================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BillingToggle } from './BillingToggle';
import type { BillingInterval, PlanFeature } from '@/features/billing/types';

export interface PricingTier {
  id: string;
  displayName: string;
  description: string;
  prices: { monthly: number; yearly: number };
  /**
   * `readonly` because PLANS is declared `as const`, so its feature arrays are
   * deeply readonly. Widening here accepts both mutable and readonly arrays
   * without forcing a copy on each render.
   */
  features: readonly PlanFeature[];
  /** Highlight the featured plan (e.g. Pro). */
  highlighted?: boolean;
  cta: string;
}

interface PricingPlansProps {
  tiers: PricingTier[];
}

export function PricingPlans({ tiers }: PricingPlansProps) {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  return (
    <>
      <div className="mb-12 flex justify-center">
        <BillingToggle
          interval={interval}
          onToggle={setInterval}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {tiers.map((tier) => {
          const price = tier.prices[interval];
          const numericPrice = typeof price === 'number' ? price : 0;
          const suffix = numericPrice === 0 ? '' : '/mo';

          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 ${
                tier.highlighted
                  ? 'border-neutral-900 shadow-lg ring-1 ring-neutral-900'
                  : 'border-neutral-200'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-neutral-900">
                {tier.displayName}
              </h3>
              <p className="mt-1 text-sm text-neutral-500">{tier.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-neutral-900">
                  ${numericPrice}
                </span>
                {suffix && (
                  <span className="text-sm text-neutral-500">
                    {suffix}
                    {interval === 'yearly' ? ', billed yearly' : ''}
                  </span>
                )}
              </div>

              <Link
                href={`/sign-up?plan=${tier.id}&interval=${interval}`}
                className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {tier.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-3 text-sm">
                    {feature.included ? (
                      <span className="mt-0.5 text-neutral-900">✓</span>
                    ) : (
                      <span className="mt-0.5 text-neutral-300">—</span>
                    )}
                    <span
                      className={
                        feature.included ? 'text-neutral-700' : 'text-neutral-400'
                      }
                    >
                      {feature.name}
                      {feature.included && typeof feature.limit === 'number' && feature.limit !== -1
                        ? ` (${feature.limit === 0 ? 'none' : feature.limit})`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
