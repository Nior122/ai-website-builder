// =============================================================================
// AI Response Normalizer
// =============================================================================
// Provider-independent normalization layer for AI JSON responses.
//
// Handles:
//   1. JSON extraction from markdown code fences
//   2. JSON extraction from surrounding explanatory text
//   3. Auto-repair of common JSON syntax errors (missing commas, trailing commas,
//      smart quotes, single quotes)
//   4. Wrapper unwrapping (website, data, result, response, output objects)
//   5. Object → Array normalization for known array fields
//   6. null → [], undefined → default conversions
//   7. Comprehensive error reporting with full field paths
// =============================================================================

import { logger } from '@/lib/logger';

const LOG = { service: 'ai-normalizer' } as const;

// ─── Known Array Fields ───────────────────────────────────────────────────
// Every field path that MUST be an array. The normalizer walks the entire
// object and converts any of these that appear as objects into arrays.
//
// Paths use dot notation. "[n]" means "any index in an array at this level".
// Both with and without "[n]" variants are checked.
const ARRAY_FIELD_PATHS = new Set([
  // Top-level project structure
  'pages',

  // Page → sections
  'pages.sections',
  'sections',

  // Section content arrays (features)
  'items',
  'features',
  'features.items',

  // Testimonials
  'testimonials',
  'testimonials.items',

  // Pricing
  'pricing',
  'pricing.plans',
  'plans',

  // FAQ
  'faq',
  'faq.items',

  // Gallery
  'gallery',
  'gallery.images',
  'gallery.items',
  'images',

  // Team
  'team',
  'team.members',
  'members',

  // Stats
  'stats',
  'stats.items',

  // Services
  'services',
  'services.items',

  // Blog
  'blog',
  'blog.posts',
  'posts',

  // Process / timeline
  'process',
  'process.steps',
  'steps',
  'timeline',
  'timeline.items',

  // Portfolio
  'portfolio',
  'portfolio.items',

  // Accordion / tabs
  'accordion',
  'accordion.items',
  'tabs',
  'tabs.items',

  // Content items (generic reusable array)
  'contentItemSchema',
  'features',
  'services',

  // Navigation
  'navbar',
  'navbar.links',
  'links',

  // Footer
  'footer',
  'footer.columns',
  'footer.socialLinks',
  'socialLinks',
  'columns',

  // Logo cloud
  'logoCloud',
  'logoCloud.logos',
  'logos',

  // Brand
  'brand.values',
  'values',

  // Page sections (alternate path)
  'page.sections',
]);

// ─── Wrapper Keys ─────────────────────────────────────────────────────────
// When the AI wraps the entire response in a container object like
// { "website": { ... } } or { "data": { ... } }, we unwrap it automatically.
const WRAPPER_KEYS = ['website', 'data', 'result', 'response', 'output', 'generated_website', 'site', 'project'];

// ─── Logging flag ─────────────────────────────────────────────────────────
let _logRawResponse = false;

/**
 * Enable or disable raw response logging for debugging.
 */
export function setLogRawResponses(enabled: boolean): void {
  _logRawResponse = enabled;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK 1: Raw Response Logging
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log the complete raw AI response before any normalization.
 * Uses console.dir with {depth:null} so nothing is truncated.
 */
export function logRawResponse(label: string, text: string): void {
  if (!_logRawResponse) return;
  console.log(`\n══════════ RAW AI RESPONSE (${label}) ══════════`);
  console.log(text);
  console.log(`══════════ END RAW RESPONSE ══════════\n`);

  // Also log via structured logger
  logger.info(`RAW AI RESPONSE (${label}): ${text.slice(0, 5000)}${text.length > 5000 ? '...' : ''}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK 5+6: JSON Extraction from Markdown + Explanatory Text
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strip markdown code fences from a JSON string.
 * Handles ```json, ```js, ```javascript, and bare ```.
 */
function stripMarkdownFences(text: string): string {
  // Match ```json ... ``` or ```js ... ``` or ```javascript ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json|js|javascript)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return text;
}

/**
 * Extract JSON from text that may contain explanatory surrounding content.
 * Looks for the first { and last } to extract the JSON object.
 * Falls back to first [ and last ] if no object found.
 */
function extractJSONFromText(text: string): string {
  let cleaned = text.trim();

  // Try to extract from markdown code blocks first
  cleaned = stripMarkdownFences(cleaned);

  // Find the first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    return cleaned;
  }

  // Fallback: try array extraction
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }

  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK 7: JSON Auto-Repair
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Attempt to repair common JSON syntax errors.
 * Each repair strategy is tried independently, and the result is tested.
 */
