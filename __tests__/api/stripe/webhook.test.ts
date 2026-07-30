// =============================================================================
// POST /api/stripe/webhook — Route Handler Tests
// =============================================================================
// Tests Stripe webhook handling for subscription lifecycle events.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockVerifyWebhookSignature = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
}));

vi.mock('@/lib/prisma/client', () => ({
  default: {
    subscription: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  getServerEnv: () => ({
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
    STRIPE_PRO_MONTHLY_PRICE_ID: 'price_pro_monthly',
    STRIPE_PRO_YEARLY_PRICE_ID: 'price_pro_yearly',
    STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: 'price_ent_monthly',
    STRIPE_ENTERPRISE_YEARLY_PRICE_ID: 'price_ent_yearly',
  }),
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { POST } from '@/app/api/stripe/webhook/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makePostRequest(body: string, signature = 'sig_test'): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body,
    })
  );
}

function makeStripeEvent(type: string, object: Record<string, unknown>) {
  return {
    id: 'evt_test',
    type,
    data: { object },
  };
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockUpsert.mockResolvedValue(undefined);
  mockUpdate.mockResolvedValue(undefined);
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  it('returns 400 when signature verification fails', async () => {
    mockVerifyWebhookSignature.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await POST(makePostRequest('bad body'));
    const data = await response.json();

    // badRequest() returns 400 directly
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('processes checkout.session.completed (subscription created)', async () => {
    const event = makeStripeEvent('customer.subscription.created', {
      id: 'sub_123',
      customer: 'cus_abc',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      items: { data: [{ price: { id: 'price_pro_monthly' } }] },
    });
    mockVerifyWebhookSignature.mockReturnValue(event);

    const response = await POST(makePostRequest(JSON.stringify(event)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: 'cus_abc' },
        create: expect.objectContaining({ plan: 'pro', status: 'active' }),
        update: expect.objectContaining({ plan: 'pro', status: 'active' }),
      })
    );
  });

  it('maps enterprise price IDs correctly', async () => {
    const event = makeStripeEvent('customer.subscription.updated', {
      id: 'sub_ent',
      customer: 'cus_ent',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      items: { data: [{ price: { id: 'price_ent_monthly' } }] },
    });
    mockVerifyWebhookSignature.mockReturnValue(event);

    await POST(makePostRequest(JSON.stringify(event)));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ plan: 'enterprise' }),
      })
    );
  });

  it('handles subscription deleted event', async () => {
    const event = makeStripeEvent('customer.subscription.deleted', {
      id: 'sub_123',
      customer: 'cus_abc',
    });
    mockVerifyWebhookSignature.mockReturnValue(event);

    const response = await POST(makePostRequest(JSON.stringify(event)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_abc' },
      data: { plan: 'free', status: 'inactive' },
    });
  });

  it('handles invoice.payment_failed event', async () => {
    const event = makeStripeEvent('invoice.payment_failed', {
      customer: 'cus_abc',
    });
    mockVerifyWebhookSignature.mockReturnValue(event);

    const response = await POST(makePostRequest(JSON.stringify(event)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_abc' },
      data: { status: 'past_due' },
    });
  });

  it('returns 400 when webhook processing throws', async () => {
    const event = makeStripeEvent('customer.subscription.created', {
      id: 'sub_123',
      customer: 'cus_abc',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      items: { data: [{ price: { id: 'price_pro_monthly' } }] },
    });
    mockVerifyWebhookSignature.mockReturnValue(event);
    mockUpsert.mockRejectedValue(new Error('Database connection lost'));

    const response = await POST(makePostRequest(JSON.stringify(event)));
    const data = await response.json();

    // badRequest() returns 400 directly
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
