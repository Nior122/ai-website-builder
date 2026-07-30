// =============================================================================
// Utility: Formatting Functions
// =============================================================================
// Standardized formatting for display across the application.
// =============================================================================

/**
 * Format a number with commas.
 *
 * @example
 * formatNumber(1234567) // => "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a number as currency.
 *
 * @example
 * formatCurrency(29.99) // => "$29.99"
 * formatCurrency(0) // => "Free"
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Format bytes to human-readable size.
 *
 * @example
 * formatFileSize(1024) // => "1 KB"
 * formatFileSize(1048576) // => "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Format a date to a readable string.
 *
 * @example
 * formatDate(new Date()) // => "Jan 15, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date to relative time.
 *
 * @example
 * relativeTime(new Date(Date.now() - 60000)) // => "1 minute ago"
 */
export function relativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return formatDate(d);
}

/**
 * Truncate text to a max length with ellipsis.
 *
 * @example
 * truncate("Hello World", 5) // => "Hello..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Pluralize a word based on count.
 *
 * @example
 * pluralize(1, 'project') // => "project"
 * pluralize(5, 'project') // => "projects"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

/**
 * Alias for relativeTime — more natural name in UI components.
 */
export const timeAgo = relativeTime;
