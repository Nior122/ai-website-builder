// @vitest-environment jsdom
// =============================================================================
// EmptyState Component Tests
// =============================================================================
// Tests the shared EmptyState component — renders title, description, optional
// icon, and optional action button with click handler.
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState title="No projects found" description="Create your first project to get started." />
    );

    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started.')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState title="Title" icon={<span data-testid="icon">📂</span>} />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders action button when action is provided and calls onClick', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Title"
        action={{ label: 'Create Project', onClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Project' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when action is not provided', () => {
    render(<EmptyState title="Title" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render icon when not provided', () => {
    render(<EmptyState title="Title" />);

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Title" />);

    // No description text should exist (title text exists but is the title prop)
    expect(screen.queryByText(/^description$/i)).not.toBeInTheDocument();
  });
});
