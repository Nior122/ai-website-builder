# Premium Landing Page Patterns

Reference library for premium hero, social proof, pricing, FAQ, and footer
compositions. Each pattern lists structure, spacing rhythm, and polish notes.

---

## Hero Patterns

### Pattern H1 — Centered Gradient Halo
- Structure: full-width section, centered max-width 720px content, badge →
  display headline (56–72px) → subheadline (18–20px) → dual CTA → product
  mockup card below with elevation `lg`.
- Polish: background `radial-gradient(1200px 600px at 50% -10%, accent@8%, transparent)`;
  badge pill with `background: color-mix(accent 10%, transparent)` and 1px accent border.

### Pattern H2 — Split Editorial
- Structure: 50/50 grid. Left: eyebrow (small caps, 12px, 600 weight, accent
  color) → headline (48–64px) → body → CTA row → social proof mini-row
  (avatars + "Trusted by 2,000+ teams"). Right: 4:5 aspect image with `lg`
  radius and decorative blurred accent block behind.
- Polish: image has `object-fit: cover`; decorative block uses the accent at
  30% opacity, `border-radius: xl`, `filter: blur(48px)`.

### Pattern H3 — Product Window
- Structure: centered headline block, then a browser-chrome mockup (rounded
  top bar with 3 dots, inner screenshot, `lg` radius, elevation `lg`, 1px
  border). Full-bleed background in `surface` color.
- Polish: mockup has subtle inner gradient; top bar dots use `text` color at
  20% opacity; screenshot area keeps the section's visual rhythm.

## Social Proof

### Wall of Love
- 3-column masonry of quote cards (avatar, name, role, 1–3 sentence quote).
- Cards: `surface` background, 1px border, `md` radius, `sm` elevation,
  hover `translateY(-2px)` + `md` elevation. Equal-height via flex.

### Logo Cloud
- 2 rows, 6 logos each, `grayscale(100%) opacity(60%)` at rest; full color on
  hover. Never show logos larger than 140px wide.

## Pricing

### 3-Tier with Highlighted Middle
- Tiers: Starter / Pro (highlighted) / Enterprise. Pro card: 1px accent border,
  accent badge "Most Popular", elevation `md` (one level above neighbors),
  scale 1.02 on desktop.
- Feature rows: check icons in accent, 14px text, 32px row height.
- Price: 40px display, `-0.02em` tracking, period text 14px muted.

## FAQ

### Two-Column Accordion
- Left column: headline + subheadline + contact CTA (sticky on scroll).
- Right column: accordion items with 16px trigger, chevron rotating 180°,
  `max-height` transition 250ms ease-out, divider borders only (no boxes).

## Footer

### Mega Footer
- 4 link columns (14px, 1.5 line height) + brand column (logo, 2-line
  description, social icons). Bottom bar: copyright + legal links.
- Top border 1px `border` color; background `surface`.

## CTA Band

### Gradient Band
- Full-width band, subtle accent gradient (accent → secondary at 12%
  opacity), centered headline + subheadline + primary CTA button.
- Internal padding: 96px vertical on desktop, 64px mobile.
