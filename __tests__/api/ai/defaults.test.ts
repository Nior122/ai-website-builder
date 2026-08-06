// =============================================================================
// Default Tests — v2
// =============================================================================
import { describe, it, expect } from 'vitest';
import { getDefaultValue, getDefaultBrand, getDefaultTheme, getDefaultSEO, getDefaultSettings, getDefaultAnimations, getDefaultImages, needsDefault } from '@/lib/ai/defaults';
describe('Defaults', () => {
  it('brand defaults', () => { const b = getDefaultBrand(); expect(b.name).toBe('Untitled Business'); expect((b.colors as Record<string, string>).primary).toBe('#2563EB'); });
  it('immutable across calls', () => { const b1 = getDefaultBrand(); const b2 = getDefaultBrand(); b1.name = 'X'; expect(b2.name).toBe('Untitled Business'); });
  it('theme defaults', () => { expect(getDefaultTheme().preset).toBe('professional'); });
  it('SEO with business name', () => { expect(getDefaultSEO('Acme').metaTitle).toContain('Acme'); });
  it('settings defaults', () => { expect(getDefaultSettings().language).toBe('en'); });
  it('animation defaults', () => { expect(getDefaultAnimations()).toHaveLength(1); });
  it('image defaults', () => { expect(getDefaultImages(3)).toHaveLength(3); });
  it('getDefaultValue paths', () => { expect(getDefaultValue('brand')).toBeDefined(); expect(getDefaultValue('theme')).toBeDefined(); });
  it('getDefaultValue array paths', () => { expect(getDefaultValue('features')).toEqual([]); expect(getDefaultValue('keywords')).toEqual([]); });
  it('needsDefault', () => { expect(needsDefault(null)).toBe(true); expect(needsDefault(undefined)).toBe(true); expect(needsDefault([])).toBe(true); expect(needsDefault('')).toBe(false); });
});
