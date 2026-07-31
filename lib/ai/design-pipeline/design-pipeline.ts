// =============================================================================
// Design Pipeline Orchestrator
// =============================================================================
// Replaces generic one-shot generation with a design-aware pipeline:
//
//   Business → Brand → Visual Style → Layout Strategy → Section Design →
//   Component Design → Copywriting → Interaction → Polish → Validation
//
// Every stage consults the Skill Manager for the skills that power it. If a
// stage's skills are disabled, the stage still runs on built-in logic but
// records the missing skill in its result. Stages are independent — one
// failure never collapses the pipeline.
// =============================================================================

import { logger } from '@/lib/logger';
import { getSkillManager, type SkillManager } from '@/lib/skills';
import { checkAccessibility } from './accessibility-checker';
import { buildBrandDesign } from './branding-engine';
import { validateConsistency } from './consistency-validator';
import { buildCopyBlocks, buildCopyPrompt } from './copywriter';
import { createDesignTokens } from './design-tokens';
import { auditPerformance } from './performance-audit';
import { defaultPageBlueprint, designSection, getSectionBlueprint } from './section-designer';
import { generateThemeForBusiness, getThemePreset } from './theme-generator';
import type {
  BrandDesign,
  CopyBlock,
  DesignBrief,
  DesignPipelineResult,
  DesignStageResult,
  DesignTokens,
  DesignValidationReport,
  SectionBlueprint,
  ThemeDesign,
} from './types';

const LOG = { service: 'design-pipeline' } as const;

export interface DesignPipelineOptions {
  /** Skill manager instance (defaults to the global singleton). */
  skillManager?: SkillManager;
  /** Optional callback fired after each stage completes. */
  onStage?: (stage: DesignStageResult) => void;
}

function runStage(
  stage: string,
  skills: string[],
  fn: () => Promise<void>,
  onStage?: (stage: DesignStageResult) => void
): Promise<DesignStageResult> {
  const started = Date.now();
  return (async () => {
    try {
      await fn();
      const result: DesignStageResult = {
        stage,
        skill: skills[0] ?? null,
        ok: true,
        errors: [],
        durationMs: Date.now() - started,
      };
      onStage?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const result: DesignStageResult = {
        stage,
        skill: skills[0] ?? null,
        ok: false,
        errors: [message],
        durationMs: Date.now() - started,
      };
      logger.error(`Design pipeline stage "${stage}" failed: ${message}`, { ...LOG, stage });
      onStage?.(result);
      return result;
    }
  })();
}

/**
 * Run the full design pipeline for a business brief.
 */