function repairJSON(text: string): string {
  let repaired = text;

  // 1. Replace smart/curly quotes with straight quotes
  repaired = repaired.replace(/[“”]/g, '"');
  repaired = repaired.replace(/[‘’]/g, "'");

  // 2. Replace single quotes with double quotes (for property names and strings)
  // Only replace single quotes that are NOT inside double-quoted strings
  repaired = repaired.replace(/(?<=:\s*)'(.*?)'(?=\s*[,}\]])/g, '"$1"');
  repaired = repaired.replace(/(?<=[{,]\s*)'(.*?)'(?=\s*:)/g, '"$1"');

  // 3. Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,\s*}/g, '}');
  repaired = repaired.replace(/,\s*]/g, ']');

  // 4. Remove leading/trailing whitespace between commas
  repaired = repaired.replace(/,\s+,/g, ',');

  // 5. Fix missing commas between properties (look for "}{" without comma)
  repaired = repaired.replace(/}\s*{/g, '},{');
  repaired = repaired.replace(/]\s*{/g, '],{');
  repaired = repaired.replace(/}\s*\[/g, '},[');

  // 6. Unescape escaped newlines (\\n → \n inside strings)
  repaired = repaired.replace(/\\\\n/g, '\\n');

  // 7. Remove trailing commas after last array element before ]
  repaired = repaired.replace(/,\s*]/g, ']');

  // 8. Fix hex-escaped characters (\xXX → unicode)
  repaired = repaired.replace(/\\x([0-9a-fA-F]{2})/g, '\\u00$1');

  // 9. Remove BOM characters
  repaired = repaired.replace(/^﻿/, '');

  return repaired;
}

/**
 * Attempt to parse JSON with auto-repair.
 * Tries parsing as-is first, then applies each repair strategy.
 */
