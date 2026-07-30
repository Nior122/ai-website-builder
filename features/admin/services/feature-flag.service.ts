// =============================================================================
// Feature Flag Service
// =============================================================================
// CRUD operations + evaluation logic for feature flags. The `isEnabled()`
// function is the main entry point for the rest of the app to check whether
// a flag is active for a given user.
//
// Evaluation order:
//   1. Flag must exist and be enabled
//   2. If rollout < 100%, use deterministic hash to decide per-user
//   3. Check conditions JSON (allowedPlans, allowedUserIds)
//
// Flags are cached for 1 minute to reduce DB reads on high-traffic paths.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { cacheGetOrSet, cacheDelete } from '@/lib/redis/cache';
import { logger } from '@/lib/logger';
import type { FeatureFlag as PrismaFeatureFlag } from '@prisma/client';
import { z } from 'zod';

// ─── Types ─────────────────────────────────────────────────────────────

export interface FeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rollout?: number;
  conditions?: Record<string, unknown>;
}

export interface FeatureFlagContext {
  userId?: string;
  plan?: string;
}

// ─── Validation ────────────────────────────────────────────────────────

const featureFlagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_-]+$/, 'Key must contain only lowercase letters, numbers, underscores, and hyphens'),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  rollout: z.number().int().min(0).max(100).optional(),
  conditions: z.record(z.unknown()).optional(),
});

// ─── Cache Keys ───────────────────────────────────────────────────────

const CACHE_TTL = 60; // 1 minute for individual flags
const CACHE_KEYS = {
  flag: (key: string) => `flag:${key}`,
  flags: () => 'flags:all',
};

// ─── CRUD ──────────────────────────────────────────────────────────────

/**
 * List all feature flags, ordered by most recent first.
 */
export async function getAllFlags(): Promise<PrismaFeatureFlag[]> {
  return prisma.featureFlag.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single flag by its key. Cached for 1 minute.
 */
export async function getFlagByKey(
  key: string
): Promise<PrismaFeatureFlag | null> {
  return cacheGetOrSet(
    CACHE_KEYS.flag(key),
    async () => prisma.featureFlag.findUnique({ where: { key } }),
    CACHE_TTL
  );
}

/**
 * Create a new feature flag. Validates input with Zod.
 */
export async function createFlag(
  input: FeatureFlagInput
): Promise<PrismaFeatureFlag> {
  const validated = featureFlagSchema.parse(input);

  const flag = await prisma.featureFlag.create({
    data: {
      key: validated.key,
      name: validated.name,
      description: validated.description ?? null,
      enabled: validated.enabled ?? false,
      rollout: validated.rollout ?? 0,
      conditions: (validated.conditions ?? {}) as any,
    },
  });

  // Invalidate list cache
  await cacheDelete(CACHE_KEYS.flags());

  logger.info(`[FeatureFlag] Created flag: ${flag.key}`);
  return flag;
}

/**
 * Update an existing feature flag by key.
 */
export async function updateFlag(
  key: string,
  input: Partial<FeatureFlagInput>
): Promise<PrismaFeatureFlag> {
  // Build update data — only include fields that were provided
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.rollout !== undefined) data.rollout = input.rollout;
  if (input.conditions !== undefined) data.conditions = input.conditions;

  const flag = await prisma.featureFlag.update({
    where: { key },
    data,
  });

  // Invalidate caches
  await Promise.all([
    cacheDelete(CACHE_KEYS.flag(key)),
    cacheDelete(CACHE_KEYS.flags()),
  ]);

  logger.info(`[FeatureFlag] Updated flag: ${key}`);
  return flag;
}

/**
 * Delete a feature flag by key.
 */
export async function deleteFlag(key: string): Promise<boolean> {
  try {
    await prisma.featureFlag.delete({ where: { key } });

    await Promise.all([
      cacheDelete(CACHE_KEYS.flag(key)),
      cacheDelete(CACHE_KEYS.flags()),
    ]);

    logger.info(`[FeatureFlag] Deleted flag: ${key}`);
    return true;
  } catch {
    return false;
  }
}

// ─── Evaluation ────────────────────────────────────────────────────────

/**
 * Deterministic hash for rollout percentage. Uses a simple string hash
 * that distributes evenly across 0-99.
 */
function deterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}

/**
 * Check whether a feature flag is enabled for a given context.
 * This is the main entry point consumed by the rest of the app.
 *
 * Evaluation:
 *   1. Flag must exist and be enabled
 *   2. If rollout = 100, always on. If rollout = 0, always off.
 *   3. For 0 < rollout < 100, use deterministic hash of userId.
 *   4. Check conditions.allowedPlans if present.
 */
export async function isEnabled(
  key: string,
  context?: FeatureFlagContext
): Promise<boolean> {
  const flag = await getFlagByKey(key);

  // Flag doesn't exist or is disabled
  if (!flag || !flag.enabled) {
    return false;
  }

  // Full rollout
  if (flag.rollout >= 100) {
    return checkConditions(flag, context);
  }

  // No rollout
  if (flag.rollout <= 0) {
    return false;
  }

  // Partial rollout — deterministic per-user
  if (context?.userId) {
    const hash = deterministicHash(`${key}:${context.userId}`);
    if (hash >= flag.rollout) {
      return false;
    }
  } else {
    // No userId — fall back to random for anonymous users
    const random = Math.floor(Math.random() * 100);
    if (random >= flag.rollout) {
      return false;
    }
  }

  return checkConditions(flag, context);
}

/**
 * Evaluate conditions JSON on a flag. Currently supports:
 * - allowedPlans: string[] — if present, only these plans see the flag
 */
function checkConditions(
  flag: PrismaFeatureFlag,
  context?: FeatureFlagContext
): boolean {
  if (!context) return true;

  const conditions = flag.conditions as Record<string, unknown>;

  // Check allowed plans
  if (Array.isArray(conditions.allowedPlans) && context.plan) {
    return conditions.allowedPlans.includes(context.plan);
  }

  return true;
}
