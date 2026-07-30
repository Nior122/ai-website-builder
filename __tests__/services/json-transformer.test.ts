// =============================================================================
// JSON Transformer Tests
// =============================================================================
// Unit tests for AI output normalization pipeline.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  transformAIOutput,
  buildImageConfigs,
} from '@/features/json-engine/services/json-transformer';

// ─── Tests ─────────────────────────────────────────────────────────────

describe('JSONTransformer', () => {
  describe('transformAIOutput', () => {
    const validRawOutput = {
      brand: {
        name: 'Acme Corp',
        tagline: 'Innovation at its best',
        description: 'We build great things',
        tone: 'professional',
      },
      pages: [
        {
          slug: 'home',
          title: 'Home',
          metaTitle: 'Acme Corp — Home',
          metaDescription: 'Welcome to Acme',
          isHome: true,
          sections: [
            {
              type: 'hero',
              layout: 'centered',
              content: { headline: 'Welcome to Acme', body: 'Building the future' },
              order: 0,
            },
            {
              type: 'features',
              layout: 'grid-3',
              content: {
                headline: 'Our Features',
                items: [
                  { title: 'Fast', description: 'Lightning fast' },
                  { title: 'Reliable', description: 'Always up' },
                ],
              },
              order: 1,
            },
          ],
        },
      ],
      theme: {
        preset: 'modern',
        mode: 'light',
        colors: { primary: '#3b82f6' },
      },
    };

    it('should transform valid AI output successfully', () => {
      const result = transformAIOutput(validRawOutput);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    it('should normalize brand fields', () => {
      const result = transformAIOutput(validRawOutput);

      expect(result.data!.brand.name).toBe('Acme Corp');
      expect(result.data!.brand.tagline).toBe('Innovation at its best');
      expect(result.data!.brand.description).toBe('We build great things');
      expect(result.data!.brand.tone).toBe('professional');
    });

    it('should generate unique IDs for pages and sections', () => {
      const result = transformAIOutput(validRawOutput);

      expect(result.data!.pages[0].id).toBeDefined();
      expect(typeof result.data!.pages[0].id).toBe('string');
      expect(result.data!.pages[0].sections[0].id).toBeDefined();
      expect(result.data!.pages[0].sections[0].id).not.toBe(
        result.data!.pages[0].sections[1].id
      );
    });

    it('should set correct section types and layouts', () => {
      const result = transformAIOutput(validRawOutput);

      expect(result.data!.pages[0].sections[0].type).toBe('hero');
      expect(result.data!.pages[0].sections[0].layout).toBe('centered');
      expect(result.data!.pages[0].sections[1].type).toBe('features');
      expect(result.data!.pages[0].sections[1].layout).toBe('grid-3');
    });

    it('should normalize section visibility with defaults', () => {
      const result = transformAIOutput(validRawOutput);

      expect(result.data!.pages[0].sections[0].visibility).toEqual({
        desktop: true,
        tablet: true,
        mobile: true,
      });
    });

    it('should fall back to default values for missing optional fields', () => {
      const minimalRaw = {
        brand: { name: 'Minimal Corp' },
        pages: [
          {
            sections: [
              {
                type: 'hero',
                content: { headline: 'Hello' },
              },
            ],
          },
        ],
        theme: {},
      };

      const result = transformAIOutput(minimalRaw);

      expect(result.success).toBe(true);
      expect(result.data!.brand.tagline).toBe('');
      expect(result.data!.brand.tone).toBe('professional');
      expect(result.data!.pages[0].slug).toMatch(/^page-/);
      expect(result.data!.pages[0].title).toBe('Untitled Page');
      expect(result.data!.pages[0].sections[0].layout).toBe('centered');
    });

    it('should return errors for invalid top-level structure', () => {
      const result = transformAIOutput({});

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('validation');
    });

    it('should return errors for missing brand name', () => {
      const result = transformAIOutput({
        pages: [{ sections: [{ type: 'hero', content: { headline: 'Hi' } }] }],
        theme: {},
      });

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.field?.includes('brand') || e.field?.includes('name'))).toBe(true);
    });

    it('should fix invalid layouts by falling back to default', () => {
      const raw = {
        ...validRawOutput,
        pages: [
          {
            ...validRawOutput.pages[0],
            sections: [
              {
                type: 'hero',
                layout: 'invalid-layout',
                content: { headline: 'Hello' },
              },
            ],
          },
        ],
      };

      const result = transformAIOutput(raw);

      expect(result.data!.pages[0].sections[0].layout).toBe('centered');
    });

    it('should normalize animations with defaults', () => {
      const raw = {
        ...validRawOutput,
        pages: [
          {
            ...validRawOutput.pages[0],
            sections: [
              {
                type: 'hero',
                content: { headline: 'Hello' },
                animations: [{ type: 'fade-in-up', duration: 800, delay: 0 }],
              },
            ],
          },
        ],
      };

      const result = transformAIOutput(raw);

      expect(result.data!.pages[0].sections[0].animations).toHaveLength(1);
      expect(result.data!.pages[0].sections[0].animations[0].duration).toBe(800);
    });

    it('should normalize images with IDs', () => {
      const raw = {
        ...validRawOutput,
        pages: [
          {
            ...validRawOutput.pages[0],
            sections: [
              {
                type: 'hero',
                content: { headline: 'Hello' },
                images: [{ src: 'https://example.com/img.jpg', alt: 'Hero image' }],
              },
            ],
          },
        ],
      };

      const result = transformAIOutput(raw);

      expect(result.data!.pages[0].sections[0].images).toHaveLength(1);
      expect(result.data!.pages[0].sections[0].images[0].id).toBeDefined();
      expect(result.data!.pages[0].sections[0].images[0].src).toBe('https://example.com/img.jpg');
    });

    it('should normalize theme with defaults', () => {
      const result = transformAIOutput(validRawOutput);

      expect(result.data!.theme.preset).toBe('modern');
      expect(result.data!.theme.mode).toBe('light');
      expect(result.data!.theme.spacing).toBeDefined();
      expect(result.data!.theme.animations).toBeDefined();
    });

    it('should preserve SEO data when present', () => {
      const raw = {
        ...validRawOutput,
        seo: { title: 'Acme Corp', description: 'Best company ever' },
      };

      const result = transformAIOutput(raw);

      expect(result.data!.seo).toEqual({ title: 'Acme Corp', description: 'Best company ever' });
    });

    it('should handle multiple pages', () => {
      const raw = {
        ...validRawOutput,
        pages: [
          ...validRawOutput.pages,
          {
            slug: 'about',
            title: 'About',
            isHome: false,
            sections: [
              {
                type: 'about',
                content: { headline: 'About Us', body: 'We are great' },
              },
            ],
          },
        ],
      };

      const result = transformAIOutput(raw);

      expect(result.data!.pages).toHaveLength(2);
      expect(result.data!.pages[0].isHome).toBe(true);
      expect(result.data!.pages[1].isHome).toBe(false);
      expect(result.data!.pages[1].slug).toBe('about');
    });
  });

  describe('buildImageConfigs', () => {
    it('should build configs from queries', () => {
      const queries = [
        { query: 'modern office', alt: 'Office photo', position: 0 },
        { query: 'team working', alt: 'Team photo', position: 1 },
      ];

      const configs = buildImageConfigs(queries);

      expect(configs).toHaveLength(2);
      expect(configs[0].alt).toBe('Office photo');
      expect(configs[0].placeholder).toBe('modern office');
      expect(configs[0].src).toBe('');
      expect(configs[0].loading).toBe('lazy');
    });

    it('should generate unique IDs for each config', () => {
      const queries = [
        { query: 'image 1', alt: 'First' },
        { query: 'image 2', alt: 'Second' },
      ];

      const configs = buildImageConfigs(queries);

      expect(configs[0].id).not.toBe(configs[1].id);
    });

    it('should handle empty queries', () => {
      const configs = buildImageConfigs([]);
      expect(configs).toEqual([]);
    });
  });
});
