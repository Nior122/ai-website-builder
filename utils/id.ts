// =============================================================================
// Utility: ID Generation
// =============================================================================
// Generates unique IDs for entities. Used throughout the application
// for client-side ID generation before server assignment.
// =============================================================================

import { randomBytes } from 'crypto';

/**
 * Generate a prefixed unique ID.
 *
 * @example
 * generateId('project') // => "project_abc123def456"
 * generateId('section') // => "section_xyz789ghi012"
 */
export function generateId(prefix: string = ''): string {
  const random = randomBytes(12).toString('hex');
  return prefix ? `${prefix}_${random}` : random;
}

/**
 * Generate a short ID (8 characters). Useful for display purposes.
 */
export function generateShortId(): string {
  return randomBytes(4).toString('hex');
}

/**
 * Generate a request ID for tracing.
 */
export function generateRequestId(): string {
  return `req_${randomBytes(8).toString('hex')}`;
}

/**
 * Generate a batch of unique IDs.
 */
export function generateIds(prefix: string, count: number): string[] {
  return Array.from({ length: count }, () => generateId(prefix));
}
