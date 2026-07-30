// =============================================================================
// Stats Overview
// =============================================================================
// Row of stat cards showing key metrics: total projects, published, AI
// generations used, and exports remaining.
// =============================================================================

'use client';

import useSWR from 'swr';

interface Stats {
  totalProjects: number;
  publishedProjects: number;
  aiGenerationsUsed: number;
  aiGenerationsLimit: number;
  exportsUsed: number;
  exportsLimit: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function StatsOverview() {
  const { data } = useSWR<{ data: Stats }>('/api/projects/stats', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const stats = data?.data;

  const cards = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects ?? 0,
      icon: '📁',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Published',
      value: stats?.publishedProjects ?? 0,
      icon: '🌐',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'AI Generations',
      value: stats ? `${stats.aiGenerationsUsed}/${stats.aiGenerationsLimit === -1 ? '∞' : stats.aiGenerationsLimit}` : '0/10',
      icon: '✨',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Exports',
      value: stats ? `${stats.exportsUsed}/${stats.exportsLimit === -1 ? '∞' : stats.exportsLimit}` : '0/5',
      icon: '📦',
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">{card.label}</p>
              <p className="text-xl font-semibold text-neutral-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
