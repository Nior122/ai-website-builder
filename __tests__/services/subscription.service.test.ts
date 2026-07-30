// =============================================================================
// Subscription Service Tests
// =============================================================================
// Unit tests for subscription management and plan enforcement.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    subscription: {
      findFirst: vi.fn(),
    },
    project: {
      count: vi.fn(),
    },
    aIGeneration: {
      count: vi.fn(),
    },
    export: {
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Imports ───────────────────────────────────────────────────────────

import { checkSubscription, checkPlanLimits, getSubscription } from '@/features/billing/services/subscription.service';
import prisma from '@/lib/prisma/client';
import { SubscriptionError } from '@/lib/errors';

// ─── Test Data ─────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user_123';

const mockFreeSubscription = null;

const mockProSubscription = {
  id: 'sub_123',
  userId: MOCK_USER_ID,
  plan: 'pro',
  status: 'active',
  stripeCustomerId: 'cus_123',
  stripeSubscriptionId: 'sub_stripe_123',
  currentPeriodStart: new Date('2026-01-01'),
  currentPeriodEnd: new Date('2026-02-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPastDueSubscription = {
  ...mockProSubscription,
  id: 'sub_456',
  status: 'past_due',
};

// ─── Tests ─────────────────────────────────────────────────────────────

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSubscription', () => {
    it('should return free plan when no subscription exists', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      // Act
      const result = await checkSubscription(MOCK_USER_ID);

      // Assert
      expect(result.plan).toBe('free');
      expect(result.limits.projects).toBe(10);
    });

    it('should return pro plan for active subscription', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockProSubscription as never);

      // Act
      const result = await checkSubscription(MOCK_USER_ID);

      // Assert
      expect(result.plan).toBe('pro');
      expect(result.limits.projects).toBe(50);
    });

    it('should throw SubscriptionError for past_due status', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockPastDueSubscription as never);

      // Act & Assert
      await expect(checkSubscription(MOCK_USER_ID)).rejects.toThrow(SubscriptionError);
    });

    it('should default to free plan for unknown plan value', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockProSubscription,
        plan: 'unknown_plan',
      } as never);

      // Act
      const result = await checkSubscription(MOCK_USER_ID);

      // Assert
      expect(result.plan).toBe('unknown_plan');
      // Falls back to free limits for unknown plan
      expect(result.limits.projects).toBe(10);
    });
  });

  describe('checkPlanLimits', () => {
    it('should check project limits correctly', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null); // free plan
      vi.mocked(prisma.project.count).mockResolvedValue(2);

      // Act
      const result = await checkPlanLimits(MOCK_USER_ID, 'projects');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.limit).toBe(10); // free plan limit
    });

    it('should deny when project limit is exceeded', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null); // free plan
      vi.mocked(prisma.project.count).mockResolvedValue(10);

      // Act
      const result = await checkPlanLimits(MOCK_USER_ID, 'projects');

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(10);
      expect(result.limit).toBe(10);
    });

    it('should allow unlimited for pro plan resources', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockProSubscription as never);
      vi.mocked(prisma.aIGeneration.count).mockResolvedValue(100);

      // Act
      const result = await checkPlanLimits(MOCK_USER_ID, 'aiGenerations');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(100);
      expect(result.limit).toBe(500); // pro plan limit
    });

    it('should check export limits correctly', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null); // free plan
      vi.mocked(prisma.export.count).mockResolvedValue(4);

      // Act
      const result = await checkPlanLimits(MOCK_USER_ID, 'exports');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(4);
      expect(result.limit).toBe(5); // free plan limit
    });

    it('should deny when export limit is exceeded', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null); // free plan
      vi.mocked(prisma.export.count).mockResolvedValue(5);

      // Act
      const result = await checkPlanLimits(MOCK_USER_ID, 'exports');

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(5);
    });
  });

  describe('getSubscription', () => {
    it('should return free plan defaults when no subscription', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      // Act
      const result = await getSubscription(MOCK_USER_ID);

      // Assert
      expect(result.plan).toBe('free');
      expect(result.status).toBe('active');
      expect(result.currentPeriodStart).toBeNull();
      expect(result.currentPeriodEnd).toBeNull();
    });

    it('should return subscription details for active subscription', async () => {
      // Arrange
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockProSubscription as never);

      // Act
      const result = await getSubscription(MOCK_USER_ID);

      // Assert
      expect(result.plan).toBe('pro');
      expect(result.status).toBe('active');
      expect(result.currentPeriodStart).toBe('2026-01-01T00:00:00.000Z');
      expect(result.currentPeriodEnd).toBe('2026-02-01T00:00:00.000Z');
      expect(result.limits.projects).toBe(50);
    });
  });
});
