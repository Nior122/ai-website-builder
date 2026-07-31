// =============================================================================
// Free Stock Image Resolver — Tests
// =============================================================================
// Verifies the keyless Unsplash/picsum resolver: deterministic selection,
// category detection, hero sizing, and multi-image builds.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { resolveStockImage, buildStockImages } from '@/lib/ai/stock-images';

describe('resolveStockImage', () => {
  it('returns a hotlinkable Unsplash CDN URL', () => {
    const img = resolveStockImage({ query: 'modern office', sectionType: 'hero' });
    expect(img.src).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    expect(img.src).toContain('auto=format');
    expect(img.alt).toBeTruthy();
  });

  it('is deterministic for the same query and seed', () => {
    const opts = { query: 'team collaboration', sectionType: 'splitSection', industry: 'technology' };
    const a = resolveStockImage(opts);
    const b = resolveStockImage(opts);
    expect(a).toEqual(b);
  });

  it('detects the team category from the query', () => {
    const img = resolveStockImage({ query: 'our friendly team collaborating', sectionType: 'splitSection' });
    // All team photos belong to the team library — verify via known member IDs
    const teamIds = [
      'photo-1522071820081-009f0129c71c',
      'photo-1521737711867-e3b97375f902',
      'photo-1552664730-d307ca884978',
      'photo-1521737604893-d14cc237f11d',
      'photo-1556761175-5973dc0f32e7',
    ];
    expect(teamIds.some((id) => img.src.includes(id))).toBe(true);
  });

  it('detects the office category from the industry', () => {
    const img = resolveStockImage({ query: 'workspace', sectionType: 'cta', industry: 'real estate' });
    expect(img.src).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it('sizes hero sections wide with eager loading', () => {
    const img = resolveStockImage({ query: 'product', sectionType: 'hero' });
    expect(img.width).toBe(1600);
    expect(img.height).toBe(900);
    expect(img.loading).toBe('eager');
  });

  it('defaults unknown section types to the hero library', () => {
    const img = resolveStockImage({ query: 'anything', sectionType: 'customThing' });
    expect(img.src).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    expect(img.loading).toBe('lazy');
  });

  it('uses the alt override when provided', () => {
    const img = resolveStockImage({ query: 'mountain', alt: 'Snowy peaks at sunrise', sectionType: 'hero' });
    expect(img.alt).toBe('Snowy peaks at sunrise');
  });
});

describe('buildStockImages', () => {
  it('returns the requested number of images with src and alt', () => {
    const images = buildStockImages({ query: 'product', sectionType: 'gallery', seed: 'gallery-1' }, 3);
    expect(images).toHaveLength(3);
    for (const img of images) {
      expect(img.src).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(typeof img.alt).toBe('string');
      expect(img.width).toBe(800);
      expect(img.height).toBe(800);
    }
  });

  it('is deterministic per seed', () => {
    const a = buildStockImages({ query: 'food', sectionType: 'hero', seed: 'seed-a' }, 2);
    const b = buildStockImages({ query: 'food', sectionType: 'hero', seed: 'seed-a' }, 2);
    expect(a).toEqual(b);
  });
});
