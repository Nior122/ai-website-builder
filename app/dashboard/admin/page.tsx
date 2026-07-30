// =============================================================================
// Admin Dashboard Page
// =============================================================================
// System-wide observability: stats cards (users, projects, revenue, AI cost),
// system health indicators, and recent audit log entries. Only visible to
// admin users (nav link is conditional on role).
// =============================================================================

'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { StatCard, HealthIndicator, PageHeader, formatNumber, formatCurrency, formatUptime } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ──────────────────────────────────────────────────────────────

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  redis: 'healthy' | 'degraded' | 'down';
  aiService: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastChecked: string;
}

interface AIUsageStats {
  totalGenerations: number;
  totalTokensUsed: number;
  avgTokensPerGeneration: number;
  estimatedCost: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalDeployments: number;
  revenue: number;
  aiUsage: AIUsageStats;
  health: SystemHealth;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, error, isLoading } = useSWR<{ data: AdminStats }>(
    '/api/admin/stats',
    fetcher
  );

  const { data: auditData } = useSWR<{ data: AuditLogEntry[] }>(
    '/api/admin/audit?limit=10',
    fetcher
  );

  const stats = data?.data;
  const auditLogs = auditData?.data ?? [];

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-600">
          Failed to load admin stats. You may not have admin access.
        </p>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-neutral-500">Loading admin dashboard…</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: formatNumber(stats.totalUsers), icon: '👥' },
    { label: 'Active Users (30d)', value: formatNumber(stats.activeUsers), icon: '🔥' },
    { label: 'Projects', value: formatNumber(stats.totalProjects), icon: '📁' },
    { label: 'Deployments', value: formatNumber(stats.totalDeployments), icon: '🚀' },
    { label: 'MRR', value: formatCurrency(stats.revenue), icon: '💰' },
    { label: 'AI Cost', value: formatCurrency(stats.aiUsage.estimatedCost), icon: '🤖' },
    { label: 'AI Generations', value: formatNumber(stats.aiUsage.totalGenerations), icon: '✨' },
    { label: 'Tokens Used', value: formatNumber(stats.aiUsage.totalTokensUsed), icon: '📝' },
  ];

  const healthItems = [
    { label: 'Database', status: stats.health.database },
    { label: 'Redis', status: stats.health.redis },
    { label: 'AI Service', status: stats.health.aiService },
    { label: 'Storage', status: stats.health.storage },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="System-wide overview and management."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      {/* System Health + Quick Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Health */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900">
            System Health
          </h2>
          <div className="mt-4 space-y-3">
            {healthItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-neutral-600">{item.label}</span>
                <HealthIndicator status={item.status} />
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <p className="text-xs text-neutral-400">
              Uptime: {formatUptime(stats.health.uptime)} · Last checked:{' '}
              {new Date(stats.health.lastChecked).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Manage</h2>
          <div className="mt-4 space-y-2">
            <Link
              href="/dashboard/admin/users"
              className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <span>👥</span>
              User Management
            </Link>
            <Link
              href="/dashboard/admin/flags"
              className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <span>🚩</span>
              Feature Flags
            </Link>
            <Link
              href="/dashboard/admin/audit"
              className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <span>📋</span>
              Audit Log
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recent Activity
          </h2>
          <Link
            href="/dashboard/admin/audit"
            className="text-sm text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {auditLogs.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No recent activity.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-2 text-left font-medium text-neutral-500">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-neutral-500">
                    Resource
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-neutral-500">
                    User
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-neutral-500">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-50">
                    <td className="px-4 py-2 font-mono text-xs text-neutral-700">
                      {log.action}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">
                      {log.resource}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-neutral-500">
                      {log.userId.slice(0, 12)}…
                    </td>
                    <td className="px-4 py-2 text-xs text-neutral-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
