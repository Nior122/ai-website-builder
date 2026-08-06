// =============================================================================
// Design Tokens Tests
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  createDesignTokens,
  getDefaultDesignTokens,
  contrastRatio,
  passesAAContrast,
  luminance,
  deriveShades,
  buildSpacingScale,
  buildFontSizeScale,
  hexToRgb,
  rgbToHex,
  mixHex,
  shade,
} from '@/lib/ai/design-pipeline/design-tokens';

describe('Color Math', () => {
  it('parses and serializes hex colors', () => {
    expect(rgbToHex(hexToRgb('#ff8800'))).toBe('#ff8800');
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(() => hexToRgb('not-a-color')).toThrow();
  });

  it('computes WCAG luminance', () => {
    expect(luminance('#000000')).toBeCloseTo(0, 4);
    expect(luminance('#ffffff')).toBeCloseTo(1, 4);
  });

  it('computes contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 4);
  });

  it('validates WCAG AA thresholds', () => {
    expect(passesAAContrast('#0f172a', '#ffffff')).toBe(true);
    expect(passesAAContrast('#94a3b8', '#ffffff')).toBe(false);
  });

  it('mixes and shades colors', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(shade('#2563eb', 1)).toBe('#ffffff');
    expect(shade('#2563eb', -1)).toBe('#000000');
  });
});

describe('Design Tokens', () => {
  it('builds the complete token set', () => {
    const tokens = getDefaultDesignTokens();
    expect(tokens.colors.primary).toBe('#2563eb');
    expect(tokens.colors.background).toBe('#ffffff');
    expect(tokens.colors.text).toBe('#0f172a');
    expect(Object.keys(tokens.primaryShades)).toHaveLength(11);
    expect(tokens.spacing['1']).toBe(4);
    expect(tokens.spacing['4']).toBe(16);
    expect(tokens.radius.md).toBe('12px');
    expect(tokens.motion.base).toBe(250);
  });

  it('derives 10-step shade ramps', () => {
    const shades = deriveShades('#4f46e5');
    expect(Object.keys(shades)).toEqual(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']);
    expect(shades['50']).not.toBe(shades['900']);
  });

  it('builds a 4px-base spacing scale', () => {
    const scale = buildSpacingScale();
    expect(scale['0']).toBe(0);
    expect(scale['1']).toBe(4);
    expect(scale['4']).toBe(16);
    expect(scale['16']).toBe(64);
  });

  it('builds a font size scale', () => {
    const scale = buildFontSizeScale();
    expect(scale.base).toBe('1rem');
    expect(scale['6xl']).toBe('3.75rem');
  });

  it('generates dark-mode surfaces', () => {
    const tokens = createDesignTokens('#2563eb', 'dark');
    expect(tokens.colors.background).toBe('#020617');
    expect(tokens.colors.text).toBe('#e2e8f0');
  });

  it('produces light text on dark primary colors (AA-safe CTA)', () => {
    const tokens = createDesignTokens('#1d4ed8', 'light');
    expect(passesAAContrast(tokens.colors.text, tokens.colors.background)).toBe(true);
  });
});
