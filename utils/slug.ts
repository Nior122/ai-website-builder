// =============================================================================
// Utility: Slug Generation
// =============================================================================
// Generates URL-safe slugs from strings. Used for projects, pages, and routes.
// =============================================================================

import { VALIDATION } from '@/lib/constants';

/**
 * Generate a URL-safe slug from a string.
 *
 * @example
 * generateSlug("My Restaurant Website") // => "my-restaurant-website"
 * generateSlug("AI & Co.") // => "ai-co"
 */
export function generateSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric characters (except hyphens) with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse multiple hyphens
    .replace(/-{2,}/g, '-')
    // Truncate to max length
    .slice(0, VALIDATION.slug.maxLength);

  return slug || 'untitled';
}

/**
 * Validate a slug format.
 */
export function isValidSlug(slug: string): boolean {
  return VALIDATION.slug.pattern.test(slug);
}

/**
 * Ensure a slug is unique by appending a number if needed.
 *
 * @example
 * ensureUniqueSlug("about", ["about", "about-2"]) // => "about-3"
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}
