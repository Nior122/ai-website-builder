# Phase 2 — Design Intelligence & Skill Integration

## Overview

The AI generation engine now behaves like a team of specialist designers and
engineers. Eight professional skills are installed and managed by a Skill
Manager, and a new design pipeline consumes them to produce polished,
conversion-focused, accessible websites — instead of generic one-shot output.

## Installed Skills

| Skill | Version | Source | Entry Point |
|---|---|---|---|
| `frontend-design` | 1.0.0 | anthropics/skills | `skills/frontend-design/SKILL.md` |
| `premium-web-design` | 1.0.0 | authored (no upstream) | `skills/premium-web-design/SKILL.md` |
| `emil-kowalski` | 1.0.0 | adefemi-dev/Emil-Kowalski | `skills/emil-kowalski/SKILL.md` |
| `impeccable` | 1.0.0 | pbakaus/impeccable | `skills/impeccable/SKILL.md` |
| `design-taste-frontend` | 1.0.0 | lazylizardai/skill-design-taste-frontend | `skills/design-taste-frontend/SKILL.md` |
| `gpt-taste` | 1.0.0 | evgyur/gpt-taste | `skills/gpt-taste/SKILL.md` |
| `copy-editing` | 1.0.0 | diuzhev26-glitch/copy-editing | `skills/copy-editing/SKILL.md` |
| `frontend-patterns` | 1.0.0 | authored (synthesis) | `skills/frontend-patterns/SKILL.md` |

Each skill was installed as a **complete folder** (SKILL.md + references +
agents + supporting files, 164 files total) and verified on disk.

## How Skills Load

1. **Registry** (`lib/skills/registry.ts`) — declares every skill with name,
   version, purpose, entry point, dependencies, capabilities, installed files,
   and source provenance. It is the single source of truth.
2. **Config** (`lib/skills/config.ts`) — reads `SKILLS_ENABLED` and per-skill
   `SKILL_<NAME>_ENABLED` environment variables. Skills are never hardcoded on.
3. **Skill Manager** (`lib/skills/skill-manager.ts`) — loads the registry,
   registers each skill, validates entry points on disk, enables/disables per
   config, tracks health, detects failures, recovers failed skills, and logs
   diagnostics. Singleton: `getSkillManager()`.

## How Skills Communicate

The design pipeline (`lib/ai/design-pipeline/`) asks the manager which skills
are enabled for each pipeline stage via `skillsForStage(stage)` /
`primarySkillForStage(stage)`:

| Stage | Skills |
|---|---|
| brand | gpt-taste, copy-editing |
| visual-style | design-taste-frontend |
| layout-strategy | premium-web-design, frontend-design |
| section-design | premium-web-design |
| component-design | frontend-patterns |
| copywriting | copy-editing |
| interaction | emil-kowalski |
| polish | impeccable |
| validation | frontend-patterns, impeccable |

Stages run independently. If a stage's skill is disabled, the stage still
runs on built-in logic and records the missing skill in its `DesignStageResult`.

## How to Add a New Skill

1. Create `skills/<name>/SKILL.md` (plus any `references/`, `prompts/`,
   `agents/`, `scripts/` files).
2. Add a `SkillDefinition` entry to `SKILL_REGISTRY` in `lib/skills/registry.ts`
   with its real installed `files`.
3. Optionally map it to pipeline stages in `STAGE_SKILLS` in
   `lib/skills/types.ts`.
4. No application code changes required to *run* the skill — the manager and
   pipeline discover it from the registry.

## How to Disable a Skill

```bash
# Disable everything:
SKILLS_ENABLED=none

# Enable only two:
SKILLS_ENABLED=frontend-design,copy-editing

# Disable a single skill:
SKILL_IMECCABLE_ENABLED=false   # or SKILL_<ANY_NAME>_ENABLED=false
```

## How to Troubleshoot Skill Failures

- `getSkillManager().getHealth()` — status per skill (enabled/disabled/error).
- `getSkillManager().detectFailures()` — names of errored skills.
- `getSkillManager().recover(name)` / `recoverAll()` — re-validates the entry
  point and re-enables the skill.
- Check diagnostics: each `SkillHealth` keeps a `diagnostics[]` log.
- Runtime failure in a stage → `markFailed(name, reason)` then `recover()`.

## Design Pipeline Stages

`runDesignPipeline(brief)` produces:

1. **Brand** — name, tagline, tone voice rules, mission/vision/values, style
   direction (button/card/icon/illustration/photography/animation).
2. **Visual Style** — full design tokens from a business-type seed (colors,
   shades, shadows, radii, spacing scale, font scale, motion).
3. **Layout Strategy** — page blueprint (hero → features → stats → testimonials
   → pricing → CTA → contact).
4. **Section Design** — per-section blueprints for all 25 supported section
   types (layout, spacing, elevation, radius, typography, ARIA).
5. **Component Design** — one button/card/icon system bound to tokens.
6. **Copywriting** — benefit-driven headline, subheadline, features, benefits,
   FAQs, testimonials, CTAs, mission/vision/values, contact, footer.
7. **Interaction** — motion tokens (fast/base/slow + easing).
8. **Polish** — impeccable-style pass: contrast, hierarchy, rhythm checks.
9. **Validation** — accessibility (WCAG AA), performance, consistency report
   with auto-repair list.

## Theme Generation

22 business types each get a distinct design language (seed color, fonts,
radius, icon style, animation style): luxury, minimal, modern-saas, medical,
corporate, restaurant, travel, creative, agency, education, beauty, fitness,
construction, technology, fashion, automotive, finance, real-estate, hospital,
church, school, law-firm. Industry keywords route unknown types to the nearest
preset.

## Design Tokens

`createDesignTokens(seed, mode, options)` produces the full token set:
primary/secondary/accent/success/warning/danger/info/neutral/surface/
background/text/border, primary shades 50–950, shadow sm/md/lg, radius
sm/md/lg/xl/full, 4px-base spacing scale, font sizes, line heights, letter
spacing, motion, and style direction. Color math (WCAG luminance, contrast,
mixing) is implemented in `design-tokens.ts` — no external library.

## Validation

After generation the pipeline verifies: theme/typography/color/component
consistency, copy quality, accessibility (WCAG AA contrast via real luminance
math, heading hierarchy, alt text, ARIA, reduced motion), responsive layout
tokens, performance (lazy loading, CLS prevention, JS budget), and SEO
readiness (via the existing SEO stage). Issues are reported with fixes;
deterministic repairs are applied automatically where safe.

## Files Added

- `skills/` — 8 skills, 164 files
- `lib/skills/` — types, config, registry, skill-manager, barrel
- `lib/ai/design-pipeline/` — types, design-tokens, theme-generator,
  branding-engine, copywriter, section-designer, accessibility-checker,
  performance-audit, consistency-validator, design-pipeline, barrel
- `docs/PHASE2-SKILLS.md` — this document
- `__tests__/api/skills/` — skill-manager, design-tokens, design-pipeline tests

## Recommendations for Phase 3

- Wire `runDesignPipeline` output into the live generation flow (post-process
  `runGenerationPipeline` results with tokens/copy/validation).
- Add the 22 theme presets to the editor's theme picker.
- Expose a `/api/skills` endpoint backed by `getSkillManager().getHealth()`.
- Add optional AI-driven refinement: stage prompts (e.g. `buildCopyPrompt`)
  already exist for the copywriting and section stages.
