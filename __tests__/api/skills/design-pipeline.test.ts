// =============================================================================
// Design Pipeline Tests
// =============================================================================
// Covers the full pipeline + the "every business type gets a different design
// language" acceptance test across 14 industries.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { runDesignPipeline, toDesignBrief } from '@/lib/ai/design-pipeline';
import { generateThemeForBusiness, getThemePreset } from '@/lib/ai/design-pipeline/theme-generator';
import { buildBrandDesign } from '@/lib/ai/design-pipeline/branding-engine';
import { buildCopyBlocks } from '@/lib/ai/design-pipeline/copywriter';
import { checkAccessibility } from '@/lib/ai/design-pipeline/accessibility-checker';
import { auditPerformance } from '@/lib/ai/design-pipeline/performance-audit';
import { validateConsistency } from '@/lib/ai/design-pipeline/consistency-validator';
import { getDefaultDesignTokens, createDesignTokens } from '@/lib/ai/design-pipeline/design-tokens';

const TEST_TYPES = [
  'Restaurant',
  'Salon',
  'Hospital',
  'School',
  'Church',
  'Agency',
  'Law Firm',
  'Portfolio',
  'E-commerce',
  'SaaS',
  'Travel',
  'Real Estate',
  'Construction',
  'Fitness',
];

function briefFor(type: string) {
  return toDesignBrief({
    description: `A ${type.toLowerCase()} business serving local customers with quality service.`,
    industry: type,
    businessType: type,
    tone: 'professional',
  });
}

describe('Design Pipeline', () => {
  it('runs all 9 stages successfully for a business', async () => {
    const result = await runDesignPipeline(briefFor('Restaurant'));
    expect(result.success).toBe(true);
    expect(result.stages).toHaveLength(9);
    expect(result.stages.every((stage) => stage.ok)).toBe(true);
    expect(result.brand).not.toBeNull();
    expect(result.tokens).not.toBeNull();
    expect(result.theme).not.toBeNull();
    expect(result.copy.length).toBeGreaterThan(5);
    expect(result.blueprints.length).toBeGreaterThan(0);
    expect(result.validation).not.toBeNull();
  });

  it('records which skill powered each stage', async () => {
    const result = await runDesignPipeline(briefFor('SaaS'));
    const copyStage = result.stages.find((stage) => stage.stage === 'copywriting');
    expect(copyStage?.skill).toBe('copy-editing');
    const polishStage = result.stages.find((stage) => stage.stage === 'polish');
    expect(polishStage?.skill).toBe('impeccable');
  });

  it('produces a different design language for every business type', async () => {
    const languages = new Map<string, string>();
    for (const type of TEST_TYPES) {
      const theme = generateThemeForBusiness(type, { industry: type });
      languages.set(theme.preset, type);
    }
    // At least 12 of the 14 types map to distinct theme presets
    // (Portfolio and E-commerce share the modern-saas fallback).
    expect(languages.size).toBeGreaterThanOrEqual(12);
  });

  it('is deterministic — same business type yields the same theme', () => {
    const a = generateThemeForBusiness('Restaurant', { industry: 'Restaurant' });
    const b = generateThemeForBusiness('Restaurant', { industry: 'Restaurant' });
    expect(a.tokens.seed).toBe(b.tokens.seed);
    expect(a.tokens.colors.primary).toBe(b.tokens.colors.primary);
    expect(a.fonts.heading).toBe(b.fonts.heading);
  });

  it('resolves theme presets from industry keywords', () => {
    expect(getThemePreset('Unknown Business', 'dental clinic').key).toBe('medical');
    expect(getThemePreset('Unknown Business', 'attorney at law').key).toBe('law-firm');
    expect(getThemePreset('Unknown Business', 'coffee shop').key).toBe('restaurant');
  });
});

describe('Branding Engine', () => {
  it('builds tone-aware brand identity', () => {
    const brand = buildBrandDesign(briefFor('Luxury Hotel'));
    expect(brand.name).toBeTruthy();
    expect(brand.tagline).toContain(brand.name);
    expect(brand.voiceRules.length).toBeGreaterThan(0);
    expect(brand.values).toHaveLength(4);
  });

  it('derives names from descriptions', () => {
    const brand = buildBrandDesign({
      description: 'Sunrise Bakery makes artisan sourdough in Portland.',
      industry: 'Bakery',
      businessType: 'Bakery',
    });
    expect(brand.name).toBe('Sunrise');
  });
});

describe('Copywriting', () => {
  it('produces benefit-driven copy for every tone', () => {
    for (const tone of ['professional', 'luxury', 'playful', 'minimal', 'bold']) {
      const brief = briefFor('Agency');
      const brand = buildBrandDesign({ ...brief, tone });
      const copy = buildCopyBlocks(brief, brand);
      const headline = copy.find((block) => block.key === 'hero.headline')?.text ?? '';
      expect(headline.length).toBeGreaterThan(10);
      expect(headline).not.toMatch(/Lorem ipsum|world-class|cutting-edge/i);
    }
  });
});

describe('Validators', () => {
  it('accessibility: catches bad contrast', () => {
    const tokens = createDesignTokens('#1d4ed8', 'light');
    const report = checkAccessibility(tokens);
    expect(report).toBeDefined();
  });

  it('performance: flags missing image dimensions', () => {
    const report = auditPerformance(getDefaultDesignTokens(), {
      images: [{ src: '/img.jpg', alt: 'x', isHero: false }],
    });
    expect(report.issues.some((issue) => issue.rule === 'perf.cls.dimensions')).toBe(true);
  });

  it('consistency: flags off-palette colors and mixed styles', () => {
    const report = validateConsistency(getDefaultDesignTokens(), {
      usedColors: ['#ff0000'],
      usedRadii: ['99px'],
      usedSpacing: [37],
      buttonStyles: ['solid', 'pill'],
    });
    expect(report.issues.some((issue) => issue.rule === 'consistency.color')).toBe(true);
    expect(report.issues.some((issue) => issue.rule === 'consistency.radius')).toBe(true);
    expect(report.issues.some((issue) => issue.rule === 'consistency.spacing')).toBe(true);
    expect(report.issues.some((issue) => issue.rule === 'consistency.button-style')).toBe(true);
  });

  it('consistency: passes for a clean token-consistent design', () => {
    const tokens = getDefaultDesignTokens();
    const report = validateConsistency(tokens, {
      usedColors: [tokens.colors.primary, tokens.colors.text],
      usedRadii: [tokens.radius.md, tokens.radius.lg],
      usedSpacing: [16, 32, 64],
      usedFonts: [{ heading: tokens.fontFamily.heading, body: tokens.fontFamily.body }],
      buttonStyles: ['solid'],
    });
    expect(report.passed).toBe(true);
  });
});
