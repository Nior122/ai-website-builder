// =============================================================================
// Billing Settings Page
// =============================================================================
// Subscription management, plan upgrade/downgrade, and payment history.
// =============================================================================

'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BillingPage() {
  const { data: subData, isLoading } = useSWR<{ data: { plan: string; status: string; currentPeriodEnd: string } }>(
    '/api/billing/subscription',
    fetcher
  );

  const subscription = subData?.data;

  const handleUpgrade = async () => {
    const origin = window.location.origin;
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
        successUrl: `${origin}/dashboard/settings/billing?upgraded=true`,
        cancelUrl: `${origin}/dashboard/settings/billing`,
      }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  const handleManage = async () => {
    const origin = window.location.origin;
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        returnUrl: `${origin}/dashboard/settings/billing`,
      }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Billing</h1>
      <p className="mb-8 text-sm text-neutral-500">Manage your subscription and payment method</p>

      {/* Current Plan */}
      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Current Plan</h2>
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-neutral-100" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900 capitalize">
                {subscription?.plan || 'Free'} Plan
              </p>
              <p className="text-xs text-neutral-500">
                {subscription?.status === 'active'
                  ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : 'No active subscription'}
              </p>
            </div>
            <div className="flex gap-3">
              {(!subscription || subscription.plan === 'free') ? (
                <button
                  onClick={handleUpgrade}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Upgrade to Pro
                </button>
              ) : (
                <button
                  onClick={handleManage}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Manage Subscription
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Plan Comparison */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Plans</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { name: 'Free', price: '$0', features: ['3 projects', '10 AI generations', '5 exports'] },
            { name: 'Pro', price: '$29/mo', features: ['50 projects', '500 AI generations', 'Unlimited exports', 'Custom domains'] },
            { name: 'Enterprise', price: '$99/mo', features: ['Unlimited projects', 'Unlimited AI', 'Team collaboration', 'Priority support', 'SLA'] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-4 ${
                (subscription?.plan || 'free') === plan.name.toLowerCase()
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200'
              }`}
            >
              <h3 className="mb-1 font-semibold text-neutral-900">{plan.name}</h3>
              <p className="mb-3 text-lg font-bold text-neutral-900">{plan.price}</p>
              <ul className="space-y-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
