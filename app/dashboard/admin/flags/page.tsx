// =============================================================================
// Feature Flags Page
// =============================================================================
// Manage feature flags: create, edit, toggle enabled/disabled, set rollout
// percentage, and delete. Flags are evaluated via the feature-flag service
// and checked by clients through /api/flags/[key]/check.
// =============================================================================

'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ──────────────────────────────────────────────────────────────

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout: number;
  conditions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function FeatureFlagsPage() {
  const { data, error, isLoading, mutate } = useSWR<{ data: FeatureFlag[] }>(
    '/api/admin/flags',
    fetcher
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRollout, setFormRollout] = useState(0);
  const [formError, setFormError] = useState('');

  const flags = data?.data ?? [];

  function resetForm() {
    setFormKey('');
    setFormName('');
    setFormDesc('');
    setFormRollout(0);
    setFormError('');
    setShowCreate(false);
    setEditing(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formKey,
          name: formName,
          description: formDesc || undefined,
          rollout: formRollout,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setFormError(body.error?.message ?? 'Failed to create flag');
        return;
      }

      resetForm();
      mutate();
    } catch {
      setFormError('Network error');
    }
  }

  async function handleToggle(flag: FeatureFlag) {
    await fetch(`/api/admin/flags/${flag.key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !flag.enabled }),
    });
    mutate();
  }

  async function handleRolloutChange(flag: FeatureFlag, value: number) {
    await fetch(`/api/admin/flags/${flag.key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollout: value }),
    });
    mutate();
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete flag "${key}"? This cannot be undone.`)) return;

    await fetch(`/api/admin/flags/${key}`, { method: 'DELETE' });
    mutate();
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-600">
          Failed to load feature flags. You may not have admin access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Feature Flags</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Control feature rollouts and progressive delivery.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + New Flag
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4"
        >
          <h3 className="font-semibold text-neutral-900">Create Feature Flag</h3>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500">
                Key *
              </label>
              <input
                type="text"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                placeholder="my-feature"
                required
                pattern="[a-z0-9_-]+"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-mono focus:border-neutral-400 focus:outline-none"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Lowercase letters, numbers, underscores, hyphens
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500">
                Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My Feature"
                required
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Description
            </label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="What this flag controls…"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Rollout Percentage: {formRollout}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={formRollout}
              onChange={(e) => setFormRollout(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Create
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Flags Table */}
      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading flags…</p>
      ) : flags.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-400">No feature flags yet.</p>
          <p className="mt-1 text-xs text-neutral-300">
            Create one to start progressive rollouts.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">
                  Key
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">
                  Rollout
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr
                  key={flag.id}
                  className="border-b border-neutral-50 last:border-0"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(flag)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        flag.enabled ? 'bg-green-500' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                    {flag.key}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{flag.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={flag.rollout}
                        onChange={(e) =>
                          handleRolloutChange(flag, Number(e.target.value))
                        }
                        className="w-20"
                      />
                      <span className="text-xs text-neutral-500 w-8">
                        {flag.rollout}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(flag.key)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
