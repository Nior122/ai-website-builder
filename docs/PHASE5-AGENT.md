# Phase 5 — Autonomous Website Builder Agent

## Overview

The AI no longer acts like a text generator. `WebsiteBuilderAgent` keeps
working — analysing, planning, researching, branding, generating every page
and section, writing content, directing images, optimizing, validating,
repairing, and scoring — until the ENTIRE website is complete. It never
returns partial output.

```
Generate Website
      ↓
Idle → Planning → Researching → Branding → Generating Pages → Generating
Sections → Generating Content → Generating Images → Optimizing → Validating
→ Completed
```

## State Machine (`lib/builder-agent/state-machine.ts`)

11 states, each transition reports progress (0–100). The UI consumes
`AgentProgress { phase, message, progress }`.

## Agent Memory (`lib/builder-agent/memory.ts`)

Shared across the entire pipeline — business name, industry, audience,
services, brand colors, voice, theme, fonts, icons, images, animations,
pages, sections, navigation. Later stages never re-derive what earlier
stages decided.

## Self Validation (`lib/builder-agent/self-validation.ts`)

Before completion the agent verifies **22 rules**:

- Pages exist (≥3) · required pages (privacy/terms/404/coming-soon) · unique
  slugs · unique IDs
- Every section exists · no empty sections · no empty text
- No lorem ipsum · buttons have destinations
- Navigation links resolve · footer links work · navigation matches pages
- Forms have fields
- Site SEO · per-page metadata · OpenGraph
- Theme tokens exist · spacing on 4px scale · typography consistent ·
  animations consistent · responsive layouts · dark-mode WCAG AA contrast
- Media assigned (src + alt)

## Recursive Repair (`lib/builder-agent/recursive-repair.ts`)

If validation fails the agent does NOT return. It repairs → validates →
repairs → validates, **max 5 cycles**, until the website passes. Only the
failing task is repaired — never the whole website. Repairs include: broken
nav links, missing CTA, empty sections, missing alt text/dimensions, missing
SEO/OpenGraph, per-page metadata, duplicate slugs/IDs, empty forms, empty
media library.

## Quality Score (`lib/builder-agent/quality-scorer.ts`)

Every website receives 8 scores (0–100): **Overall, Visual, UX, SEO,
Accessibility, Content, Performance, Completeness**. Any category below 90
triggers an automatic improvement pass for that category
(`improveCategory`), then scores are recomputed.

## Recovery System

Each pipeline stage (generation workflow, repair cycles) is wrapped in a
stage-scoped retry: if a stage fails, ONLY that stage is retried once —
nothing else is regenerated.

## Generation Summary

On completion the agent returns: pages created, sections created, theme,
fonts, colors, components, images, animations, SEO/accessibility/
performance scores, validation status, repair count, generation time, and
the full quality breakdown — plus the shared memory snapshot.

## Files Added

- `lib/builder-agent/types.ts` — phases, scores, findings, summary
- `lib/builder-agent/memory.ts` — AgentMemory
- `lib/builder-agent/state-machine.ts` — BuilderStateMachine + PHASE_ORDER
- `lib/builder-agent/quality-scorer.ts` — 8-category scoring + dark-mode tokens
- `lib/builder-agent/self-validation.ts` — 22-rule validation
- `lib/builder-agent/recursive-repair.ts` — 5-cycle repair loop
- `lib/builder-agent/website-builder-agent.ts` — the autonomous agent
- `lib/builder-agent/index.ts` — barrel
- `__tests__/api/builder-agent/website-builder-agent.test.ts` — full suite
- `docs/PHASE5-AGENT.md` — this document

## Build Completeness (the agent never finishes without these)

✓ pages exist · ✓ sections exist · ✓ navigation works · ✓ footer complete ·
✓ content complete · ✓ metadata complete · ✓ forms complete · ✓ CTA complete
· ✓ images assigned · ✓ testimonials created · ✓ FAQs created · ✓ contact
information created · ✓ copyright generated

## Testing

The suite covers: full autonomous generation (7+ pages, complete site),
state-machine phase walk, every quality category ≥ 90, validation passing
after repair, generation summary completeness, shared memory, repair of a
deliberately broken project within the 5-cycle cap, quality improvement
after repair, and memory/state-machine units.

## Recommendation for Phase 6

Wire `WebsiteBuilderAgent.generateWebsite` to the Generate button with its
progress feed driving the dashboard, and persist results (project + summary
+ scores) to the database for history.
