// =============================================================================
// POST /api/stripe/webhook
// =============================================================================
// Stripe webhook handler for subscription events.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe/client';
import prisma from '@/lib/prisma/client';
import { errorResponse, badRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';
import type Stripe from 'stripe';

// Webhook must never be statically rendered or prerendered — it is a runtime
// receiver for Stripe events. `force-dynamic` plus lazy Stripe construction
// in `lib/stripe/client` keeps this module importable during `next build`'s
// page-data collection without needing a configured secret key at build time.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    if (!env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Stripe webhook secret not configured' }, { status: 503 });
    }

    const event = verifyWebhookSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, env);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook error', { error: String(err) });
    return badRequest('Webhook processing failed');
  }
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  env: ReturnType<typeof getServerEnv>
) {
  const customerId = subscription.customer as string;
  // Update subscription in database
  await prisma.subscription.upsert({
    where: { stripeCustomerId: customerId },
    create: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: mapPriceIdToPlan(subscription.items.data[0]?.price.id || '', env),
      status: subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'active' : 'inactive',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    } as any,
    update: {
      stripeSubscriptionId: subscription.id,
      plan: mapPriceIdToPlan(subscription.items.data[0]?.price.id || '', env),
      status: subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'active' : 'inactive',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: { plan: 'free', status: 'inactive' },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // Mark subscription as past due
  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: { status: 'past_due' },
  }).catch(() => {
    // Subscription might not exist yet
  });
}

function mapPriceIdToPlan(
  priceId: string,
  env: ReturnType<typeof getServerEnv>
): string {
  if (priceId === env.STRIPE_PRO_MONTHLY_PRICE_ID || priceId === env.STRIPE_PRO_YEARLY_PRICE_ID) {
    return 'pro';
  }
  if (priceId === env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || priceId === env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID) {
    return 'enterprise';
  }
  return 'free';
}
