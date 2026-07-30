// =============================================================================
// Image Service Tests
// =============================================================================
// Tests for image generation, prompt enhancement, and size mapping.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Shared mock for OpenAI generate ────────────────────────────────────

const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: { generate: mockGenerate },
  })),
}));

vi.mock('@/lib/env', () => ({
  getServerEnv: () => ({
    OPENAI_API_KEY: 'test-key',
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  generateImage,
  generateBatchImages,
  enhanceImagePrompt,
  getImageSizeForSection,
  isImageGenerationAvailable,
} from '@/features/ai-engine/services/image.service';

// ─── Tests ─────────────────────────────────────────────────────────────

describe('ImageService', () => {
  beforeEach(() => {
    mockGenerate.mockReset();
  });

  describe('enhanceImagePrompt', () => {
    it('should enhance a simple query with context', () => {
      const result = enhanceImagePrompt('modern office workspace', {
        businessType: 'startup',
        industry: 'technology',
        style: 'professional',
      });

      expect(result).toContain('modern office workspace');
      expect(result).toContain('technology');
      expect(result).toContain('startup');
      expect(result).toContain('professional');
      expect(result).toContain('No text');
    });

    it('should produce a complete prompt', () => {
      const result = enhanceImagePrompt('coffee shop interior', {
        businessType: 'restaurant',
        industry: 'food and beverage',
        style: 'warm',
      });

      const sentences = result.split('.').filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getImageSizeForSection', () => {
    it('should return 1792x1024 for hero sections', () => {
      expect(getImageSizeForSection('hero')).toBe('1792x1024');
    });

    it('should return 1024x1024 for gallery sections', () => {
      expect(getImageSizeForSection('gallery')).toBe('1024x1024');
    });

    it('should return 1024x1024 for team sections', () => {
      expect(getImageSizeForSection('team')).toBe('1024x1024');
    });

    it('should return 1792x1024 for cta sections', () => {
      expect(getImageSizeForSection('cta')).toBe('1792x1024');
    });

    it('should default to 1792x1024 for unknown sections', () => {
      expect(getImageSizeForSection('unknown')).toBe('1792x1024');
    });

    it('should return correct size for heroWithProduct', () => {
      expect(getImageSizeForSection('heroWithProduct')).toBe('1792x1024');
    });

    it('should return correct size for testimonial', () => {
      expect(getImageSizeForSection('testimonial')).toBe('1024x1024');
    });
  });

  describe('isImageGenerationAvailable', () => {
    it('should return true when API key is set', () => {
      expect(isImageGenerationAvailable()).toBe(true);
    });
  });

  describe('generateImage', () => {
    it('should generate an image successfully', async () => {
      mockGenerate.mockResolvedValue({
        data: [{ url: 'https://example.com/img.png', revised_prompt: 'A detailed prompt' }],
      });

      const result = await generateImage({
        prompt: 'A modern office with natural light and plants',
        alt: 'Office photo',
        size: '1792x1024',
        style: 'natural',
        quality: 'standard',
      });

      expect(result.url).toBe('https://example.com/img.png');
      expect(result.revisedPrompt).toBe('A detailed prompt');
      expect(result.alt).toBe('Office photo');
    });

    it('should fall back to original prompt when no revised_prompt', async () => {
      mockGenerate.mockResolvedValue({
        data: [{ url: 'https://example.com/img2.png', revised_prompt: null }],
      });

      const prompt = 'A beautiful landscape for the hero section of a website';
      const result = await generateImage({
        prompt,
        alt: 'Landscape',
        size: '1024x1024',
        style: 'vivid',
        quality: 'hd',
      });

      expect(result.revisedPrompt).toBe(prompt);
    });

    it('should reject short prompts via Zod validation', async () => {
      await expect(
        generateImage({
          prompt: 'short',
          alt: 'test',
          size: '1024x1024',
          style: 'natural',
          quality: 'standard',
        })
      ).rejects.toThrow();
    });
  });

  describe('generateBatchImages', () => {
    it('should generate multiple images sequentially', async () => {
      vi.useFakeTimers();
      mockGenerate.mockResolvedValue({
        data: [{ url: 'https://example.com/batch.png', revised_prompt: 'enhanced' }],
      });

      const batchPromise = generateBatchImages({
        images: [
          { query: 'office workspace photo for a technology startup hero section', alt: 'Office', sectionType: 'hero' },
          { query: 'team of professionals collaborating in a modern meeting room', alt: 'Team', sectionType: 'team' },
        ],
        style: 'natural',
        quality: 'standard',
      });

      await vi.advanceTimersByTimeAsync(15000);
      const result = await batchPromise;

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://example.com/batch.png');
      expect(mockGenerate).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('should handle failures gracefully', async () => {
      mockGenerate
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockResolvedValueOnce({
          data: [{ url: 'https://example.com/ok.png', revised_prompt: 'ok' }],
        });

      const result = await generateBatchImages({
        images: [
          { query: 'first image that will fail with a long enough description', alt: 'Fail', sectionType: 'hero' },
          { query: 'second image that will succeed with a long enough description', alt: 'OK', sectionType: 'gallery' },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('');  // failed → empty URL
      expect(result[1].url).toBe('https://example.com/ok.png');
    });

    it('should use correct sizes per section type', async () => {
      vi.useFakeTimers();
      mockGenerate.mockResolvedValue({
        data: [{ url: 'https://example.com/img.png', revised_prompt: 'r' }],
      });

      const batchPromise = generateBatchImages({
        images: [
          { query: 'hero image description that is long enough to pass validation', alt: 'Hero', sectionType: 'hero' },
          { query: 'gallery image description that is long enough to pass validation', alt: 'Gallery', sectionType: 'gallery' },
        ],
      });

      await vi.advanceTimersByTimeAsync(15000);
      await batchPromise;

      expect(mockGenerate).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ size: '1792x1024' })
      );
      expect(mockGenerate).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ size: '1024x1024' })
      );
      vi.useRealTimers();
    });
  });
});
