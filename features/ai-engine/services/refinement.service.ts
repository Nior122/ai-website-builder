// =============================================================================
// Section Refinement Service
// =============================================================================
// Handles AI-powered refinement of individual sections.
// Supports text content changes, style modifications, and content regeneration.
// =============================================================================

import { createStructuredCompletion } from '@/lib/ai/client';
import { REFINE_SYSTEM_PROMPT, buildRefinePrompt } from '../prompts';
import { checkRateLimit, getAIRateLimitConfig } from '@/lib/redis/rate-limit';
import { RateLimitError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { Section } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────

export interface RefinementRequest {
  sectionId: string;
  sectionType: string;
  currentContent: Record<string, unknown>;
  currentStyles: Record<string, unknown>;
  instruction: string;
}

export interface RefinementResult {
  sectionId: string;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  changes: string[];
}

// ─── Refinement Templates ───────────────────────────────────────────────

const REFINEMENT_TEMPLATES: Record<string, (instruction: string) => string> = {
  rewrite: (instruction) => `Rewrite the content to be more ${instruction}. Keep the same structure but change the tone and wording.`,
  addSection: (instruction) => `Add the following to this section: ${instruction}. Integrate it naturally with the existing content.`,
  removeSection: (instruction) => `Remove the following from this section: ${instruction}. Adjust the remaining content to flow naturally.`,
  changeCTA: (instruction) => `Change the call-to-action to: "${instruction}". Update all related text to match.`,
  shorten: (instruction) => `Shorten this content to be more concise. Target: ${instruction || '50% shorter'}. Keep the key message.`,
  expand: (instruction) => `Expand this content with more detail. Focus on: ${instruction || 'adding more supporting details and examples'}.`,
  seo: (instruction) => `Optimize this content for SEO. Target keywords: ${instruction}. Include keywords naturally in headlines and body text.`,
  tone: (instruction) => `Rewrite this content in a ${instruction} tone. Keep the same message but change the voice.`,
  localize: (instruction) => `Localize this content for ${instruction}. Adapt cultural references, units, and formatting.`,
};

// ─── Main Refinement Function ───────────────────────────────────────────

/**
 * Refine a single section based on user instructions.
 */
export async function refineSection(
  request: RefinementRequest,
  userId: string
): Promise<RefinementResult> {
  // Rate limit check
  const rateLimit = await checkRateLimit(`ai:refine:${userId}`, getAIRateLimitConfig('pro'));
  if (!rateLimit.allowed) {
    throw new RateLimitError(rateLimit.retryAfterMs || 60000);
  }

  // Build the refinement prompt
  const prompt = buildRefinePrompt({
    currentContent: request.currentContent,
    sectionType: request.sectionType,
    instructions: request.instruction,
  });

  // Call Claude for refinement
  const result = await createStructuredCompletion<{
    content: Record<string, unknown>;
    styles?: Record<string, unknown>;
    changes: string[];
  }>({
    system: REFINE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    schema: {
      type: 'object',
      description: 'Refined section data',
      properties: {
        content: {
          type: 'object',
          description: 'Updated section content matching the original schema',
        },
        styles: {
          type: 'object',
          description: 'Updated styles if any style changes were requested',
        },
        changes: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of changes made for user transparency',
        },
      },
    },
  });

  return {
    sectionId: request.sectionId,
    content: result.content || request.currentContent,
    styles: result.styles || request.currentStyles,
    changes: result.changes || ['Content refined'],
  };
}

/**
 * Batch refine multiple sections.
 */
export async function refineSections(
  requests: RefinementRequest[],
  userId: string
): Promise<RefinementResult[]> {
  const results: RefinementResult[] = [];

  for (const request of requests) {
    try {
      const result = await refineSection(request, userId);
      results.push(result);
    } catch (err) {
      logger.error(`Refinement failed for section ${request.sectionId}`, { sectionId: request.sectionId }, err as Error);
      // Return original content on failure
      results.push({
        sectionId: request.sectionId,
        content: request.currentContent,
        styles: request.currentStyles,
        changes: ['Refinement failed — original content preserved'],
      });
    }
  }

  return results;
}

/**
 * Get a quick text refinement without full section restructure.
 * Useful for quick "make this shorter" or "change this word" edits.
 */
export async function quickRefineText(
  text: string,
  instruction: string
): Promise<string> {
  const prompt = [
    `Refine the following text based on this instruction: ${instruction}`,
    `\nOriginal text: "${text}"`,
    `\nReturn ONLY the refined text, nothing else.`,
  ].join('\n');

  const result = await createStructuredCompletion<{ text: string }>({
    system: 'You are a professional copywriter. Refine text precisely as instructed.',
    messages: [{ role: 'user', content: prompt }],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The refined text' },
      },
    },
  });

  return result.text || text;
}

/**
 * Detect the type of refinement from a natural language instruction.
 */
export function detectRefinementType(instruction: string): string {
  const lower = instruction.toLowerCase();

  if (lower.includes('rewrite') || lower.includes('reword')) return 'rewrite';
  if (lower.includes('shorten') || lower.includes('shorter') || lower.includes('concise') || lower.includes('brief')) return 'shorten';
  if (lower.includes('expand') || lower.includes('more detail') || lower.includes('elaborate')) return 'expand';
  if (lower.includes('seo') || lower.includes('keyword')) return 'seo';
  if (lower.includes('tone') || lower.includes('formal') || lower.includes('casual')) return 'tone';
  if (lower.includes('cta') || lower.includes('button') || lower.includes('call to action')) return 'changeCTA';
  if (lower.includes('add') || lower.includes('include')) return 'addSection';
  if (lower.includes('remove') || lower.includes('delete')) return 'removeSection';
  if (lower.includes('local') || lower.includes('translate')) return 'localize';

  return 'rewrite';
}
