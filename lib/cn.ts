// =============================================================================
// cn() — Tailwind Class Merger
// =============================================================================
// Merges class names with tailwind-merge for conflict resolution.
// Used by all components for conditional/dynamic class composition.
// =============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
