// =============================================================================
// Redis Client
// =============================================================================
// Redis connection for caching, rate limiting, and job queues.
// Uses connection pooling with automatic reconnection.
// =============================================================================

import { createClient, type RedisClientType } from 'redis';
import { logger } from '@/lib/logger';

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

function createRedisClient(): RedisClientType {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis: Max reconnection attempts reached');
          return new Error('Max reconnection attempts');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error', { error: String(err) });
  });

  return client as RedisClientType;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Auto-connect on first use — avoids "The client is closed" errors
// when route handlers call redis directly without ensureRedisConnected().
redis.connect().catch((err) => {
  logger.error('Redis auto-connect failed', { error: String(err) });
});

// Connect on first use
let isConnected = false;

export async function ensureRedisConnected(): Promise<void> {
  if (!isConnected) {
    await redis.connect();
    isConnected = true;
  }
}

export default redis;
