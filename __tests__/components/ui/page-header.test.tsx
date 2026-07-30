// @vitest-environment jsdom
// =============================================================================
// PageHeader Component Tests
// =============================================================================
// Tests the shared PageHeader component — renders title, optional description,
// and optional actions slot.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/ui/page-header';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <PageHeader title="Dashboard" description="Overview of your projects and analytics." />
    );

    expect(screen.getByText('Overview of your projects and analytics.')).toBeInTheDocument();
  });

  it('renders actions slot when provided', () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button>Create Project</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Create Project' })).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<PageHeader title="Dashboard" />);

    expect(screen.queryByText(/Overview/)).not.toBeInTheDocument();
  });

  it('does not render actions container when actions not provided', () => {
    const { container } = render(<PageHeader title="Dashboard" />);

    const actionsContainer = container.querySelector('.flex.items-center.gap-3');
    expect(actionsContainer).not.toBeInTheDocument();
  });

  it('renders title as h1', () => {
    render(<PageHeader title="Dashboard" />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Dashboard' });
    expect(heading).toBeInTheDocument();
  });
});