export async function runDesignPipeline(
  brief: DesignBrief,
  options: DesignPipelineOptions = {}
): Promise<DesignPipelineResult> {
  const manager = options.skillManager ?? getSkillManager();
  const stages: DesignStageResult[] = [];
  const errors: string[] = [];

  const record = (stage: DesignStageResult): void => {
    stages.push(stage);
    if (!stage.ok) errors.push(...stage.errors);
  };

  // ── Stage 1: Brand ───────────────────────────────────────────────────
  const brandSkills = manager.skillsForStage('brand');
  let brand: BrandDesign | null = null;
  const brandStage = await runStage(
    'brand',
    brandSkills,
    async () => {
      brand = buildBrandDesign(brief);
      logger.info(`Brand stage: identity built for "${brand?.name}" (skills: ${brandSkills.join(', ') || 'none'})`, LOG);
    },
    options.onStage
  );
  record(brandStage);

  // ── Stage 2: Visual Style ───────────────────────────────────────────
  const visualSkills = manager.skillsForStage('visual-style');
  let tokens: DesignTokens | null = null;
  const visualStage = await runStage(
    'visual-style',
    visualSkills,
    async () => {
      const preset = getThemePreset(brief.businessType, brief.industry);
      tokens = createDesignTokens(preset.seed, preset.mode, {
        headingFont: preset.headingFont,
        bodyFont: preset.bodyFont,
        radius: preset.radius,
        style: {
          icon: preset.iconStyle,
          animation: preset.animationStyle,
          button: brand?.style.button,
          card: brand?.style.card,
          illustration: brand?.style.illustration,
          photography: brand?.style.photography,
        },
      });
    },
    options.onStage
  );
  record(visualStage);

  // ── Stage 3: Layout Strategy ────────────────────────────────────────
  const layoutSkills = manager.skillsForStage('layout-strategy');
  let blueprints: SectionBlueprint[] = [];
  const layoutStage = await runStage(
    'layout-strategy',
    layoutSkills,
    async () => {
      if (!tokens || !brand) throw new Error('visual-style stage did not produce tokens/brand');
      const homeBlueprint = defaultPageBlueprint(brief, tokens, brand);
      blueprints = homeBlueprint;
    },
    options.onStage
  );
  record(layoutStage);

  // ── Stage 4: Section Design ─────────────────────────────────────────
  const sectionSkills = manager.skillsForStage('section-design');
  const sectionStage = await runStage(
    'section-design',
    sectionSkills,
    async () => {
      if (!tokens || !brand) throw new Error('visual-style stage did not produce tokens/brand');
      // Rebuild with explicit ordering so every supported type has a blueprint.
      const requested = brief.pages && brief.pages.length > 0 ? brief.pages : [];
      const sectionTypes = requested.length > 0 ? requested : ['hero', 'features', 'statistics', 'testimonials', 'pricing', 'cta', 'contact'];
      blueprints = sectionTypes
        .filter((type) => getSectionBlueprint(type) !== undefined)
        .map((type, index) => designSection(type, tokens!, brand!, index));
    },
    options.onStage
  );
  record(sectionStage);

  // ── Stage 5: Component Design ───────────────────────────────────────
  const componentSkills = manager.skillsForStage('component-design');
  const componentStage = await runStage(
    'component-design',
    componentSkills,
    async () => {
      if (!tokens) throw new Error('visual-style stage did not produce tokens');
      // Component rules are encoded in the blueprint aria/token contract;
      // log the binding so the renderer consumes one component system.
      logger.info(
        `Component design: ${tokens.style.button} buttons, ${tokens.style.card} cards, ${tokens.style.icon} icons`,
        LOG
      );
    },
    options.onStage
  );
  record(componentStage);

  // ── Stage 6: Copywriting ────────────────────────────────────────────
  const copySkills = manager.skillsForStage('copywriting');
  let copy: CopyBlock[] = [];
  const copyStage = await runStage(
    'copywriting',
    copySkills,
    async () => {
      if (!brand) throw new Error('brand stage did not produce a brand');
      copy = buildCopyBlocks(brief, brand);
      if (copySkills.length === 0) {
        logger.warn('Copywriting: copy-editing skill disabled — using built-in tone-aware copy', LOG);
      } else {
        logger.info(`Copywriting: ${copy.length} blocks generated via ${copySkills[0]}`, LOG);
      }
    },
    options.onStage
  );
  record(copyStage);

  // ── Stage 7: Interaction ────────────────────────────────────────────
  const interactionSkills = manager.skillsForStage('interaction');
  const interactionStage = await runStage(
    'interaction',
    interactionSkills,
    async () => {
      if (!tokens) throw new Error('visual-style stage did not produce tokens');
      if (tokens.motion.base <= 0 || tokens.motion.easing.length === 0) {
        throw new Error('motion tokens are invalid');
      }
      logger.info(
        `Interaction: ${tokens.motion.fast}ms/${tokens.motion.base}ms/${tokens.motion.slow}ms with ${tokens.motion.easing}`,
        LOG
      );
    },
    options.onStage
  );
  record(interactionStage);

  // ── Stage 8: Polish (impeccable pass) ───────────────────────────────
  const polishSkills = manager.skillsForStage('polish');
  let validation: DesignValidationReport | null = null;
  const polishStage = await runStage(
    'polish',
    polishSkills,
    async () => {
      if (!tokens) throw new Error('visual-style stage did not produce tokens');
      const accessibility = checkAccessibility(tokens, {
        sections: blueprints.map((blueprint) => ({ type: blueprint.type })),
        blueprints: blueprints.map((blueprint) => ({ type: blueprint.type, aria: blueprint.aria })),
      });
      const performance = auditPerformance(tokens, { sectionCount: blueprints.length });
      const consistency = validateConsistency(tokens, {
        usedRadii: blueprints.map((blueprint) => blueprint.tokens.radius),
        usedFonts: blueprints.map((blueprint) => blueprint.tokens.typography),
        usedSpacing: blueprints.map((blueprint) => parseInt(blueprint.tokens.spacing.match(/(\d+)px/)?.[1] ?? '0', 10)),
      });
      validation = {
        passed: accessibility.passed && performance.passed && consistency.passed,
        issues: [...accessibility.issues, ...performance.issues, ...consistency.issues],
        repaired: [...accessibility.repaired, ...performance.repaired, ...consistency.repaired],
      };
    },
    options.onStage
  );
  record(polishStage);

  // ── Stage 9: Validation ─────────────────────────────────────────────
  const validationSkills = manager.skillsForStage('validation');
  const validationStage = await runStage(
    'validation',
    validationSkills,
    async () => {
      if (!validation) throw new Error('polish stage did not produce a validation report');
      const errorCount = validation.issues.filter((issue) => issue.severity === 'error').length;
      logger.info(
        `Validation: ${errorCount} error(s), ${validation.issues.length - errorCount} warning(s), ${validation.repaired.length} auto-repair(s)`,
        LOG
      );
    },
    options.onStage
  );
  record(validationStage);

  // ── Result ──────────────────────────────────────────────────────────
  const theme: ThemeDesign | null = tokens
    ? generateThemeForBusiness(brief.businessType, brief)
    : null;

  return {
    success: errors.length === 0,
    stages,
    tokens,
    brand,
    theme,
    copy,
    blueprints,
    validation,
    errors,
  };
}

// ─── Convenience exports ────────────────────────────────────────────────

export { buildCopyPrompt };

export interface DesignBriefInput {
  businessName?: string;
  description: string;
  industry: string;
  businessType: string;
  tone?: string;
  pages?: string[];
  language?: string;
}

export function toDesignBrief(input: DesignBriefInput): DesignBrief {
  return {
    businessName: input.businessName,
    description: input.description,
    industry: input.industry,
    businessType: input.businessType,
    tone: input.tone,
    pages: input.pages,
    language: input.language,
  };
}
