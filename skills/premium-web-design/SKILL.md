# premium-web-design

**Name:** premium-web-design  
**Version:** 1.0.0  
**Author:** AI Website Builder Studio  
**Source:** Authored in-house (no canonical upstream repository found)

---

## Purpose

Premium UI patterns for modern landing pages and SaaS websites. Produces
polished, high-end visual design: refined hero layouts, layered depth,
generous whitespace, precise typography scale, and premium visual polish
comparable to Lovable, Framer AI, and v0 output.

## When To Use

- Generating a new website for a business that competes on perceived quality
- Designing hero sections, pricing tables, testimonial walls, and feature grids
- Any stage where the output must feel "premium", not template-like

## Core Principles

1. **Whitespace is a feature.** Premium layouts use 2–4× more whitespace than
   utilitarian layouts. Never fill space for the sake of filling it.
2. **One dominant focal point per viewport.** The hero has exactly one visual
   anchor (headline + CTA). Supporting elements recede.
3. **Layered depth without clutter.** Use soft shadows (2–3 elevation levels),
   subtle gradients, and 1px borders (`rgba(0,0,0,0.08)`) instead of heavy
   boxes.
4. **Typography does the heavy lifting.** Display sizes ≥ 48px on desktop,
   tight letter-spacing (`-0.02em` to `-0.04em`) on headings, 1.5–1.75 line
   height on body. Never render body text below 16px.
5. **Constrained palette.** 3 colors max in hero regions (background, ink,
   one accent). Accent usage < 10% of the viewport.
6. **Radius language.** One system: `sm 6px / md 12px / lg 20px / xl 28px / full
   9999px`. Never mix radii from different systems.
7. **Micro-interactions.** Hover states must be *felt*: 150–250ms ease-out
   transitions, 1px border-color shifts, subtle translateY(-2px) on cards.
   No instant jumps, no bouncy overshoot in professional contexts.
8. **Photography direction.** Warm, consistent lighting; natural perspective;
   subjects looking into the layout; consistent color grade across all images.

## Reference Patterns

See `references/landing-page-patterns.md` for concrete section blueprints
(hero variants, social proof walls, pricing tables, FAQ layouts, footer
architectures).

## Output Contract

Every generated section MUST declare:

- `layout`: which reference pattern it follows
- `spacing`: the spacing-scale tokens used (4px base grid)
- `elevation`: shadow token (sm | md | lg)
- `radius`: radius token (sm | md | lg | xl | full)
- `typography`: heading + body font tokens from the active theme
- `interaction`: hover/focus transition spec

## Verification Checklist

- [ ] Only one focal point per section
- [ ] All spacing values are multiples of 4px
- [ ] Shadows consistent with elevation tokens
- [ ] Accent color < 10% of any section
- [ ] Body text ≥ 16px, headings have negative letter-spacing
- [ ] Hover states have 150–250ms ease-out transitions
