// =============================================================================
// Shared Formatter Utilities
// =============================================================================
// Reusable formatting functions extracted from dashboard pages (analytics,
// admin). Pure functions with no React dependencies.
// =============================================================================

/**
 * Format a number with K/M suffixes for compact display.
 * Used in analytics stat cards and charts.
 */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Format a number with locale separators (e.g. 1,234,567).
 * Used in admin stat cards.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Format a dollar amount as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a duration in seconds to "Xm Ys".
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Format uptime in seconds to "Xd Yh" or "Xh Ym".
 */
export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}
