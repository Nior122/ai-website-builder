# frontend-patterns

**Name:** frontend-patterns  
**Version:** 1.0.0  
**Author:** AI Website Builder Studio  
**Source:** Authored in-house (synthesis of established frontend best practices)

---

## Purpose

Performance, reusable components, accessibility, and modern coding patterns
for generated websites. Guarantees generated output is fast, accessible, and
maintainable — not just pretty.

## When To Use

- Validating generated sections for performance and accessibility
- Choosing component structure for section content
- Adding interaction patterns (nav, accordion, carousel, forms)
- Auditing generated HTML for semantic correctness

## Core Principles

1. **Semantic HTML first.** Use `header`, `nav`, `main`, `section`, `article`,
   `footer`, `ul/ol` for lists, `button` for actions, `a` for navigation.
   Never use `div` where a semantic element exists.
2. **Accessibility is non-negotiable.**
   - Heading hierarchy: exactly one `h1` per page; no skipped levels.
   - Every `img` has descriptive `alt`; decorative images use `alt=""`.
   - Every form control has a visible `<label>` (or `aria-label`).
   - Focus states: 2px outline with 3:1 contrast against adjacent colors.
   - `prefers-reduced-motion: reduce` disables non-essential animation.
   - Color contrast: WCAG 2.1 AA — 4.5:1 text, 3:1 UI components.
3. **Performance budgets.**
   - Lazy-load images below the fold (`loading="lazy"`, `decoding="async"`).
   - No layout shift: reserve aspect ratios via `aspect-ratio` CSS or width/
     height attributes.
   - Avoid re-rendering entire sections on interaction; update only the
     affected subtree.
   - Keep initial JS per page under 170KB gzipped.
4. **Reusable components.** Any section content rendered more than once on a
   page must be a single component with props. No copy-pasted markup.
5. **Modern CSS.** Use CSS custom properties for theme tokens; `clamp()` for
   fluid type; `grid`/`flex` for layout; `color-mix()` for derived colors.
   Avoid pixel-pushing with magic numbers.
6. **Keyboard navigation.** All interactive elements reachable via Tab in a
   logical order; skip-to-content link at the top of every page; focus is
   managed when opening/closing dialogs and menus.
7. **Form patterns.** Native validation first (`required`, `minlength`, `type`);
   error messages linked via `aria-describedby`; submit buttons disabled only
   while pending, with visible pending state.

## Reference Patterns

See `references/patterns.md` for component blueprints: navbar, accordion,
carousel, tabs, forms, cards, and their accessibility notes.

## Output Contract

Generated section markup MUST include:

- `aria-label` on landmark sections (`nav`, `main` wrappers, `section[aria-labelledby]`)
- Focus-visible styles declared in the theme tokens
- Reduced-motion override for any animation token
- `loading="lazy"` on all non-hero images

## Verification Checklist

- [ ] Exactly one `h1` per page
- [ ] No skipped heading levels
- [ ] All images have alt text
- [ ] Form controls have labels
- [ ] Contrast ≥ 4.5:1 for text
- [ ] Focus states visible
- [ ] Images below fold lazy-loaded
- [ ] No layout shift from images/media
- [ ] Reduced-motion respected
