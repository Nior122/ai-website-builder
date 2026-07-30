// =============================================================================
// Audit Logging Service
// =============================================================================
// Records who did what, when. Writes to the AuditLog table via the Prisma
// client. Fire-and-forget pattern: logAuditEntry() never throws, so callers
// can insert a log call without wrapping in try/catch or awaiting.
//
// Reads are paginated and filterable for the admin audit-log view.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { logger } from '@/lib/logger';
import type { AuditLog } from '@prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────

export interface AuditLogInput {
  userId: string;
  action: string;          // e.g. "project.create", "deployment.complete"
  resource: string;        // e.g. "project", "deployment", "page"
  resourceId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  userId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Write ─────────────────────────────────────────────────────────────

/**
 * Write an audit log entry. Fire-and-forget: returns immediately, never throws.
 */
export async function logAuditEntry(
  input: AuditLogInput
): Promise<boolean> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        oldValues: (input.oldValues ?? {}) as any,
        newValues: (input.newValues ?? {}) as any,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
    return true;
  } catch (err) {
    logger.error(`[Audit] Failed to log entry: ${err}`);
    return false;
  }
}

// ─── Read ──────────────────────────────────────────────────────────────

/**
 * Get paginated audit logs with optional filters.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<PaginatedAuditLogs> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.resource) where.resource = filters.resource;
  if (filters.resourceId) where.resourceId = filters.resourceId;
  if (filters.action) where.action = { contains: filters.action };
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Record<string, Date>).gte = new Date(filters.startDate);
    if (filters.endDate) (where.createdAt as Record<string, Date>).lte = new Date(filters.endDate);
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}
