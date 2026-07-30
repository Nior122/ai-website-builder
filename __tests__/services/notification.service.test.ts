// =============================================================================
// Notification Service Tests
// =============================================================================
// Unit tests for notification CRUD. Mocks Prisma and cache to test
// create, list, mark-read operations without a real database.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  cacheKeys: {
    userNotifications: (userId: string) => `user:${userId}:notifications`,
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

// ─── Imports (after mocks) ─────────────────────────────────────────────

import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/features/notifications/services/notification.service';
import prisma from '@/lib/prisma/client';
import { cacheDelete } from '@/lib/redis/cache';

// ─── Test Data ─────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user_123';
const MOCK_NOTIFICATION_ID = 'notif_456';

const mockNotification = {
  id: MOCK_NOTIFICATION_ID,
  userId: MOCK_USER_ID,
  type: 'deployment_complete',
  title: 'Deployment Complete',
  message: 'Your project is live.',
  data: { deploymentId: 'dep_1' },
  readAt: null,
  createdAt: new Date('2026-07-15'),
};

// ─── Tests ─────────────────────────────────────────────────────────────

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification record', async () => {
      // Arrange
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification as never);

      // Act
      const result = await createNotification({
        userId: MOCK_USER_ID,
        type: 'deployment_complete',
        title: 'Deployment Complete',
        message: 'Your project is live.',
        data: { deploymentId: 'dep_1' },
      });

      // Assert
      expect(result).not.toBeNull();
      expect(result?.type).toBe('deployment_complete');
      expect(result?.title).toBe('Deployment Complete');
      expect(prisma.notification.create).toHaveBeenCalledOnce();
    });

    it('should invalidate cache after creation', async () => {
      // Arrange
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification as never);

      // Act
      await createNotification({
        userId: MOCK_USER_ID,
        type: 'deployment_complete',
        title: 'Deployment Complete',
        message: 'Your project is live.',
      });

      // Assert
      expect(cacheDelete).toHaveBeenCalledWith(`user:${MOCK_USER_ID}:notifications`);
    });

    it('should return null on error without throwing', async () => {
      // Arrange
      vi.mocked(prisma.notification.create).mockRejectedValue(new Error('DB error'));

      // Act
      const result = await createNotification({
        userId: MOCK_USER_ID,
        type: 'deployment_complete',
        title: 'Deployment Complete',
        message: 'Your project is live.',
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should handle missing data gracefully', async () => {
      // Arrange
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification as never);

      // Act
      const result = await createNotification({
        userId: MOCK_USER_ID,
        type: 'deployment_complete',
        title: 'Deployment Complete',
        message: 'Your project is live.',
        // no data or actionUrl
      });

      // Assert
      expect(result).not.toBeNull();
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: MOCK_USER_ID,
          type: 'deployment_complete',
          title: 'Deployment Complete',
          message: 'Your project is live.',
          data: {},
        },
      });
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications with unread count', async () => {
      // Arrange
      vi.mocked(prisma.notification.findMany).mockResolvedValue([mockNotification] as never);
      vi.mocked(prisma.notification.count)
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      // Act
      const result = await getNotifications(MOCK_USER_ID, { page: 1, limit: 10 });

      // Assert
      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should calculate hasMore correctly', async () => {
      // Arrange
      vi.mocked(prisma.notification.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.notification.count)
        .mockResolvedValueOnce(25) // total
        .mockResolvedValueOnce(10); // unreadCount

      // Act
      const result = await getNotifications(MOCK_USER_ID, { page: 1, limit: 10 });

      // Assert
      expect(result.hasMore).toBe(true);
    });

    it('should use default page and limit', async () => {
      // Arrange
      vi.mocked(prisma.notification.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.notification.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      // Act
      await getNotifications(MOCK_USER_ID);

      // Assert
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should return empty result on error', async () => {
      // Arrange
      vi.mocked(prisma.notification.findMany).mockRejectedValue(new Error('DB error'));

      // Act
      const result = await getNotifications(MOCK_USER_ID);

      // Assert
      expect(result.notifications).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      // Arrange
      vi.mocked(prisma.notification.count).mockResolvedValue(5);

      // Act
      const result = await getUnreadCount(MOCK_USER_ID);

      // Assert
      expect(result).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, readAt: null },
      });
    });

    it('should return 0 on error', async () => {
      // Arrange
      vi.mocked(prisma.notification.count).mockRejectedValue(new Error('DB error'));

      // Act
      const result = await getUnreadCount(MOCK_USER_ID);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and return true', async () => {
      // Arrange
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 });

      // Act
      const result = await markAsRead(MOCK_NOTIFICATION_ID, MOCK_USER_ID);

      // Assert
      expect(result).toBe(true);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: MOCK_NOTIFICATION_ID, userId: MOCK_USER_ID },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should invalidate cache after marking read', async () => {
      // Arrange
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 });

      // Act
      await markAsRead(MOCK_NOTIFICATION_ID, MOCK_USER_ID);

      // Assert
      expect(cacheDelete).toHaveBeenCalledWith(`user:${MOCK_USER_ID}:notifications`);
    });

    it('should return false if notification not found or wrong user', async () => {
      // Arrange
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 0 });

      // Act
      const result = await markAsRead(MOCK_NOTIFICATION_ID, 'wrong_user');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      // Arrange
      vi.mocked(prisma.notification.updateMany).mockRejectedValue(new Error('DB error'));

      // Act
      const result = await markAsRead(MOCK_NOTIFICATION_ID, MOCK_USER_ID);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications and return count', async () => {
      // Arrange
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 });

      // Act
      const result = await markAllAsRead(MOCK_USER_ID);

      // Assert
      expect(result).toBe(3);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should invalidate cache after marking all read', async () => {
      // Arrange
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 2 });

      // Act
      await markAllAsRead(MOCK_USER_ID);

      // Assert
      expect(cacheDelete).toHaveBeenCalledWith(`user:${MOCK_USER_ID}:notifications`);
    });

    it('should return 0 on error', async () => {
      // Arrange
      vi.mocked(prisma.notification.updateMany).mockRejectedValue(new Error('DB error'));

      // Act
      const result = await markAllAsRead(MOCK_USER_ID);

      // Assert
      expect(result).toBe(0);
    });
  });
});
