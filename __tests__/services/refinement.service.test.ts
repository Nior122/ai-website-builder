// =============================================================================
// Refinement Service Tests
// =============================================================================
// Unit tests for section refinement, batch refinement, quick text refinement,
// and refinement type detection.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RefinementRequest } from '@/features/ai-engine/services/refinement.service';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/ai/client', () => ({
  createStructuredCompletion: vi.fn(),
}));

vi.mock('@/lib/redis/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getAIRateLimitConfig: vi.fn().mockReturnValue({ maxRequests: 60, windowMs: 60000 }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/features/ai-engine/prompts', () => ({
  REFINE_SYSTEM_PROMPT: 'You refine sections.',
  buildRefinePrompt: vi.fn().mockReturnValue('Build a refinement prompt'),
}));

// ─── Imports ───────────────────────────────────────────────────────────

import {
  refineSection,
  refineSections,
  quickRefineText,
  detectRefinementType,
} from '@/features/ai-engine/services/refinement.service';
import { createStructuredCompletion } from '@/lib/ai/client';
import { checkRateLimit } from '@/lib/redis/rate-limit';

// ─── Test Data ─────────────────────────────────────────────────────────

const mockRefinementRequest: RefinementRequest = {
  sectionId: 'sec_1',
  sectionType: 'hero',
  currentContent: { headline: 'Original', body: 'Body text' },
  currentStyles: { backgroundColor: '#fff' },
  instruction: 'Make it more professional',
};

// ─── Tests ─────────────────────────────────────────────────────────────

