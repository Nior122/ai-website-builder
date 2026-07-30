// =============================================================================
// Templates Page
// =============================================================================
// Browse and preview starter templates for quick website creation.
// =============================================================================

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Template {
  id: string;
  name: string;
  description: string;
  industry: string;
  thumbnailUrl: string | null;
  isPremium: boolean;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ data: Template[] }>('/api/templates', fetcher);
  const [industry, setIndustry] = useState('all');

  const templates = data?.data ?? [];
  const filtered = industry === 'all' ? templates : templates.filter((t) => t.industry === industry);
  const industries = [...new Set(templates.map((t) => t.industry))];

  const handleUseTemplate = async (templateId: string) => {
    const res = await fetch('/api/generate/create-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Template Project', templateId }),
    });
    if (res.ok) {
      const { data: project } = await res.json();
      router.push(`/editor/${project.id}`);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Templates</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Start with a professionally designed template and customize it to your needs.
      </p>

      {/* Industry Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setIndustry('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            industry === 'all'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          All
        </button>
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setIndustry(ind)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              industry === ind
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-neutral-200 bg-white">
              <div className="h-48 bg-neutral-100 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded bg-neutral-100" />
                <div className="h-3 w-full rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center">
          <p className="text-sm text-neutral-500">No templates found for this industry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative h-48 bg-neutral-100">
                {template.thumbnailUrl ? (
                  <img src={template.thumbnailUrl} alt={template.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl opacity-30">🎨</div>
                )}
                {template.isPremium && (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                    Premium
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="mb-1 text-sm font-semibold text-neutral-900">{template.name}</h3>
                <p className="mb-3 line-clamp-2 text-xs text-neutral-500">{template.description}</p>
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
