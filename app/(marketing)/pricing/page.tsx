// =============================================================================
// Pricing Page
// =============================================================================
// Public pricing page. Reads the canonical PLANS constant (lib/constants) and
// renders three tiers via the PricingPlans client component (which owns the
// monthly/yearly toggle state). Static FAQ below.
// =============================================================================

import type { Metadata } from 'next';
import { PLANS, APP_NAME } from '@/lib/constants';
import { PricingPlans, type PricingTier } from '@/components/marketing/PricingPlans';

export const metadata: Metadata = {
  title: `Pricing — ${APP_NAME}`,
  description:
    'Simple, transparent pricing. Start free, then upgrade to Pro or Enterprise as your needs grow.',
};

const FREE_TIER_CTAS: Record<string, string> = {
  free: 'Get Started Free',
  pro: 'Start Pro',
  enterprise: 'Contact Sales',
};

function buildTiers(): PricingTier[] {
  return (['free', 'pro', 'enterprise'] as const).map((key) => {
    const plan = PLANS[key];
    // Enterprise has no billing upgrade path — route to contact.
    const cta = key === 'enterprise' ? 'Contact Sales' : FREE_TIER_CTAS[key];
    return {
      id: plan.id,
      displayName: plan.displayName,
      description: plan.description,
      prices: plan.price,
      features: plan.features,
      highlighted: key === 'pro',
      cta,
    };
  });
}

const FAQS = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. The Free plan requires no credit card and lets you build up to 3 projects. You only enter billing details when upgrading to Pro or Enterprise.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes — upgrade or downgrade at any time from your dashboard. Changes are prorated automatically for the remainder of your billing cycle.',
  },
  {
    q: 'What counts as an AI generation?',
    a: 'An AI generation is one request to generate or regenerate a page, section, or piece of content through the AI Website Builder. Each plan includes a monthly allotment.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Custom domains are available on Pro (up to 10) and Enterprise (up to 100). The Free plan uses a studio subdomain.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes — paid plans come with a 14-day money-back guarantee. If you are not satisfied, contact support for a full refund.',
  },
  {
    q: 'Do you offer discounts for non-profits or students?',
    a: 'Reach out to us — we offer discounted Enterprise pricing for qualifying non-profits and educational institutions.',
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      {/* Header */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-500">
          Start free and upgrade as you grow. No hidden fees, cancel anytime.
        </p>
      </div>

      {/* Tiers */}
      <PricingPlans tiers={buildTiers()} />

      {/* FAQ */}
      <section className="mx-auto mt-24 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-neutral-900">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="mb-2 font-semibold text-neutral-900">{faq.q}</h3>
              <p className="text-sm text-neutral-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
