// =============================================================================
// Project Defaults Tests
// =============================================================================
// Unit tests for default theme generation, SEO config, project settings,
// and brand config builder.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  getDefaultTheme,
  getDefaultSEO,
  getDefaultProjectSettings,
  buildBrandConfig,
} from '@/features/json-engine/services/project-defaults';

// ─── Tests ─────────────────────────────────────────────────────────────

describe('ProjectDefaults', () => {
  describe('getDefaultTheme', () => {
    it('should return a complete theme with modern preset by default', () => {
      const theme = getDefaultTheme();

      expect(theme.preset).toBe('modern');
      expect(theme.mode).toBe('light');
      expect(theme.colors).toBeDefined();
      expect(theme.typography).toBeDefined();
      expect(theme.spacing).toBeDefined();
      expect(theme.borderRadius).toBeDefined();
      expect(theme.shadows).toBeDefined();
      expect(theme.animations).toBeDefined();
    });

    it('should use provided brand colors', () => {
      const colors = { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF' };
      const theme = getDefaultTheme('modern', colors);

      expect(theme.colors.primary['500']).toBe('#FF0000');
      expect(theme.colors.secondary['500']).toBe('#00FF00');
      expect(theme.colors.accent['500']).toBe('#0000FF');
    });

    it('should use default colors when none provided', () => {
      const theme = getDefaultTheme();

      expect(theme.colors.primary['500']).toBe('#6366F1');
      expect(theme.colors.secondary['500']).toBe('#8B5CF6');
      expect(theme.colors.accent['500']).toBe('#EC4899');
    });

    it('should support minimal preset', () => {
      const theme = getDefaultTheme('minimal');

      expect(theme.preset).toBe('minimal');
      expect(theme.borderRadius.sm).toBe('0.125rem');
    });

    it('should support luxury preset', () => {
      const theme = getDefaultTheme('luxury');

      expect(theme.preset).toBe('luxury');
      expect(theme.borderRadius.sm).toBe('0.25rem');
    });

    it('should support corporate preset', () => {
      const theme = getDefaultTheme('corporate');

      expect(theme.preset).toBe('corporate');
    });

    it('should support creative preset', () => {
      const theme = getDefaultTheme('creative');

      expect(theme.preset).toBe('creative');
      expect(theme.borderRadius.sm).toBe('0.5rem');
    });

    it('should fall back to modern for unknown presets', () => {
      const theme = getDefaultTheme('unknown-preset');

      expect(theme.preset).toBe('modern');
    });

    it('should include typography configuration', () => {
      const theme = getDefaultTheme();

      expect(theme.typography.fontFamily.heading).toContain('Inter');
      expect(theme.typography.fontFamily.body).toContain('Inter');
      expect(theme.typography.scale).toBe(1.25);
      expect(theme.typography.lineHeight.normal).toBe(1.5);
    });

    it('should include spacing scale', () => {
      const theme = getDefaultTheme();

      expect(theme.spacing.unit).toBe(8);
      expect(theme.spacing.scale).toContain(0);
      expect(theme.spacing.scale).toContain(64);
    });

    it('should include animation config', () => {
      const theme = getDefaultTheme();

      expect(theme.animations.enabled).toBe(true);
      expect(theme.animations.reduceMotion).toBe(false);
      expect(theme.animations.duration.normal).toBe(300);
    });

    it('should include gradient definitions', () => {
      const theme = getDefaultTheme();

      expect(theme.colors.gradient.primary).toContain('linear-gradient');
      expect(theme.colors.gradient.mesh).toContain('radial-gradient');
    });

    it('should include color shades from 50 to 950', () => {
      const theme = getDefaultTheme();

      expect(theme.colors.primary['50']).toBeDefined();
      expect(theme.colors.primary['100']).toBeDefined();
      expect(theme.colors.primary['500']).toBeDefined();
      expect(theme.colors.primary['900']).toBeDefined();
      expect(theme.colors.primary['950']).toBeDefined();
    });
  });

  describe('getDefaultSEO', () => {
    it('should generate SEO config from page data', () => {
      const seo = getDefaultSEO({
        title: 'Home',
        slug: 'home',
      });

      expect(seo.metaTitle).toBe('Home');
      expect(seo.metaDescription).toContain('home');
      expect(seo.ogType).toBe('website');
      expect(seo.twitterCard).toBe('summary_large_image');
      expect(seo.noIndex).toBe(false);
    });

    it('should append brand name to meta title when provided', () => {
      const seo = getDefaultSEO({
        title: 'About',
        slug: 'about',
        brandName: 'Acme Corp',
      });

      expect(seo.metaTitle).toBe('About | Acme Corp');
    });

    it('should use provided meta title over generated', () => {
      const seo = getDefaultSEO({
        title: 'Home',
        slug: 'home',
        metaTitle: 'Custom Title',
      });

      expect(seo.metaTitle).toBe('Custom Title');
    });

    it('should use provided meta description over generated', () => {
      const seo = getDefaultSEO({
        title: 'Home',
        slug: 'home',
        metaDescription: 'Custom description',
      });

      expect(seo.metaDescription).toBe('Custom description');
    });

    it('should include default robotsTxt', () => {
      const seo = getDefaultSEO({ title: 'Home', slug: 'home' });

      expect(seo.robotsTxt).toContain('User-agent');
      expect(seo.robotsTxt).toContain('Allow: /');
    });
  });

  describe('getDefaultProjectSettings', () => {
    it('should return sensible defaults', () => {
      const settings = getDefaultProjectSettings();

      expect(settings.language).toBe('en');
      expect(settings.direction).toBe('ltr');
      expect(settings.favicon).toBeNull();
      expect(settings.customCss).toBe('');
      expect(settings.customJs).toBe('');
      expect(settings.googleAnalyticsId).toBeNull();
      expect(settings.facebookPixelId).toBeNull();
    });
  });

  describe('buildBrandConfig', () => {
    it('should convert AI brand output to BrandConfig', () => {
      const config = buildBrandConfig({
        name: 'Acme Corp',
        tagline: 'Innovation at its best',
        description: 'We build great things',
        tone: 'professional',
      });

      expect(config.name).toBe('Acme Corp');
      expect(config.tagline).toBe('Innovation at its best');
      expect(config.description).toBe('We build great things');
      expect(config.tone).toBe('professional');
    });

    it('should pass through colors when provided', () => {
      const config = buildBrandConfig({
        name: 'Test',
        tagline: 'Test',
        tone: 'modern',
        colors: { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF' },
      });

      expect(config.colors).toBeDefined();
      expect(config.colors!.primary).toBe('#FF0000');
    });

    it('should pass through typography when provided', () => {
      const config = buildBrandConfig({
        name: 'Test',
        tagline: 'Test',
        tone: 'modern',
        typography: { heading: 'Playfair Display', body: 'Lato' },
      });

      expect(config.typography).toBeDefined();
      expect(config.typography!.heading).toBe('Playfair Display');
    });

    it('should handle minimal input', () => {
      const config = buildBrandConfig({
        name: 'Minimal',
        tagline: '',
        tone: 'casual',
      });

      expect(config.name).toBe('Minimal');
      expect(config.description).toBeUndefined();
      expect(config.colors).toBeUndefined();
    });
  });
});
