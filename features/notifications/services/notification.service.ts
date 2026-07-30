// =============================================================================
// Notification Service
// =============================================================================
// Core notification CRUD: create, list, mark read. Called by deployment and
// AI generation services to notify users of important events.
//
// Notifications are stored in the Prisma Notification table and cached
// via Redis for fast unread-count queries.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { cacheDelete, cacheKeys } from '@/lib/redis/cache';
import { logger } from '@/lib/logger';
import type { NotificationType } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationListResult {
  notifications: NotificationRecord[];
  unreadCount: number;
  hasMore: boolean;
  total: number;
}

// ─── Create ────────────────────────────────────────────────────────────

/**
 * Create a notification for a user.
 * Silently swallows errors to never block the caller (deploy, generate, etc.).
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationRecord | null> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: (input.data ?? {}) as any,
      },
    });

    // Invalidate cached unread count
    await cacheDelete(cacheKeys.userNotifications(input.userId)).catch(() => {});

    logger.info(`[Notification] Created: ${input.type} for ${input.userId}`);
    return notification as NotificationRecord;
  } catch (err) {
    logger.error(`[Notification] Failed to create: ${err}`);
    return null;
  }
}

// ─── Read ──────────────────────────────────────────────────────────────

/**
 * Get paginated notifications for a user (newest first).
 */
export async function getNotifications(
  userId: string,
  options: { page?: number; limit?: number } = {}
): Promise<NotificationListResult> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      getUnreadCount(userId),
    ]);

    return {
      notifications: notifications as NotificationRecord[],
      unreadCount,
      hasMore: skip + limit < total,
      total,
    };
  } catch (err) {
    logger.error(`[Notification] Failed to list: ${err}`);
    return { notifications: [], unreadCount: 0, hasMore: false, total: 0 };
  }
}

/**
 * Get the count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, readAt: null },
    });
  } catch (err) {
    logger.error(`[Notification] Failed to count unread: ${err}`);
    return 0;
  }
}

/**
 * Mark a single notification as read (with ownership verification).
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });

    if (result.count > 0) {
      await cacheDelete(cacheKeys.userNotifications(userId)).catch(() => {});
      return true;
    }
    return false;
  } catch (err) {
    logger.error(`[Notification] Failed to mark read: ${err}`);
    return false;
  }
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllAsRead(userId: string): Promise<number> {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    await cacheDelete(cacheKeys.userNotifications(userId)).catch(() => {});
    logger.info(`[Notification] Marked ${result.count} as read for ${userId}`);
    return result.count;
  } catch (err) {
    logger.error(`[Notification] Failed to mark all read: ${err}`);
    return 0;
  }
}
