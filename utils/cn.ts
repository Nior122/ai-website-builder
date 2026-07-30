// =============================================================================
// Utility: cn (ClassName Merger)
// =============================================================================
// Combines clsx and tailwind-merge for conflict-free class names.
// This is the standard pattern used throughout the codebase.
// =============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution.
 *
 * @example
 * cn('px-4 py-2', 'px-8') // => 'py-2 px-8' (px-4 overridden)
 * cn(isActive && 'bg-brand-500') // => 'bg-brand-500' or ''
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
