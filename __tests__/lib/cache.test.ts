// =============================================================================
// Cache Utility Tests
// =============================================================================
// Unit tests for Redis cache layer. Mocks the Redis client to test
// cacheGet, cacheSet, cacheDelete, cacheGetOrSet, and cacheKeys.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisSetEx = vi.fn();
const mockRedisDel = vi.fn();
const mockRedisKeys = vi.fn();
const mockRedisExists = vi.fn();

vi.mock('@/lib/redis/client', () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
    setEx: (...args: unknown[]) => mockRedisSetEx(...args),
    del: (...args: unknown[]) => mockRedisDel(...args),
    keys: (...args: unknown[]) => mockRedisKeys(...args),
    exists: (...args: unknown[]) => mockRedisExists(...args),
  },
}));

// ─── Imports ───────────────────────────────────────────────────────────

import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheExists,
  cacheGetOrSet,
  cacheKeys,
} from '@/lib/redis/cache';

// ─── Tests ─────────────────────────────────────────────────────────────

describe('Cache Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cacheGet', () => {
    it('should return parsed JSON when key exists', async () => {
      // Arrange
      const testData = { name: 'Test', count: 42 };
      mockRedisGet.mockResolvedValue(JSON.stringify(testData));

      // Act
      const result = await cacheGet<typeof testData>('test:key');

      // Assert
      expect(result).toEqual(testData);
      expect(mockRedisGet).toHaveBeenCalledWith('test:key');
    });

    it('should return null when key does not exist', async () => {
      // Arrange
      mockRedisGet.mockResolvedValue(null);

      // Act
      const result = await cacheGet('nonexistent:key');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      // Arrange
      mockRedisGet.mockResolvedValue('not-valid-json{');

      // Act
      const result = await cacheGet('bad:key');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when Redis throws', async () => {
      // Arrange
      mockRedisGet.mockRejectedValue(new Error('Connection lost'));

      // Act
      const result = await cacheGet('error:key');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('cacheSet', () => {
    it('should store value with default TTL', async () => {
      // Arrange
      const testData = { name: 'Test' };

      // Act
      await cacheSet('test:key', testData);

      // Assert
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        'test:key',
        300, // default 5 minutes
        JSON.stringify(testData)
      );
    });

    it('should store value with custom TTL', async () => {
      // Arrange
      const testData = [1, 2, 3];

      // Act
      await cacheSet('test:key', testData, 60);

      // Assert
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        'test:key',
        60,
        JSON.stringify(testData)
      );
    });

    it('should use SET (no expiry) when TTL is 0', async () => {
      // Arrange
      const testData = 'persistent';

      // Act
      await cacheSet('test:key', testData, 0);

      // Assert
      expect(mockRedisSet).toHaveBeenCalledWith('test:key', JSON.stringify(testData));
      expect(mockRedisSetEx).not.toHaveBeenCalled();
    });

    it('should not throw when Redis fails', async () => {
      // Arrange
      mockRedisSetEx.mockRejectedValue(new Error('Connection lost'));

      // Act & Assert — should not throw
      await expect(cacheSet('test:key', { data: 1 })).resolves.toBeUndefined();
    });
  });

  describe('cacheDelete', () => {
    it('should delete the specified key', async () => {
      // Act
      await cacheDelete('test:key');

      // Assert
      expect(mockRedisDel).toHaveBeenCalledWith('test:key');
    });

    it('should not throw when Redis fails', async () => {
      // Arrange
      mockRedisDel.mockRejectedValue(new Error('Connection lost'));

      // Act & Assert
      await expect(cacheDelete('test:key')).resolves.toBeUndefined();
    });
  });

  describe('cacheDeletePattern', () => {
    it('should delete all matching keys', async () => {
      // Arrange
      mockRedisKeys.mockResolvedValue(['key:1', 'key:2', 'key:3']);

      // Act
      await cacheDeletePattern('key:*');

      // Assert
      expect(mockRedisKeys).toHaveBeenCalledWith('key:*');
      expect(mockRedisDel).toHaveBeenCalledWith(['key:1', 'key:2', 'key:3']);
    });

    it('should not call DEL when no keys match', async () => {
      // Arrange
      mockRedisKeys.mockResolvedValue([]);

      // Act
      await cacheDeletePattern('nomatch:*');

      // Assert
      expect(mockRedisDel).not.toHaveBeenCalled();
    });
  });

  describe('cacheExists', () => {
    it('should return true when key exists', async () => {
      // Arrange
      mockRedisExists.mockResolvedValue(1);

      // Act
      const result = await cacheExists('test:key');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      // Arrange
      mockRedisExists.mockResolvedValue(0);

      // Act
      const result = await cacheExists('test:key');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when Redis throws', async () => {
      // Arrange
      mockRedisExists.mockRejectedValue(new Error('Connection lost'));

      // Act
      const result = await cacheExists('test:key');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('cacheGetOrSet', () => {
    it('should return cached value when available', async () => {
      // Arrange
      const cachedData = { from: 'cache' };
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));
      const factory = vi.fn();

      // Act
      const result = await cacheGetOrSet('test:key', factory);

      // Assert
      expect(result).toEqual(cachedData);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result when cache miss', async () => {
      // Arrange
      mockRedisGet.mockResolvedValue(null);
      const freshData = { from: 'factory' };
      const factory = vi.fn().mockResolvedValue(freshData);

      // Act
      const result = await cacheGetOrSet('test:key', factory);

      // Assert
      expect(result).toEqual(freshData);
      expect(factory).toHaveBeenCalledOnce();
      expect(mockRedisSetEx).toHaveBeenCalled();
    });
  });

  describe('cacheKeys', () => {
    it('should generate correct project key', () => {
      expect(cacheKeys.project('abc123')).toBe('project:abc123');
    });

    it('should generate correct projectBySlug key', () => {
      expect(cacheKeys.projectBySlug('my-site')).toBe('project:slug:my-site');
    });

    it('should generate correct page key', () => {
      expect(cacheKeys.page('proj1', 'page1')).toBe('page:proj1:page1');
    });

    it('should generate correct deployment key', () => {
      expect(cacheKeys.deployment('dep1')).toBe('deployment:dep1');
    });

    it('should generate correct domainLookup key', () => {
      expect(cacheKeys.domainLookup('example.com')).toBe('domain:example.com');
    });

    it('should generate correct userSubscription key', () => {
      expect(cacheKeys.userSubscription('user1')).toBe('user:user1:subscription');
    });

    it('should generate correct analytics key with period', () => {
      expect(cacheKeys.analytics('proj1', '30d')).toBe('analytics:proj1:30d');
    });

    it('should generate correct templates key with industry', () => {
      expect(cacheKeys.templates('tech')).toBe('templates:tech');
    });

    it('should generate correct templates key without industry', () => {
      expect(cacheKeys.templates()).toBe('templates:all');
    });
  });
});
