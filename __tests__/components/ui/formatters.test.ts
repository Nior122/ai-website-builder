// =============================================================================
// Formatter Utilities Tests
// =============================================================================
// Tests the pure-formatter functions (no React dependency — no jsdom needed).
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  formatCompactNumber,
  formatNumber,
  formatCurrency,
  formatDuration,
  formatUptime,
} from '@/components/ui/formatters';

describe('formatCompactNumber', () => {
  it('returns string for small numbers', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(42)).toBe('42');
    expect(formatCompactNumber(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCompactNumber(1000)).toBe('1.0K');
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(999999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatCompactNumber(1_000_000)).toBe('1.0M');
    expect(formatCompactNumber(2_500_000)).toBe('2.5M');
    expect(formatCompactNumber(10_000_000)).toBe('10.0M');
  });
});

describe('formatNumber', () => {
  it('formats with locale separators', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatCurrency', () => {
  it('formats as USD currency', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(10)).toBe('$10.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0.1)).toBe('$0.10');
  });
});

describe('formatDuration', () => {
  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0m 0s');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('0m 45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(120)).toBe('2m 0s');
  });
});

describe('formatUptime', () => {
  it('formats hours and minutes', () => {
    expect(formatUptime(3660)).toBe('1h 1m');
    expect(formatUptime(7200)).toBe('2h 0m');
  });

  it('formats 24h as hours (not days)', () => {
    // Exactly 24 hours — `hours > 24` is false so it stays in hours mode
    expect(formatUptime(86400)).toBe('24h 0m');
  });

  it('formats days and hours when over 24h', () => {
    expect(formatUptime(90000)).toBe('1d 1h');
    expect(formatUptime(172800)).toBe('2d 0h');
    expect(formatUptime(259200)).toBe('3d 0h');
  });

  it('handles zero', () => {
    expect(formatUptime(0)).toBe('0h 0m');
  });
});
