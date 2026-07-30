// =============================================================================
// Admin Stats Service
// =============================================================================
// System-wide aggregation for the admin dashboard. Pulls stats from multiple
// Prisma models: User, Project, Deployment, AIGeneration, Subscription.
// Results are cached for 5 minutes to avoid hammering the DB on every page load.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { cacheGetOrSet } from '@/lib/redis/cache';
import { PLANS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { AdminDashboard, UserManagement, SystemHealth } from '../types';

// ─── Cache Keys ───────────────────────────────────────────────────────

const CACHE_TTL = 300; // 5 minutes
const CACHE_KEYS = {
  adminStats: () => 'admin:stats',
  featureFlag: (key: string) => `flag:${key}`,
  featureFlags: () => 'flags:all',
};

// ─── System Stats ─────────────────────────────────────────────────────

/**
 * Aggregate system-wide stats for the admin dashboard.
 * Cached for 5 minutes.
 */
export async function getSystemStats(): Promise<AdminDashboard> {
  return cacheGetOrSet(
    CACHE_KEYS.adminStats(),
    async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        totalProjects,
        totalDeployments,
        aiGenerations,
        subscriptions,
        activeUserIds,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.deployment.count(),
        prisma.aIGeneration.aggregate({
          _count: { id: true },
          _sum: { tokensUsed: true, cost: true },
          _avg: { tokensUsed: true },
        }),
        prisma.subscription.findMany({
          where: { status: { in: ['active', 'trialing'] } },
          select: { plan: true },
        }),
        // Users active in last 30 days (via audit log activity)
        prisma.auditLog.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { userId: true },
          distinct: ['userId'],
        }),
      ]);

      // Calculate revenue from active subscriptions
      const revenue = subscriptions.reduce((sum, sub) => {
        const plan = PLANS[sub.plan as keyof typeof PLANS];
        return sum + (plan?.price?.monthly ?? 0);
      }, 0);

      return {
        totalUsers,
        activeUsers: activeUserIds.length,
        totalProjects,
        totalDeployments,
        revenue,
        aiUsage: {
          totalGenerations: aiGenerations._count.id ?? 0,
          totalTokensUsed: aiGenerations._sum.tokensUsed ?? 0,
          avgTokensPerGeneration: Math.round(aiGenerations._avg.tokensUsed ?? 0),
          estimatedCost: aiGenerations._sum.cost ?? 0,
        },
      };
    },
    CACHE_TTL
  );
}

// ─── User Management ──────────────────────────────────────────────────

export interface GetUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Paginated user list with optional search. Includes project counts and
 * subscription plan for each user.
 */
export async function getUsers(
  options: GetUsersOptions = {}
): Promise<UserManagement> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options.search) {
    where.OR = [
      { email: { contains: options.search, mode: 'insensitive' } },
      { firstName: { contains: options.search, mode: 'insensitive' } },
      { lastName: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || '—',
      plan: u.plan,
      projectCount: u._count.projects,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: u.createdAt.toISOString(), // placeholder — needs lastActiveAt field
      status: 'active' as const,
    })),
    totalCount,
    page,
    pageSize: limit,
  };
}

// ─── System Health ────────────────────────────────────────────────────

/**
 * Check the health of dependent services: database, Redis, AI, storage.
 * Returns individual status for each plus uptime.
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const checks = await Promise.allSettled([
    // Database ping
    prisma.$queryRaw`SELECT 1`.then(() => 'healthy' as const),

    // Redis ping — use cacheGetOrSet with a tiny key
    cacheGetOrSet('health:ping', async () => 'pong', 10).then(() => 'healthy' as const),

    // AI service — just check API key exists (lightweight)
    Promise.resolve(
      process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY
        ? ('healthy' as const)
        : ('down' as const)
    ),

    // Storage — check if S3 config exists
    Promise.resolve(
      process.env.S3_BUCKET_NAME || process.env.ALIBABA_CLOUD_OSS_BUCKET
        ? ('healthy' as const)
        : ('degraded' as const)
    ),
  ]);

  const statuses = checks.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    logger.warn(`[Admin] Health check ${i} failed: ${result.reason}`);
    return 'down' as const;
  });

  return {
    database: statuses[0] as SystemHealth['database'],
    redis: statuses[1] as SystemHealth['redis'],
    aiService: statuses[2] as SystemHealth['aiService'],
    storage: statuses[3] as SystemHealth['storage'],
    uptime: Math.round(process.uptime()),
    lastChecked: new Date().toISOString(),
  };
}
