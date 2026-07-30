// =============================================================================
// Data Table Component
// =============================================================================
// Generic reusable table with column definitions and empty state.
// Extracted from admin/users/page.tsx, admin audit log, analytics top pages.
// =============================================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data found.',
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">{emptyMessage}</p>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-neutral-200 bg-white', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left font-medium text-neutral-500',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="border-b border-neutral-50 last:border-0"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-4 py-3', col.className)}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
