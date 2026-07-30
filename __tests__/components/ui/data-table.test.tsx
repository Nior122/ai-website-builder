// @vitest-environment jsdom
// =============================================================================
// DataTable Component Tests
// =============================================================================
// Tests the generic DataTable<T> component — renders column headers, row data
// via render functions, empty state message, and custom className.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable, type Column } from '@/components/ui/data-table';

interface TestRow {
  id: string;
  name: string;
  role: string;
}

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name },
  { key: 'role', header: 'Role', render: (row) => row.role },
];

const data: TestRow[] = [
  { id: '1', name: 'Alice', role: 'Admin' },
  { id: '2', name: 'Bob', role: 'Member' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders row data via column render functions', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('renders empty message when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
      />
    );

    expect(screen.getByText('No data found.')).toBeInTheDocument();
  });

  it('renders custom empty message when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
        emptyMessage="No users match this filter."
      />
    );

    expect(screen.getByText('No users match this filter.')).toBeInTheDocument();
  });

  it('does not render table when data is empty', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
      />
    );

    expect(container.querySelector('table')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });
});
