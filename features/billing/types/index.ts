// =============================================================================
// Billing Types
// =============================================================================

import type { SubscriptionPlan, PlanLimits } from '@/types';

export type BillingInterval = 'monthly' | 'yearly';

export interface SubscriptionInfo {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
}

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  prices: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  limits: PlanLimits;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  date: string;
  downloadUrl: string;
}
