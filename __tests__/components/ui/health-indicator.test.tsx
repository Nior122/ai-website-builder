// @vitest-environment jsdom
// =============================================================================
// HealthIndicator Component Tests
// =============================================================================
// Tests the shared HealthIndicator component — renders colored dot with label
// based on status, supports custom label and showLabel flag.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthIndicator } from '@/components/ui/health-indicator';

describe('HealthIndicator', () => {
  it('renders default label for healthy status', () => {
    render(<HealthIndicator status="healthy" />);
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('renders default label for degraded status', () => {
    render(<HealthIndicator status="degraded" />);
    expect(screen.getByText('degraded')).toBeInTheDocument();
  });

  it('renders default label for down status', () => {
    render(<HealthIndicator status="down" />);
    expect(screen.getByText('down')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<HealthIndicator status="healthy" label="API Server" />);
    expect(screen.getByText('API Server')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    const { container } = render(
      <HealthIndicator status="healthy" showLabel={false} />
    );
    // The dot + container should exist, but no text
    expect(container.textContent?.trim()).toBe('');
  });

  it('applies correct color class per status', () => {
    const { container, rerender } = render(<HealthIndicator status="healthy" showLabel={false} />);
    const dot = container.querySelector('span');
    expect(dot?.className).toContain('bg-green-500');

    rerender(<HealthIndicator status="degraded" showLabel={false} />);
    const dot2 = container.querySelector('span');
    expect(dot2?.className).toContain('bg-yellow-500');

    rerender(<HealthIndicator status="down" showLabel={false} />);
    const dot3 = container.querySelector('span');
    expect(dot3?.className).toContain('bg-red-500');
  });
});
