// =============================================================================
// Agent 4 — UI Design Agent
// =============================================================================
// Creates visual design decisions: layout patterns, component choices, grid,
// spacing system, animation style, and interaction patterns. Uses the
// installed design skills (frontend-design, premium-web-design) via the
// Phase 2 theme + token engine.
// =============================================================================

import { Agent, isNonEmptyArray, isNonEmptyString, isRecord } from '../base';
import type { ProjectContext } from '../context';
import { createDesignTokens, getThemePreset, SECTION_BLUEPRINTS } from '@/lib/ai/design-pipeline';
import type { UiDesign } from '../types';

export class UiDesignAgent extends Agent {
  readonly id = 'ui' as const;
  readonly outputKey = 'ui';

  run(context: ProjectContext): UiDesign {
    const req = context.request;
    const preset = getThemePreset(req.businessType, req.industry);
    const tokens = createDesignTokens(preset.seed, preset.mode, {
      headingFont: preset.headingFont,
      bodyFont: preset.bodyFont,
      radius: preset.radius,
      style: { icon: preset.iconStyle, animation: preset.animationStyle },
    });

    const components = SECTION_BLUEPRINTS
      .filter((blueprint) => blueprint.type !== 'divider' && blueprint.type !== 'spacer' && blueprint.type !== 'custom-html')
      .slice(0, 12)
      .map((blueprint) => `${blueprint.type.charAt(0).toUpperCase()}${blueprint.type.slice(1)}Section`);

    return {
      layoutPattern: `${preset.label} — ${preset.description}`,
      components,
      grid: '12-column responsive grid (desktop) → 4-column (tablet) → stacked (mobile)',
      spacing: `4px base spacing scale (${Object.keys(tokens.spacing).length} steps)`,
      animationStyle: tokens.style.animation,
      interactionPatterns: [
        '150–250ms ease-out transitions for hovers and focus',
        'Focus-visible outlines at 3:1 contrast',
        'prefers-reduced-motion respected (no auto-play, no parallax)',
        'Keyboard: logical tab order, skip-to-content link',
      ],
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return (
      isNonEmptyString(output.layoutPattern) &&
      isNonEmptyArray(output.components) &&
      isNonEmptyString(output.grid) &&
      isNonEmptyString(output.spacing)
    );
  }

  fallback(context: ProjectContext): UiDesign {
    return {
      layoutPattern: 'Modern SaaS — indigo aesthetic with large radii',
      components: ['HeroSection', 'FeaturesSection', 'CtaSection', 'ContactSection'],
      grid: '12-column responsive grid',
      spacing: '4px base spacing scale',
      animationStyle: 'subtle-fade',
      interactionPatterns: ['150ms ease-out hovers', 'Focus-visible outlines', 'Reduced-motion respected'],
    };
  }
}
