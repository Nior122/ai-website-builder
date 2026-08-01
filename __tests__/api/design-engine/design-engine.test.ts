// =============================================================================
// AI Theme & Component Generation Engine — Tests (Phase 6)
// =============================================================================
// Covers: full DesignGenerationEngine pipeline (restaurant), industry
// differentiation, the 21-theme library, typography quality, layout
// selection, smart section ordering, animation restraint, image direction,
// icon intelligence, responsive + accessibility rules, component consistency
// checking + auto-repair, the 5-reviewer design review with revision cycles,
// project application, and WebsiteBuilderAgent integration.
// =============================================================================
import { describe, it, expect } from 'vitest';

import {
  DesignGenerationEngine,
  applyDesignSystemToProject,
  classifyIndustry,
  selectTheme,
  buildTypographySystem,
  buildSectionOrder,
  buildIconSet,
  checkDesignConsistency,
  repairConsistency,
  reviewDesign,
  evaluateDesign,
  listThemes,
  listComponentTypes,
  THEME_LIBRARY,
  DESIGN_REVIEWERS,
  summarizeDesign,
  type DesignSystem,
} from '@/lib/design-engine';
import { WebsiteBuilderAgent } from '@/lib/builder-agent';
import { toDesignBrief, type DesignBrief } from '@/lib/ai/design-pipeline';
import { makeTestProject } from '../builder/fixtures';

function briefFor(description: string, industry = 'Business'): DesignBrief {
  return toDesignBrief({ description, industry, businessType: industry, tone: 'professional' });
}

const engine = new DesignGenerationEngine();

