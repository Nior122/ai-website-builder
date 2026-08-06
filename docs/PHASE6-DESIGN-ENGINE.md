# PHASE 6 — AI Theme & Component Generation Engine

The Website Builder no longer generates generic layouts. `DesignGenerationEngine`
produces a unique, premium-quality **design system** for every website — the kind
of output you'd expect from Framer, Webflow, v0, or a premium design agency.

## What it generates

| Concern | Engine | Highlights |
|---|---|---|
| Theme | `theme-generator.ts` | Primary/secondary/accent/neutral, backgrounds, surfaces, text, borders, success/warning/danger/info, light+dark modes, hover/focus/disabled, button colors — all derived from one seed |
| Typography | `typography-engine.ts` | Premium Google Font pairings per industry (13 curated pairs). Heading/body/button/display fonts, weights, line heights, letter spacing, heading/body scales, responsive clamping — never random |
| Layout | `layout-engine.ts` | 19 patterns: Split Hero, Centered Hero, Image Left/Right, Card Grid, Alternating, Masonry, Bento, Magazine, Minimal, Editorial, Corporate, Luxury, Modern Startup, Glassmorphism, Neumorphism, Gradient, Premium SaaS, Creative Agency — selected by industry fit + conversion weight |
| Components | `component-generator.ts` | 22 components × 5–8 variants each (Hero, Features, Pricing, FAQ, Testimonials, Gallery, Team, Portfolio, Timeline, Services, Blog, CTA, Newsletter, Contact, Footer, Navbar, Cards, Forms, Statistics, Mission, Vision, Values) with industry-biased variant selection |
| Section order | `section-ordering.ts` | 17 storytelling/conversion archetypes — e.g. Restaurant: Hero → Menu → Gallery → Testimonials → Reservation → Chef → FAQ → Contact; SaaS: Hero → Features → Integrations → Pricing → Testimonials → FAQ → CTA |
| Animations | `animation-engine.ts` | Fade, slide, scale, parallax, stagger, scroll reveal, hover effects, micro-interactions per style — always restrained (≤4 distinct animations), reduced-motion aware |
| Images | `image-direction.ts` | Per-section image spec: purpose, composition, camera angle, lighting, mood, color grading, style, **reusable prompt**, aspect ratio |
| Icons | `icon-intelligence.ts` | Niche-matched icon sets — medical for healthcare, food for restaurants, banking for finance, learning for education, etc. |
| Responsive | `responsive-engine.ts` | Desktop / laptop / tablet / large-mobile / mobile rules for spacing, padding, columns, typography, buttons, cards, images, navigation |
| Accessibility | `accessibility-engine.ts` | WCAG AA contrast (verified), keyboard nav, ARIA landmarks, focus states, accessible forms, reduced motion |
| Theme library | `theme-library.ts` | 21 curated themes (Modern SaaS … Gaming Dark); reuse a matching theme or generate a brand-new one |

## Design review (Step 15)

Before generation completes, five installed design skills review the design:

- `frontend-design`
- `premium-web-design`
- `design-taste-frontend`
- `gpt-taste`
- `impeccable`

Each reviewer scores 11 criteria (visual hierarchy, modern appearance,
professionalism, spacing, alignment, typography, white space, consistency,
component quality, responsiveness, accessibility) with reviewer-specific
weights. Any design scoring below **9/10** is automatically revised (typography
upgrade, spacing rhythm, contrast repair, consistency normalization, layout
upgrade, component enrichment) and re-reviewed — **max 5 review cycles**.

## Consistency (Step 14)

`consistency-checker.ts` verifies one design language: same spacing scale (4px
rhythm), same typography scale, same radius/shadow/card/button/icon/animation
language, same section spacing — and `repairConsistency` fixes violations
automatically.

## Integration

`WebsiteBuilderAgent.generateWebsite` now runs the engine right after the
generation workflow (new `design-system` stage):

1. `DesignGenerationEngine.generateDesignSystem(brief)` — full design system.
2. `applyDesignSystemToProject(project, design)` — merges theme tokens,
   reorders the home page into the designed sequence, adds missing preferred
   sections.
3. Design score + summary are stored in agent memory (`designScore`,
   `designSystem`) and ride along in the build result.

All Phase 1–5 functionality is preserved: the design system is applied on top
of the existing pipeline, and the existing repair/quality machinery still runs
afterwards.

## Files

```
lib/design-engine/
  types.ts                       DesignSystem + all sub-types
  industry-profiles.ts           35 industry profiles + keyword classification
  theme-generator.ts             full theme token generation (+contrast repair)
  typography-engine.ts           premium Google Font pairings + scales
  layout-engine.ts               19 layout patterns + intelligent selection
  component-generator.ts         22 components × 5–8 variants
  section-ordering.ts            smart section ordering per industry archetype
  animation-engine.ts            restrained animation rules per style
  image-direction.ts             per-section image specs with reusable prompts
  icon-intelligence.ts           niche-matched icon sets
  responsive-engine.ts           5-breakpoint adaptive rules
  accessibility-engine.ts        WCAG AA rules + contrast audit
  theme-library.ts               21 curated themes + select/generate logic
  consistency-checker.ts         consistency audit + auto-repair
  design-review.ts               five skill reviewers + revision cycles
  design-generation-engine.ts    DesignGenerationEngine orchestrator
  index.ts                       barrel exports
```

Tests: `__tests__/api/design-engine/design-engine.test.ts`