describe('RefinementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never);
    vi.mocked(createStructuredCompletion).mockResolvedValue({
      content: { headline: 'Refined', body: 'Refined body' },
      styles: { color: 'navy' },
      changes: ['Updated headline tone', 'Added professional styling'],
    });
  });

  describe('refineSection', () => {
    it('should return refined section with AI response', async () => {
      const result = await refineSection(mockRefinementRequest, 'user_1');

      expect(result.sectionId).toBe('sec_1');
      expect(result.content).toEqual({ headline: 'Refined', body: 'Refined body' });
      expect(result.styles).toEqual({ color: 'navy' });
      expect(result.changes).toEqual(['Updated headline tone', 'Added professional styling']);
    });

    it('should call createStructuredCompletion with correct params', async () => {
      await refineSection(mockRefinementRequest, 'user_1');

      expect(createStructuredCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You refine sections.',
          messages: [{ role: 'user', content: 'Build a refinement prompt' }],
          schema: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              content: expect.any(Object),
              styles: expect.any(Object),
              changes: expect.any(Object),
            }),
          }),
        })
      );
    });

    it('should fall back to current content when AI returns empty', async () => {
      vi.mocked(createStructuredCompletion).mockResolvedValue({});

      const result = await refineSection(mockRefinementRequest, 'user_1');

      expect(result.content).toEqual(mockRefinementRequest.currentContent);
      expect(result.styles).toEqual(mockRefinementRequest.currentStyles);
      expect(result.changes).toEqual(['Content refined']);
    });

    it('should throw RateLimitError when rate limited', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        retryAfterMs: 30000,
      } as never);

      await expect(
        refineSection(mockRefinementRequest, 'user_1')
      ).rejects.toThrow();
    });

    it('should use AI rate limit config for pro tier', async () => {
      await refineSection(mockRefinementRequest, 'user_1');

      expect(checkRateLimit).toHaveBeenCalledWith(
        'ai:refine:user_1',
        expect.objectContaining({ maxRequests: 60 })
      );
    });
  });

  describe('refineSections', () => {
    it('should refine multiple sections sequentially', async () => {
      const requests = [
        mockRefinementRequest,
        {
          ...mockRefinementRequest,
          sectionId: 'sec_2',
          instruction: 'Make it shorter',
        },
      ];

      const results = await refineSections(requests, 'user_1');

      expect(results).toHaveLength(2);
      expect(results[0].sectionId).toBe('sec_1');
      expect(results[1].sectionId).toBe('sec_2');
      expect(createStructuredCompletion).toHaveBeenCalledTimes(2);
    });

    it('should return original content for failed sections', async () => {
      vi.mocked(createStructuredCompletion)
        .mockResolvedValueOnce({
          content: { headline: 'Refined' },
          changes: ['Updated headline'],
        })
        .mockRejectedValueOnce(new Error('AI service unavailable'));

      const requests = [
        mockRefinementRequest,
        { ...mockRefinementRequest, sectionId: 'sec_2' },
      ];

      const results = await refineSections(requests, 'user_1');

      expect(results).toHaveLength(2);
      expect(results[0].content).toEqual({ headline: 'Refined' });
      expect(results[1].content).toEqual(mockRefinementRequest.currentContent);
      expect(results[1].changes).toEqual(['Refinement failed — original content preserved']);
    });

    it('should return empty array for empty input', async () => {
      const results = await refineSections([], 'user_1');
      expect(results).toEqual([]);
    });
  });

  describe('quickRefineText', () => {
    it('should return refined text from AI', async () => {
      vi.mocked(createStructuredCompletion).mockResolvedValue({
        text: 'Refined professional text',
      });

      const result = await quickRefineText('Original text', 'make it professional');

      expect(result).toBe('Refined professional text');
      expect(createStructuredCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a professional copywriter. Refine text precisely as instructed.',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: expect.stringContaining('Original text') }),
          ]),
        })
      );
    });

    it('should fall back to original text when AI returns empty', async () => {
      vi.mocked(createStructuredCompletion).mockResolvedValue({});

      const result = await quickRefineText('Original text', 'make it shorter');

      expect(result).toBe('Original text');
    });
  });

  describe('detectRefinementType', () => {
    it('should detect rewrite type', () => {
      expect(detectRefinementType('Rewrite this to be more engaging')).toBe('rewrite');
      expect(detectRefinementType('Can you reword this?')).toBe('rewrite');
    });

    it('should detect shorten type', () => {
      expect(detectRefinementType('Make this shorter')).toBe('shorten');
      expect(detectRefinementType('Be more concise')).toBe('shorten');
      expect(detectRefinementType('Keep it brief')).toBe('shorten');
    });

    it('should detect expand type', () => {
      expect(detectRefinementType('Expand on this')).toBe('expand');
      expect(detectRefinementType('Add more detail')).toBe('expand');
      expect(detectRefinementType('Please elaborate')).toBe('expand');
    });

    it('should detect seo type', () => {
      expect(detectRefinementType('Optimize for SEO')).toBe('seo');
      expect(detectRefinementType('Add target keywords')).toBe('seo');
    });

    it('should detect tone type', () => {
      expect(detectRefinementType('Change the tone to formal')).toBe('tone');
      expect(detectRefinementType('Make it more casual')).toBe('tone');
    });

    it('should detect changeCTA type', () => {
      expect(detectRefinementType('Change the CTA to Sign Up Now')).toBe('changeCTA');
      expect(detectRefinementType('Update the button text')).toBe('changeCTA');
      expect(detectRefinementType('New call to action')).toBe('changeCTA');
    });

    it('should detect addSection type', () => {
      expect(detectRefinementType('Add a testimonial section')).toBe('addSection');
      expect(detectRefinementType('Include pricing info')).toBe('addSection');
    });

    it('should detect removeSection type', () => {
      expect(detectRefinementType('Remove the footer section')).toBe('removeSection');
      expect(detectRefinementType('Delete the sidebar')).toBe('removeSection');
    });

    it('should detect localize type', () => {
      expect(detectRefinementType('Localize for Japanese market')).toBe('localize');
      expect(detectRefinementType('Translate to Spanish')).toBe('localize');
    });

    it('should default to rewrite for unrecognized instructions', () => {
      expect(detectRefinementType('Do something with this')).toBe('rewrite');
      expect(detectRefinementType('')).toBe('rewrite');
    });
  });
});
