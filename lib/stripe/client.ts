// =============================================================================
// Stripe Client
// =============================================================================
// Stripe SDK configuration for payments, subscriptions, and webhooks.
//
// The Stripe SDK is constructed *lazily* (on first use), not at module load.
// Next.js statically imports route modules during `next build`'s page-data
// collection ("Collecting page data …") even for dynamic routes — and the
// Stripe constructor throws `Neither apiKey nor config.authenticator provided`
// when given an empty key. At build time `STRIPE_SECRET_KEY` is (intentionally)
// absent, so constructing eagerly would crash the build. Each helper resolves
// the client on demand via `getStripe()`, so the SDK is never touched unless a
// request actually arrives.
// =============================================================================

import Stripe from 'stripe';

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

let cached: Stripe | undefined;

/**
 * Lazily construct (and memoize) the Stripe client. Throws at *runtime* — not
 * build time — if the secret key is missing, since a request reaching this
 * point without a configured key is a real misconfiguration that should surface.
 */
function getStripe(): Stripe {
  if (cached) return cached;

  const existing = globalForStripe.stripe;
  if (existing) {
    cached = existing;
    return existing;
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  const client = new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });

  // Cache on global in non-production to survive HMR reloads.
  if (process.env.NODE_ENV !== 'production') {
    globalForStripe.stripe = client;
  }
  cached = client;
  return client;
}

/**
 * Create a checkout session for subscription.
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: params.trialDays
      ? { trial_period_days: params.trialDays }
      : undefined,
    allow_promotion_codes: true,
  });
}

/**
 * Create a customer portal session for managing subscriptions.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Verify a webhook signature.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}

/**
 * Get subscription details.
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.retrieve(subscriptionId) as Promise<Stripe.Subscription>;
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(
  subscriptionId: string,
  atPeriodEnd = true
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  if (atPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    }) as Promise<Stripe.Subscription>;
  }
  return stripe.subscriptions.cancel(subscriptionId) as Promise<Stripe.Subscription>;
}

/**
 * List invoices for a customer.
 */
export async function listInvoices(
  customerId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await getStripe().invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}
