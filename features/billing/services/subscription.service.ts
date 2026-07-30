// =============================================================================
// Subscription Service
// =============================================================================
// Business logic for subscription management and plan enforcement.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { SubscriptionError, PlanLimitExceededError } from '@/lib/errors';
import { PLANS } from '@/lib/constants';
import type { SubscriptionPlan } from '@/types';

/**
 * Check if a user can perform an action based on their subscription plan.
 */
export async function checkSubscription(userId: string): Promise<{
  plan: SubscriptionPlan;
  limits: typeof PLANS.free.limits;
}> {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const plan = (subscription?.plan as SubscriptionPlan) || 'free';

  if (subscription?.status === 'past_due') {
    throw new SubscriptionError('Your payment is past due. Please update your billing information.');
  }

  return {
    plan,
    limits: (PLANS as any)[plan]?.limits || PLANS.free.limits,
  };
}

/**
 * Check if a user has exceeded their plan limits.
 */
export async function checkPlanLimits(
  userId: string,
  resource: 'projects' | 'aiGenerations' | 'exports'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const { plan, limits } = await checkSubscription(userId);

  const limitMap: Record<string, number> = {
    projects: limits.projects,
    aiGenerations: limits.aiGenerations,
    exports: limits.exports,
  };

  const limit = limitMap[resource];

  // Unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let current = 0;

  if (resource === 'projects') {
    current = await prisma.project.count({
      where: { ownerId: userId, status: { not: 'archived' } },
    });
  } else if (resource === 'aiGenerations') {
    current = await prisma.aIGeneration.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });
  } else if (resource === 'exports') {
    current = await prisma.export.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });
  }

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

/**
 * Get the subscription details for a user.
 */
export async function getSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    return {
      plan: 'free' as SubscriptionPlan,
      status: 'active' as const,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      limits: PLANS.free.limits,
    };
  }

  return {
    plan: subscription.plan as SubscriptionPlan,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
    limits: PLANS[subscription.plan as SubscriptionPlan]?.limits || PLANS.free.limits,
  };
}
