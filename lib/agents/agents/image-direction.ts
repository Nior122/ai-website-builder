// =============================================================================
// Agent 6 — Image Direction Agent
// =============================================================================
// Controls all visuals: hero prompts, gallery, service images, team images,
// backgrounds, illustrations, icons. Every image shares ONE style.
// Output: ImageDirection.
// =============================================================================

import { Agent, isNonEmptyArray, isNonEmptyString, isRecord } from '../base';
import type { ProjectContext } from '../context';
import { getThemePreset, SECTION_BLUEPRINTS } from '@/lib/ai/design-pipeline';
import type { ImageDirection } from '../types';

const HERO_SECTION_TYPES = ['hero', 'about', 'cta', 'contact'];

export class ImageDirectionAgent extends Agent {
  readonly id = 'images' as const;
  readonly outputKey = 'images';

  run(context: ProjectContext): ImageDirection {
    const req = context.request;
    const brand = context.brand;
    const preset = getThemePreset(req.businessType, req.industry);

    const style = brand?.imageStyle ?? preset.iconStyle;
    const business = brand?.name ?? req.businessType;
    const styleNote = `Consistent "${style}" visual language across every image — same grade, lighting, and composition rules.`;

    const hero = HERO_SECTION_TYPES.map(
      (sectionType) =>
        `${business} — ${sectionType} visual in ${style} style, warm natural lighting, editorial composition, no text in image.`
    );

    const sectionTypes = SECTION_BLUEPRINTS
      .filter((blueprint) => blueprint.type !== 'divider' && blueprint.type !== 'spacer')
      .slice(0, 6)
      .map((blueprint) => blueprint.type);

    const gallery = sectionTypes.map(
      (type) => `${business} ${type} scene, ${style} style, consistent grade.`
    );

    return {
      style: styleNote,
      hero,
      gallery,
      services: [
        `${business} service showcase, ${style} style`,
        `${business} team at work, candid but art-directed`,
      ],
      team: [
        `${business} team portrait, consistent background and lighting`,
        `Headshot of leadership, ${style} style`,
      ],
      backgrounds: [
        `${business} abstract texture background, ${preset.mode === 'dark' ? 'deep dark' : 'light'} tonal`,
      ],
      iconStyle: preset.iconStyle,
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return (
      isNonEmptyString(output.style) &&
      isNonEmptyArray(output.hero) &&
      isNonEmptyArray(output.gallery) &&
      isNonEmptyString(output.iconStyle)
    );
  }

  fallback(context: ProjectContext): ImageDirection {
    const req = context.request;
    return {
      style: 'Consistent natural-warm visual language across every image.',
      hero: [`${req.businessType} hero visual, natural-warm style`],
      gallery: [`${req.businessType} gallery scene`],
      services: [`${req.businessType} service showcase`],
      team: [`${req.businessType} team portrait`],
      backgrounds: ['Subtle abstract background'],
      iconStyle: 'outline-1.5',
    };
  }
}
