// =============================================================================
// Admin Users Page
// =============================================================================
// Paginated user management with search. Shows email, name, plan, project
// count, status, and join date for each user.
// =============================================================================

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader, DataTable, type Column } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ──────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  projectCount: number;
  createdAt: string;
  lastActiveAt: string;
  status: 'active' | 'suspended' | 'deleted';
}

interface UsersResponse {
  data: AdminUser[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Column Definitions ─────────────────────────────────────────────────

const columns: Column<AdminUser>[] = [
  {
    key: 'email',
    header: 'Email',
    render: (user) => (
      <span className="font-mono text-xs text-neutral-700">{user.email}</span>
    ),
  },
  {
    key: 'name',
    header: 'Name',
    render: (user) => <span className="text-neutral-700">{user.name}</span>,
  },
  {
    key: 'plan',
    header: 'Plan',
    render: (user) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          user.plan === 'enterprise'
            ? 'bg-purple-100 text-purple-700'
            : user.plan === 'pro'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-neutral-100 text-neutral-600'
        }`}
      >
        {user.plan}
      </span>
    ),
  },
  {
    key: 'projectCount',
    header: 'Projects',
    render: (user) => <span className="text-neutral-600">{user.projectCount}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          user.status === 'active'
            ? 'bg-green-100 text-green-700'
            : user.status === 'suspended'
              ? 'bg-red-100 text-red-700'
              : 'bg-neutral-100 text-neutral-500'
        }`}
      >
        {user.status}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Joined',
    render: (user) => (
      <span className="text-xs text-neutral-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </span>
    ),
  },
];

// ─── Component ──────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const limit = 20;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);

  const { data, error, isLoading } = useSWR<UsersResponse>(
    `/api/admin/users?${params}`,
    fetcher
  );

  const users = data?.data ?? [];
  const meta = data?.meta;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-600">
          Failed to load users. You may not have admin access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage platform users."
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by email or name…"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Search
        </button>
      </form>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading users…</p>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          emptyMessage="No users found."
        />
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-400">
            Showing {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
