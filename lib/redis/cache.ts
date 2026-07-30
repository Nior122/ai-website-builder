// =============================================================================
// Redis Cache Utilities
// =============================================================================
// Type-safe caching with automatic serialization, TTL, and invalidation.
// =============================================================================

import { redis } from './client';
import { logger } from '@/lib/logger';

const DEFAULT_TTL = 60 * 5; // 5 minutes

/**
 * Get a value from cache.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in cache with optional TTL.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.setEx(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (err) {
    logger.error('Cache set error', { error: String(err) });
  }
}

/**
 * Delete a value from cache.
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error('Cache delete error', { error: String(err) });
  }
}

/**
 * Delete all keys matching a pattern.
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    logger.error('Cache delete pattern error', { error: String(err) });
  }
}

/**
 * Check if a key exists.
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch {
    return false;
  }
}

/**
 * Get or set — return cached value or compute and cache it.
 */
export async function cacheGetOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

/**
 * Cache key builder with consistent naming.
 */
export const cacheKeys = {
  project: (id: string) => `project:${id}`,
  projectBySlug: (slug: string) => `project:slug:${slug}`,
  page: (projectId: string, pageId: string) => `page:${projectId}:${pageId}`,
  userProjects: (userId: string) => `user:${userId}:projects`,
  template: (id: string) => `template:${id}`,
  templates: (industry?: string) => `templates:${industry || 'all'}`,
  analytics: (projectId: string, period: string) => `analytics:${projectId}:${period}`,
  userSubscription: (userId: string) => `user:${userId}:subscription`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
  deployment: (id: string) => `deployment:${id}`,
  domainLookup: (hostname: string) => `domain:${hostname}`,
  userNotifications: (userId: string) => `user:${userId}:notifications`,
  adminStats: () => 'admin:stats',
  featureFlag: (key: string) => `flag:${key}`,
  featureFlags: () => 'flags:all',
} as const;