export function safeJSONParse(text: string): { success: true; data: unknown } | { success: false; error: string; raw: string } {
  // Step 1: Extract JSON from surrounding text
  let cleaned = extractJSONFromText(text);

  // Step 2: Try direct parse first
  try {
    const data = JSON.parse(cleaned);
    return { success: true, data };
  } catch {
    // Fall through to repair
  }

  // Step 3: Apply repairs and try again
  const repaired = repairJSON(cleaned);
  try {
    const data = JSON.parse(repaired);
    return { success: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: `Failed to parse JSON: ${msg}`,
      raw: cleaned,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK 4: Wrapper Unwrapping
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unwrap known container objects (website, data, result, etc.).
 * If the parsed object has a single key that matches a known wrapper,
 * return the wrapped value instead.
 */
function unwrapWrappers(obj: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(obj);

  // If there's exactly one key and it's a known wrapper, unwrap it
  if (keys.length === 1) {
    const key = keys[0];
    if (WRAPPER_KEYS.includes(key) || key === 'data') {
      const value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        logger.info(`Normalizer: Unwrapped wrapper key "${key}"`, LOG);
        return value as Record<string, unknown>;
      }
    }
  }

  // Also check nested: if obj has a 'website' or 'data' property that contains
  // the actual payload (with brand/pages/theme), unwrap it
  for (const key of WRAPPER_KEYS) {
    if (key in obj) {
      const value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const inner = value as Record<string, unknown>;
        // Only unwrap if the inner object has the expected structure
        if (hasProjectStructure(inner)) {
          logger.info(`Normalizer: Unwrapped wrapper key "${key}" (nested)`, LOG);
          return inner;
        }
      }
    }
  }

  return obj;
}

/**
 * Check if an object looks like a project structure (has brand/pages/theme).
 */
function hasProjectStructure(obj: Record<string, unknown>): boolean {
  const hasBrand = 'brand' in obj;
  const hasPages = 'pages' in obj;
  const hasTheme = 'theme' in obj;
  return hasBrand || hasPages || (hasTheme && hasBrand);
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK 3+10: Object → Array Normalization
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Walk an object and normalize any field that should be an array.
 * If the field is an object instead of an array, wrap it in an array.
 * If the field is null, convert to empty array.
 * Works recursively for nested objects.
 *
 * @param obj      - The object to normalize (mutated in place)
 * @param path     - Current dot-notation path (for recursive calls)
 * @param fixCount - Running count of fixes applied (for logging)
 */
function normalizeArrays(
  obj: unknown,
  path: string = '',
  fixCount: Record<string, number> = { count: 0 }
): void {
  if (!obj || typeof obj !== 'object') return;

  // Handle arrays: recurse into each element
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      normalizeArrays(obj[i], `${path}[${i}]`, fixCount);
    }
    return;
  }

  const record = obj as Record<string, unknown>;

  // Normalize known array fields
  for (const key of Object.keys(record)) {
    const value = record[key];
    const currentPath = path ? `${path}.${key}` : key;

    // Check if this field should be an array
    if (ARRAY_FIELD_PATHS.has(key) || ARRAY_FIELD_PATHS.has(currentPath)) {
      if (value === null || value === undefined) {
        record[key] = [];
        fixCount.count++;
        logger.info(`Normalizer: Converted null/undefined to [] at "${currentPath}"`, LOG);
      } else if (!Array.isArray(value) && typeof value === 'object') {
        // Object → wrap in array
        record[key] = [value];
        fixCount.count++;
        logger.info(`Normalizer: Wrapped object in array at "${currentPath}"`, LOG);
      }
    }

    // Recurse into sub-objects and arrays (but skip primitives)
    if (value && typeof value === 'object') {
      normalizeArrays(value, currentPath, fixCount);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Entry Point
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NormalizationResult — either the normalized data or detailed error info.
 */
export interface NormalizationResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  /** Number of normalization fixes applied. */
  fixesApplied: number;
}

/**
 * Completely normalize a raw AI text response into a validated Record.
 *
 * This is the single entry point for ALL AI response normalization.
 * It performs these steps in order:
 *
 *   1. Raw response logging (if enabled)
 *   2. JSON extraction from markdown/explanatory text
 *   3. Safe JSON parsing with auto-repair
 *   4. Wrapper object unwrapping (website, data, etc.)
 *   5. Object → Array normalization for known array fields
 *   6. Defensive deep clone to avoid mutation issues
 *
 * @param label     - Descriptive label for error messages / logs
 * @param text      - Raw AI response text
 * @returns         NormalizationResult with the normalized data or error
 */
export function normalizeRawResponse(
  label: string,
  text: string
): NormalizationResult {
  const LOG_TAG = `Normalizer[${label}]`;

  // TASK 1: Log raw response
  logRawResponse(label, text);

  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: `${LOG_TAG}: Empty response from AI provider`,
      fixesApplied: 0,
    };
  }

  // TASK 5+6+7: Extract and parse JSON
  const parseResult = safeJSONParse(text);

  if (!parseResult.success) {
    return {
      success: false,
      error: `${LOG_TAG}: ${parseResult.error}`,
      fixesApplied: 0,
    };
  }

  let data = parseResult.data;

  // Ensure we have an object, not an array or primitive
  if (Array.isArray(data)) {
    // Some models return an array directly (e.g. [{ page: {...} }])
    // Wrap it in { pages: data }
    data = { pages: data };
  }

  if (typeof data !== 'object' || data === null) {
    return {
      success: false,
      error: `${LOG_TAG}: Expected object, got ${typeof data}`,
      fixesApplied: 0,
    };
  }

  const result = data as Record<string, unknown>;

  // TASK 4: Unwrap wrappers
  const unwrapped = unwrapWrappers(result);

  // TASK 3+10: Normalize array fields
  const fixCount = { count: 0 };
  normalizeArrays(unwrapped, '', fixCount);

  if (fixCount.count > 0) {
    logger.info(`Normalizer: Applied ${fixCount.count} normalization fixes for ${label}`, LOG);
  }

  return {
    success: true,
    data: JSON.parse(JSON.stringify(unwrapped)), // Defensive deep clone
    fixesApplied: fixCount.count,
  };
}

/**
 * Normalize section content at the section level.
 * Used inside the JSON transformer to fix section-specific content fields.
 */
export function normalizeSectionContent(
  sectionType: string,
  content: Record<string, unknown>
): Record<string, unknown> {
  const fixCount = { count: 0 };
  normalizeArrays(content, `section.${sectionType}`, fixCount);

  if (fixCount.count > 0) {
    logger.info(`Normalizer: Applied ${fixCount.count} fixes to section "${sectionType}" content`, LOG);
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK 2+8: Detailed Error Formatting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format a Zod validation error with full field paths, expected types, and received types.
 */
export function formatValidationErrors(
  errors: Array<{
    path: string;
    expected?: string;
    received?: string;
    message: string;
  }>
): string {
  if (errors.length === 0) return 'No validation errors';

  const lines = errors.map((e, i) => {
    const path = e.path || 'root';
    const expected = e.expected || '';
    const received = e.received || '';
    const parts = [`[${i + 1}] ${path}`];
    if (expected && received) {
      parts.push(`expected ${expected}, received ${received}`);
    } else {
      parts.push(e.message);
    }
    return parts.join(': ');
  });

  return '\n' + lines.join('\n');
}

/**
 * Stringify an error safely — never produces "[object Object]".
 */
export function safeStringify(value: unknown, fallback: string = 'unknown error'): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
}

/**
 * Deep-log an object using console.dir with {depth:null}.
 */
export function deepLog(label: string, value: unknown): void {
  console.log(`\n══════════ ${label} ══════════`);
  console.dir(value, { depth: null });
  console.log(`══════════ END ${label} ══════════\n`);
}
