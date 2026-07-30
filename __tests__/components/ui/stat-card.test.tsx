// @vitest-environment jsdom
// =============================================================================
// StatCard Component Tests
// =============================================================================
// Tests the shared StatCard component — renders label, value, optional icon,
// and custom className.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/ui/stat-card';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Users" value="1,234" />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <StatCard label="Revenue" value="$50K" icon={<span data-testid="icon">💰</span>} />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('omits icon slot when not provided', () => {
    const { container } = render(<StatCard label="Test" value="123" />);

    // Should render only label and value — no icon wrapper
    expect(container.textContent).toBe('Test123');
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard label="Test" value="123" className="custom-class" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });
});
