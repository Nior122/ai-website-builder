// =============================================================================
// Agent 8 — Frontend Architect Agent
// =============================================================================
// Translates design into code structure: component architecture, reusable
// components, folder structure, performance patterns, clean React/Next.js.
// Output: ComponentArchitecture.
// =============================================================================

import { Agent, isNonEmptyArray, isRecord } from '../base';
import type { ProjectContext } from '../context';
import type { ComponentArchitecture } from '../types';

export class FrontendArchitectAgent extends Agent {
  readonly id = 'frontend' as const;
  readonly outputKey = 'frontend';

  run(context: ProjectContext): ComponentArchitecture {
    const ui = context.ui;
    const ux = context.ux;

    const sectionTypes = ux?.sectionOrder ?? ['hero', 'features', 'cta', 'contact'];
    const sectionComponents = sectionTypes
      .filter((type) => type !== 'divider' && type !== 'spacer')
      .slice(0, 10)
      .map((type) => ({
        name: `${type.charAt(0).toUpperCase()}${type.slice(1)}Section`,
        purpose: `Renders the ${type} section with theme tokens`,
        props: ['content', 'theme', 'className'],
      }));

    const components = [
      {
        name: 'Navbar',
        purpose: 'Primary navigation with mobile menu (aria-expanded)',
        props: ['links', 'cta'],
      },
      {
        name: 'Footer',
        purpose: 'Site footer with link columns and social icons',
        props: ['columns', 'socialLinks'],
      },
      ...sectionComponents,
    ];

    return {
      components,
      folderStructure: [
        'components/sections/   — one file per section type',
        'components/ui/         — primitives (Button, Card, Badge)',
        'components/layout/     — Navbar, Footer, Shell',
        'lib/design-tokens/     — theme tokens consumed by all components',
        'hooks/                 — useSectionData, useReducedMotion',
      ],
      performancePatterns: [
        'Dynamic imports for below-fold sections (FAQ, gallery, map)',
        'next/image with explicit sizes; priority only on hero',
        'Server Components by default; client islands only where interactive',
        'CSS custom properties for all theme tokens — no hardcoded values',
      ],
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return isNonEmptyArray(output.components) && isNonEmptyArray(output.performancePatterns);
  }

  fallback(context: ProjectContext): ComponentArchitecture {
    return {
      components: [
        { name: 'Navbar', purpose: 'Primary navigation', props: ['links'] },
        { name: 'HeroSection', purpose: 'Renders the hero section', props: ['content', 'theme'] },
        { name: 'Footer', purpose: 'Site footer', props: ['columns'] },
      ],
      folderStructure: ['components/sections/', 'components/ui/', 'lib/design-tokens/'],
      performancePatterns: ['Dynamic imports below the fold', 'next/image with explicit sizes'],
    };
  }
}
