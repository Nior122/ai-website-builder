// =============================================================================
// Analytics Dashboard Page
// =============================================================================
// Displays project analytics: page views, unique visitors, bounce rate,
// session duration, traffic sources, device breakdown, and a time series
// chart. Uses placeholder data from the analytics service until real
// analytics tracking is wired in.
// =============================================================================

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { StatCard, PageHeader, EmptyState, formatCompactNumber, formatDuration } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ──────────────────────────────────────────────────────────────

interface PageAnalytics {
  path: string;
  title: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  exitRate: number;
}

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface TimeSeriesPoint {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

interface AnalyticsDashboard {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: PageAnalytics[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown;
  timeSeriesData: TimeSeriesPoint[];
}

interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsDashboard;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface ProjectsResponse {
  success: boolean;
  data: Project[];
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <p className="mb-1 text-xs font-medium text-neutral-500">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-xs" style={{ color: item.color }}>
          {item.name}: {formatCompactNumber(item.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch user's projects for the selector
  const { data: projectsData } = useSWR<ProjectsResponse>(
    '/api/projects?limit=50',
    fetcher
  );

  const projects = projectsData?.data ?? [];
  const activeProjectId = selectedProject || projects[0]?.id || '';

  // Fetch analytics for selected project
  const { data: analyticsData, isLoading } = useSWR<AnalyticsResponse>(
    activeProjectId
      ? `/api/analytics/${activeProjectId}?period=${period}`
      : null,
    fetcher
  );

  const analytics = analyticsData?.data;

  // Device breakdown chart data
  const deviceData = analytics
    ? [
        { name: 'Desktop', value: analytics.deviceBreakdown.desktop },
        { name: 'Mobile', value: analytics.deviceBreakdown.mobile },
        { name: 'Tablet', value: analytics.deviceBreakdown.tablet },
      ]
    : [];

  const totalDevices = deviceData.reduce((sum, d) => sum + d.value, 0);

  // Traffic source colors
  const SOURCE_COLORS = [
    '#6366f1',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Track your website performance and visitor insights."
        actions={
          <>
            <select
              value={activeProjectId}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
                </button>
              ))}
            </div>
          </>
        }
      />

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-neutral-200 bg-white"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl border border-neutral-200 bg-white" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !analytics && (
        <EmptyState
          title="No projects to analyze"
          description="Create a project first, then view its analytics here."
        />
      )}

      {/* Dashboard */}
      {analytics && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Page Views"
              value={formatCompactNumber(analytics.pageViews)}
              icon="👁️"
            />
            <StatCard
              label="Unique Visitors"
              value={formatCompactNumber(analytics.uniqueVisitors)}
              icon="👤"
            />
            <StatCard
              label="Bounce Rate"
              value={`${(analytics.bounceRate * 100).toFixed(1)}%`}
              icon="↩️"
            />
            <StatCard
              label="Avg. Session"
              value={formatDuration(analytics.avgSessionDuration)}
              icon="⏱️"
            />
          </div>

          {/* Time Series Chart */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">
              Traffic Over Time
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#a3a3a3' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#a3a3a3' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatCompactNumber(v)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueVisitors"
                    name="Unique Visitors"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Traffic Sources */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-neutral-900">
                Traffic Sources
              </h2>
              <div className="space-y-3">
                {analytics.trafficSources.map((source, i) => (
                  <div key={source.source}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-700">
                        {source.source}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatCompactNumber(source.visitors)} ({source.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${source.percentage}%`,
                          backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-neutral-900">
                Device Breakdown
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#a3a3a3' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#a3a3a3' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => formatCompactNumber(v)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Visitors"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Device percentages */}
              <div className="mt-3 flex justify-center gap-6">
                {deviceData.map((d) => (
                  <div key={d.name} className="text-center">
                    <p className="text-xs font-medium text-neutral-900">
                      {d.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {totalDevices > 0
                        ? `${((d.value / totalDevices) * 100).toFixed(1)}%`
                        : '0%'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Pages Table */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">
              Top Pages
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="pb-2 font-medium text-neutral-500">Page</th>
                    <th className="pb-2 text-right font-medium text-neutral-500">
                      Views
                    </th>
                    <th className="pb-2 text-right font-medium text-neutral-500">
                      Visitors
                    </th>
                    <th className="pb-2 text-right font-medium text-neutral-500">
                      Avg. Time
                    </th>
                    <th className="pb-2 text-right font-medium text-neutral-500">
                      Exit Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPages.map((page) => (
                    <tr
                      key={page.path}
                      className="border-b border-neutral-50 last:border-0"
                    >
                      <td className="py-2.5">
                        <span className="font-medium text-neutral-900">
                          {page.title}
                        </span>
                        <span className="ml-2 text-neutral-400">
                          {page.path}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-neutral-700">
                        {formatCompactNumber(page.views)}
                      </td>
                      <td className="py-2.5 text-right text-neutral-700">
                        {formatCompactNumber(page.uniqueVisitors)}
                      </td>
                      <td className="py-2.5 text-right text-neutral-700">
                        {formatDuration(page.avgTimeOnPage)}
                      </td>
                      <td className="py-2.5 text-right text-neutral-700">
                        {(page.exitRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
