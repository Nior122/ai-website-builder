# Frontend Component Patterns

Reference blueprints for common interactive components with accessibility and
performance notes.

---

## Navbar

- Structure: `<header><nav aria-label="Main">` → logo (link to home) → ul of
  links → CTA button. Mobile: hamburger button (`aria-expanded`,
  `aria-controls`), menu panel.
- Focus trap not required for simple dropdowns; `Escape` closes open menus.
- Sticky nav gets `backdrop-filter: blur(12px)` over a translucent
  background — never fully opaque.
- Current page link: `aria-current="page"`.

## Accordion

- Buttons: `<h3><button aria-expanded="false" aria-controls="panel-id">`.
- Panel: `role="region" aria-labelledby="trigger-id"`.
- Animate with `grid-template-rows: 0fr → 1fr` or `max-height`; respect
  `prefers-reduced-motion` (instant toggle).
- Only one panel open at a time for FAQ sections.

## Carousel / Slider

- `aria-roledescription="carousel"`, `aria-label="Section name"`.
- Slides: `role="group" aria-roledescription="slide" aria-label="1 of 5"`.
- Prev/next buttons + dots with `aria-label`s. `Escape` exits keyboard focus.
- Pause auto-advance on hover/focus; disable auto-advance entirely when
  `prefers-reduced-motion: reduce`.
- Performance: render visible slide ±1; images lazy-loaded.

## Tabs

- Tablist: `role="tablist" aria-label`, tabs `role="tab" aria-selected`,
  `aria-controls`; panels `role="tabpanel"` + `tabindex="0"`.
- Keyboard: arrow keys move focus + activate; Home/End jump.
- No tab-switching on hover (desktop only, opt-in).

## Cards

- Whole-card link pattern: link stretched over card (`position: absolute;
  inset: 0`) with inner content links `position: relative` + `z-index: 1`.
- Card title uses `h2`/`h3` matching page hierarchy.
- Equal heights: CSS grid with `grid-auto-rows: 1fr`.

## Forms

- Field wrapper: `<label>` with visible text; input `id` matches label `for`.
- Errors: `<p id="field-error" role="alert">` linked via
  `aria-describedby`; input gets `aria-invalid="true"`.
- Success: no visual-only success — include text confirmation.
- Buttons: `<button type="submit">`, disabled only while submitting, with
  "Submitting…" state.

## Media

- Images: explicit width/height (or `aspect-ratio`) to prevent CLS;
  `loading="lazy"` + `decoding="async"` below the fold.
- Video: `preload="metadata"`, poster image, `playsinline` for mobile.
- Icons: inline SVG with `aria-hidden="true"` (decorative) or `role="img"`
  + `aria-label` (informative).

## Theme Integration

All components consume tokens via CSS custom properties:

```css
--color-surface, --color-text, --color-border, --radius-md,
--shadow-sm, --space-4, --font-body, --motion-fast
```

Never hardcode hex values or pixel spacing inside components.
