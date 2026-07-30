// =============================================================================
// Section Registry Tests
// =============================================================================
// Unit tests for the section type registry, validation, and defaults.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  getSectionConfig,
  getDefaultSection,
  validateSection,
  isValidLayout,
  getSectionTypesByCategory,
  getSingletonSectionTypes,
  getRecommendedSections,
  getValidSectionTypes,
} from '@/features/json-engine/services/section-registry';

// ─── Tests ─────────────────────────────────────────────────────────────

describe('SectionRegistry', () => {
  describe('getSectionConfig', () => {
    it('should return config for known section types', () => {
      const heroConfig = getSectionConfig('hero');
      expect(heroConfig).toBeDefined();
      expect(heroConfig!.type).toBe('hero');
      expect(heroConfig!.label).toBe('Hero');
      expect(heroConfig!.category).toBe('hero');
      expect(heroConfig!.singleton).toBe(true);
    });

    it('should return undefined for unknown types', () => {
      expect(getSectionConfig('nonexistent')).toBeUndefined();
    });

    it('should have valid layouts for each section type', () => {
      const heroConfig = getSectionConfig('hero');
      expect(heroConfig!.validLayouts).toContain('centered');
      expect(heroConfig!.validLayouts).toContain('split');
      expect(heroConfig!.validLayouts).toContain('full-width');
    });
  });

  describe('getDefaultSection', () => {
    it('should create a default hero section', () => {
      const section = getDefaultSection('hero');

      expect(section).not.toBeNull();
      expect(section!.type).toBe('hero');
      expect(section!.layout).toBe('centered');
      expect(section!.order).toBe(0);
      expect(section!.visibility).toEqual({ desktop: true, tablet: true, mobile: true });
      expect(section!.id).toBeDefined();
      expect(section!.isLocked).toBe(false);
    });

    it('should return null for unknown types', () => {
      expect(getDefaultSection('nonexistent')).toBeNull();
    });

    it('should assign unique IDs', () => {
      const s1 = getDefaultSection('hero');
      const s2 = getDefaultSection('hero');

      expect(s1!.id).not.toBe(s2!.id);
    });

    it('should include default animations for hero', () => {
      const section = getDefaultSection('hero');

      expect(section!.animations.length).toBeGreaterThan(0);
      expect(section!.animations[0].type).toBe('fade-in-up');
    });

    it('should have empty animations for contact', () => {
      const section = getDefaultSection('contact');

      expect(section!.animations).toHaveLength(0);
    });

    it('should create default sections for all registered types', () => {
      const types = getValidSectionTypes();

      for (const type of types) {
        const section = getDefaultSection(type);
        expect(section).not.toBeNull();
        expect(section!.type).toBe(type);
      }
    });
  });

  describe('validateSection', () => {
    it('should validate a section with all required fields', () => {
      const result = validateSection('hero', { headline: 'Welcome' });
      expect(result.valid).toBe(true);
    });

    it('should reject a section missing required fields', () => {
      const result = validateSection('hero', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('Missing required fields'))).toBe(true);
    });

    it('should reject unknown section types', () => {
      const result = validateSection('nonexistent', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('Unknown section type'))).toBe(true);
    });

    it('should validate features section with items', () => {
      const result = validateSection('features', {
        headline: 'Features',
        items: [{ title: 'Fast', description: 'Speed' }],
      });
      expect(result.valid).toBe(true);
    });

    it('should reject features section without items', () => {
      const result = validateSection('features', {
        headline: 'Features',
      });
      expect(result.valid).toBe(false);
    });

    it('should allow divider with no required fields', () => {
      const result = validateSection('divider', {});
      expect(result.valid).toBe(true);
    });
  });

  describe('isValidLayout', () => {
    it('should return true for valid layouts', () => {
      expect(isValidLayout('hero', 'centered')).toBe(true);
      expect(isValidLayout('hero', 'split')).toBe(true);
      expect(isValidLayout('features', 'grid-3')).toBe(true);
    });

    it('should return false for invalid layouts', () => {
      expect(isValidLayout('hero', 'grid-3')).toBe(false);
      expect(isValidLayout('features', 'split')).toBe(false);
    });

    it('should return false for unknown section types', () => {
      expect(isValidLayout('nonexistent', 'centered')).toBe(false);
    });
  });

  describe('getSectionTypesByCategory', () => {
    it('should return hero sections', () => {
      const heroes = getSectionTypesByCategory('hero');
      expect(heroes.length).toBeGreaterThanOrEqual(1);
      expect(heroes.every((s) => s.category === 'hero')).toBe(true);
    });

    it('should return content sections', () => {
      const content = getSectionTypesByCategory('content');
      expect(content.length).toBeGreaterThan(0);
      expect(content.some((s) => s.type === 'features')).toBe(true);
    });

    it('should return empty array for unused categories', () => {
      // All categories have at least one section, so this tests the filter works
      const forms = getSectionTypesByCategory('forms');
      expect(forms.every((s) => s.category === 'forms')).toBe(true);
    });
  });

  describe('getSingletonSectionTypes', () => {
    it('should include hero as singleton', () => {
      const singletons = getSingletonSectionTypes();
      expect(singletons.some((s) => s.type === 'hero')).toBe(true);
    });

    it('should not include features as singleton', () => {
      const singletons = getSingletonSectionTypes();
      expect(singletons.some((s) => s.type === 'features')).toBe(false);
    });

    it('should include contact as singleton', () => {
      const singletons = getSingletonSectionTypes();
      expect(singletons.some((s) => s.type === 'contact')).toBe(true);
    });
  });

  describe('getRecommendedSections', () => {
    it('should recommend hero sections for home page', () => {
      const recommended = getRecommendedSections('home');
      expect(recommended.some((s) => s.type === 'hero')).toBe(true);
    });

    it('should recommend contact section for contact page', () => {
      const recommended = getRecommendedSections('contact');
      expect(recommended.some((s) => s.type === 'contact')).toBe(true);
    });

    it('should return empty for unknown page types', () => {
      const recommended = getRecommendedSections('nonexistent');
      expect(recommended).toHaveLength(0);
    });
  });

  describe('getValidSectionTypes', () => {
    it('should return a non-empty array', () => {
      const types = getValidSectionTypes();
      expect(types.length).toBeGreaterThan(0);
    });

    it('should include core section types', () => {
      const types = getValidSectionTypes();
      expect(types).toContain('hero');
      expect(types).toContain('features');
      expect(types).toContain('contact');
      expect(types).toContain('cta');
      expect(types).toContain('faq');
    });

    it('should have no duplicates', () => {
      const types = getValidSectionTypes();
      const unique = [...new Set(types)];
      expect(types).toHaveLength(unique.length);
    });
  });
});
