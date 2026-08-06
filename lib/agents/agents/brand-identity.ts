// =============================================================================
// Agent 2 — Brand Identity Agent
// =============================================================================
// Creates the visual identity: brand personality, colors, typography, design
// direction, logo concept, image style, and tone of voice — powered by the
// Phase 2 branding engine + theme generator.
// =============================================================================

import { Agent, isNonEmptyString, isRecord } from '../base';
import type { ProjectContext } from '../context';
import { buildBrandDesign, generateThemeForBusiness } from '@/lib/ai/design-pipeline';
import type { AgentBrand } from '../types';

export class BrandIdentityAgent extends Agent {
  readonly id = 'brand' as const;
  readonly outputKey = 'brand';

  run(context: ProjectContext): AgentBrand {
    const req = context.request;
    const brandDesign = buildBrandDesign(req);
    const theme = generateThemeForBusiness(req.businessType, req);

    return {
      name: brandDesign.name,
      tagline: brandDesign.tagline,
      personality: brandDesign.tone,
      colors: {
        primary: theme.tokens.colors.primary,
        secondary: theme.tokens.colors.secondary,
        accent: theme.tokens.colors.accent,
        background: theme.tokens.colors.background,
        text: theme.tokens.colors.text,
      },
      typography: {
        heading: theme.fonts.heading,
        body: theme.fonts.body,
      },
      designDirection: theme.description,
      logoConcept: `${brandDesign.style.icon} icon mark paired with ${brandDesign.style.card} card language`,
      imageStyle: brandDesign.style.photography,
      toneOfVoice: brandDesign.voiceRules.join(' '),
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    if (!isNonEmptyString(output.name) || !isNonEmptyString(output.personality)) return false;
    if (!isRecord(output.colors) || !isNonEmptyString(output.colors.primary)) return false;
    if (!isRecord(output.typography) || !isNonEmptyString(output.typography.heading)) return false;
    return isNonEmptyString(output.toneOfVoice);
  }

  fallback(context: ProjectContext): AgentBrand {
    const req = context.request;
    const brandDesign = buildBrandDesign({ ...req, tone: 'professional' });
    const theme = generateThemeForBusiness(req.businessType, req);
    return {
      name: brandDesign.name,
      tagline: brandDesign.tagline,
      personality: 'professional',
      colors: {
        primary: theme.tokens.colors.primary,
        secondary: theme.tokens.colors.secondary,
        accent: theme.tokens.colors.accent,
        background: theme.tokens.colors.background,
        text: theme.tokens.colors.text,
      },
      typography: { heading: theme.fonts.heading, body: theme.fonts.body },
      designDirection: theme.description,
      logoConcept: 'Simple mark + wordmark',
      imageStyle: 'natural-warm',
      toneOfVoice: 'Clear, confident, benefit-driven language.',
    };
  }
}