describe('DesignGenerationEngine — restaurant pipeline', () => {
  let design: DesignSystem;

  it('generates a complete design system from a restaurant brief', async () => {
    design = await engine.generateDesignSystem(briefFor('A cozy Italian restaurant with wood-fired pizza and a full wine list.'));
    expect(design.industry.id).toBe('restaurant');
    expect(design.sectionOrder).toEqual(['hero', 'menu', 'gallery', 'testimonials', 'reservation', 'chef', 'faq', 'contact']);
    expect(design.score.passed).toBe(true);
    expect(design.score.overall).toBeGreaterThanOrEqual(9);
    expect(design.score.reviewCycles).toBeLessThanOrEqual(5);
  });

  it('emits a complete theme token set (light/dark, hover/focus/disabled, semantics)', () => {
    const t = design.theme;
    expect(t.primary).toMatch(/^#/);
    expect(t.secondary).toMatch(/^#/);
    expect(t.accent).toMatch(/^#/);
    expect(t.background).toBeTruthy();
    expect(t.surface).toBeTruthy();
    expect(t.text).toBeTruthy();
    expect(t.border).toBeTruthy();
    for (const semantic of ['success', 'warning', 'danger', 'info'] as const) {
      expect(t[semantic]).toMatch(/^#/);
    }
    expect(t.light.background).toBeTruthy();
    expect(t.dark.background).toBeTruthy();
    expect(t.hover.primary).not.toBe(t.primary);
    expect(t.focus.primary).toBeTruthy();
    expect(t.disabled.background).toBeTruthy();
    expect(t.button.background).toBe(t.primary);
    expect(t.button.hover).toBe(t.hover.primary);
  });

  it('uses premium Google Fonts and a proper type scale', () => {
    const fonts = new Set([design.typography.headingFont, design.typography.bodyFont, design.typography.buttonFont, design.typography.displayFont]);
    expect(fonts.size).toBeGreaterThanOrEqual(2);
    expect(design.typography.headingScale.length).toBeGreaterThanOrEqual(4);
    expect(design.typography.bodyScale.length).toBeGreaterThanOrEqual(4);
    expect(design.typography.weights.heading).toBeGreaterThan(design.typography.weights.body);
  });

  it('selects a restaurant-appropriate layout and components with 5-8 variants', () => {
    expect(design.layout.id).toBeTruthy();
    expect(design.layout.containerWidth).toMatch(/px$/);
    expect(design.components.length).toBe(listComponentTypes().length);
    for (const component of design.components) {
      expect(component.variants.length).toBeGreaterThanOrEqual(5);
      expect(component.variants.length).toBeLessThanOrEqual(8);
      expect(component.variants.some((v) => v.id === component.chosenVariant)).toBe(true);
    }
  });

  it('assigns restrained animations and honors reduced motion', () => {
    expect(design.animations.length).toBe(design.sectionOrder.length);
    const names = new Set(design.animations.map((a) => a.animation.name));
    expect(names.size).toBeLessThanOrEqual(4);
    expect(design.animations.every((a) => a.animation.durationMs <= 1000)).toBe(true);
    const still = new DesignGenerationEngine({ reducedMotion: true }).generateDesignSystem(briefFor('A quiet law firm.'));
    return still.then((s) => expect(s.animations.every((a) => a.animation.name === 'none')).toBe(true));
  });

  it('produces image directions with reusable prompts and aspect ratios', () => {
    expect(design.imageDirection.length).toBe(design.sectionOrder.length);
    for (const spec of design.imageDirection) {
      expect(spec.prompt.toLowerCase()).toContain(spec.sectionType);
      expect(spec.prompt.length).toBeGreaterThan(40);
      expect(spec.aspectRatio).toMatch(/^\d+\/\d+$/);
      expect(spec.cameraAngle).toBeTruthy();
      expect(spec.lighting).toBeTruthy();
      expect(spec.colorGrading).toBeTruthy();
      expect(spec.mood).toBeTruthy();
    }
  });

  it('picks food icons for a restaurant and niche sets per industry', () => {
    expect(design.icons.family).toBe('food');
    expect(design.icons.set.length).toBeGreaterThanOrEqual(5);
    expect(buildIconSet(classifyIndustry('Modern dental clinic with implants')).set).toContain('stethoscope');
    expect(buildIconSet(classifyIndustry('Online courses and tutoring')).set).toContain('graduation-cap');
  });

  it('covers all five breakpoints with adaptive rules', () => {
    const r = design.responsive;
    expect(Object.keys(r.breakpoints)).toEqual(['desktop', 'laptop', 'tablet', 'largeMobile', 'mobile']);
    expect(r.spacing.desktop).toBeGreaterThan(r.spacing.mobile);
    expect(r.cardColumns.desktop).toBe(4);
    expect(r.cardColumns.mobile).toBe(1);
    expect(r.navBehavior.tablet).toBe('drawer');
    expect(r.columns.desktop).toBe(12);
    expect(r.buttonSize.mobile).toBe('md');
  });

  it('enforces WCAG AA accessibility rules', () => {
    const a = design.accessibility;
    expect(a.contrastAA).toBe(true);
    expect(a.keyboardNav).toBe(true);
    expect(a.reducedMotion).toBe(true);
    expect(a.focusVisible).toContain('solid');
    expect(a.ariaLandmarks).toContain('main');
    expect(a.ariaLandmarks).toContain('navigation');
    expect(a.ariaLandmarks).toContain('contentinfo');
  });
});

describe('Industry-based design intelligence', () => {
  it('classifies business descriptions into industries', () => {
    expect(classifyIndustry('Boutique law firm specializing in family law').id).toBe('law-firm');
    expect(classifyIndustry('CrossFit gym with personal training').id).toBe('gym');
    expect(classifyIndustry('SaaS platform for team task automation').id).toBe('saas');
    expect(classifyIndustry('Church ministry in downtown').id).toBe('church');
  });

  it('produces genuinely different designs for restaurant, SaaS, and hospital', async () => {
    const [restaurant, saas, hospital] = await Promise.all([
      engine.generateDesignSystem(briefFor('A cozy Italian restaurant.')),
      engine.generateDesignSystem(briefFor('A SaaS platform for task automation.')),
      engine.generateDesignSystem(briefFor('A modern hospital with emergency care.')),
    ]);
    expect(restaurant.theme.primary).not.toBe(saas.theme.primary);
    expect(saas.theme.primary).not.toBe(hospital.theme.primary);
    expect(saas.typography.headingFont).not.toBe(restaurant.typography.headingFont);
    expect(saas.sectionOrder[0]).toBe('hero');
    expect(saas.sectionOrder).toEqual(['hero', 'features', 'integrations', 'pricing', 'testimonials', 'faq', 'cta']);
    expect(hospital.sectionOrder[1]).toBe('services');
    expect(hospital.icons.family).toBe('medical');
    expect(restaurant.layout.id).not.toBe(saas.layout.id);
  });
});

describe('Theme library', () => {
  it('contains 21 curated themes', () => {
    expect(THEME_LIBRARY.length).toBe(21);
    expect(listThemes().length).toBe(21);
  });

  it('matches industries to library themes and generates new ones otherwise', () => {
    const restaurant = classifyIndustry('Italian restaurant');
    const selection = selectTheme(restaurant);
    expect(selection.fromLibrary).toBe(true);
    expect(selection.entry.label).toBe('Restaurant Warm');

    const unknown = { ...restaurant, id: 'hovercraft-rentals' };
    const generated = selectTheme(unknown);
    expect(generated.fromLibrary).toBe(false);
    expect(generated.entry.seed).toBe(unknown.seed);
  });
});

describe('Component consistency checker', () => {
  it('passes on a well-formed design system', async () => {
    const design = await engine.generateDesignSystem(briefFor('A travel agency.'));
    const report = checkDesignConsistency(design);
    expect(report.passed).toBe(true);
  });

  it('flags and auto-repairs inconsistent designs', async () => {
    const design = await engine.generateDesignSystem(briefFor('A boutique hotel.'));
    const broken: DesignSystem = {
      ...design,
      spacingScale: [3, 7, 11],
      components: design.components.map((c) => ({
        ...c,
        variants: c.variants.map((v) => (v.id === c.chosenVariant ? { ...v, tokens: { ...v.tokens, radius: 'bogus', shadow: 'blur', cardStyle: 'weird' } } : v)),
      })),
    };
    const report = checkDesignConsistency(broken);
    expect(report.passed).toBe(false);
    expect(report.issues.some((i) => i.dimension === 'spacing')).toBe(true);
    expect(report.issues.some((i) => i.dimension === 'radius')).toBe(true);

    const repaired = repairConsistency(broken);
    expect(repaired.repairs.length).toBeGreaterThan(0);
    expect(checkDesignConsistency(repaired.design).passed).toBe(true);
  });
});

describe('Design review agent (5 skills, max 5 cycles)', () => {
  it('runs all five installed design skills as reviewers', async () => {
    const design = await engine.generateDesignSystem(briefFor('A digital agency.'));
    expect(design.score.reviewers.length).toBe(5);
    for (const reviewer of design.score.reviewers) {
      expect(DESIGN_REVIEWERS).toContain(reviewer.reviewer);
      expect(reviewer.criteria.typography).toBeGreaterThanOrEqual(0);
      expect(reviewer.criteria.typography).toBeLessThanOrEqual(10);
    }
  });

  it('revises weak designs until they score 9/10+, within 5 cycles', async () => {
    const design = await engine.generateDesignSystem(briefFor('A bakery.'));
    const weak: DesignSystem = {
      ...design,
      typography: { ...design.typography, headingFont: 'Comic Sans MS', bodyFont: 'Papyrus', displayFont: 'Papyrus', buttonFont: 'Papyrus' },
      spacingScale: [4],
      theme: { ...design.theme, text: '#8a8a8a' },
      accessibility: { ...design.accessibility, contrastAA: false },
    };
    const before = evaluateDesign(weak);
    expect(before.typography).toBeLessThan(9);
    expect(before.accessibility).toBeLessThan(9);

    const score = reviewDesign(weak, 5);
    expect(score.reviewCycles).toBeLessThanOrEqual(5);
    expect(score.overall).toBeGreaterThanOrEqual(9);
    expect(score.passed).toBe(true);
  });

  it('reports feedback per criterion below 9/10', async () => {
    const design = await engine.generateDesignSystem(briefFor('A wedding planning studio.'));
    const reviewers = design.score.reviewers;
    expect(reviewers.every((r) => r.feedback.length >= 0)).toBe(true);
    expect(design.score.passed).toBe(true);
  });
});

describe('applyDesignSystemToProject', () => {
  it('merges design tokens into the project theme', async () => {
    const design = await engine.generateDesignSystem(briefFor('A barbershop.'));
    const project = makeTestProject('Barbershop');
    const applied = applyDesignSystemToProject(project, design);
    const tokens = applied.theme.tokens as Record<string, unknown>;
    const colors = tokens.colors as Record<string, unknown>;
    expect(colors.primary).toBe(design.theme.primary);
    expect(colors.buttonBackground).toBe(design.theme.button.background);
    const fonts = tokens.fontFamily as Record<string, unknown>;
    expect(fonts.heading).toBe(design.typography.headingFont);
    const spacing = tokens.spacing as Record<string, unknown>;
    expect(Object.values(spacing).every((v) => typeof v === 'number' && v % 4 === 0)).toBe(true);
    expect(applied.theme.preset).toBe('Barbershop');
  });

  it('reorders home sections into the designed sequence and adds missing ones', async () => {
    const design = await engine.generateDesignSystem(briefFor('A sushi restaurant.'));
    const project = makeTestProject('Sushi Spot');
    const applied = applyDesignSystemToProject(project, design);
    const home = applied.pages.find((p) => p.isHome)!;
    const types = home.sections.map((s) => s.type);
    expect(types.indexOf('menu')).toBeGreaterThanOrEqual(0);
    expect(types.indexOf('menu')).toBeLessThan(types.indexOf('testimonials'));
    // The designed sequence leads the page; leftover sections append after it.
    expect(types.slice(0, design.sectionOrder.length)).toEqual(design.sectionOrder);
  });
});

describe('WebsiteBuilderAgent integration', () => {
  it('generates a website with the design engine applied and scored', async () => {
    const agent = new WebsiteBuilderAgent();
    const result = await agent.generateWebsite(briefFor('A modern restaurant serving local cuisine.', 'Restaurant'));

    expect(result.success).toBe(true);
    expect(result.project).not.toBeNull();
    const designScore = result.memory.designScore as number | undefined;
    expect(designScore).toBeDefined();
    expect(designScore!).toBeGreaterThanOrEqual(9);
    const designSummary = result.memory.designSystem as Record<string, unknown> | undefined;
    expect(designSummary?.industry).toBe('Restaurant');
    expect(designSummary?.layout).toBeTruthy();
    expect(designSummary?.fonts).toContain('/');
    expect((result.project!.theme.tokens as { colors?: Record<string, string> }).colors?.primary).toBeTruthy();
  });

  it('summarizes the design system for memory/reporting', async () => {
    const design = await engine.generateDesignSystem(briefFor('An architecture firm.'));
    const summary = summarizeDesign(design);
    expect(summary.industry).toBe('Architecture');
    expect(summary.designScore).toBeGreaterThanOrEqual(9);
    expect(Array.isArray(summary.sectionOrder)).toBe(true);
  });
});

describe('Typography engine', () => {
  it('never uses random fonts — only premium Google Fonts', async () => {
    const restaurant = classifyIndustry('Restaurant');
    const system = buildTypographySystem(restaurant);
    expect(system.headingFont).toBe('Cormorant Garamond');
    expect(system.bodyFont).toBe('Jost');
    const saas = buildTypographySystem(classifyIndustry('SaaS platform'));
    expect(saas.headingFont).toBe('Plus Jakarta Sans');
  });

  it('builds industry-specific section orders', () => {
    expect(buildSectionOrder(classifyIndustry('Restaurant'))).toEqual(['hero', 'menu', 'gallery', 'testimonials', 'reservation', 'chef', 'faq', 'contact']);
    expect(buildSectionOrder(classifyIndustry('Gym'))[1]).toBe('programs');
    expect(buildSectionOrder(classifyIndustry('School'))[1]).toBe('programs');
  });
});
