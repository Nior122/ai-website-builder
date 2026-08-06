# Phase 4 — Professional Website Builder, Visual Editor & Generation Experience

## Overview

Phase 4 turns the generated website into an editable product: a professional
multi-page builder with themes, sections, navigation, forms, blog, SEO,
preview, exports, history, autosave, AI regeneration, and a quality gate —
the logic layer the editor UI consumes.

## Generation Workflow

`lib/builder/generation-workflow.ts` replaces the plain percentage with a
15-step professional dashboard flow:

```
✓ Understanding Business → ✓ Creating Brand Identity → ✓ Selecting Theme →
✓ Designing Layout → ✓ Building Home Page → ✓ Building About Page →
✓ Building Services → ✓ Building Contact → ✓ Creating Images → ✓ Writing Copy
→ ✓ Optimizing SEO → ✓ Performance Optimization → ✓ Accessibility Review →
✓ Quality Assurance → ✓ Website Ready
```

Every step emits `{ step, total, message, agent, model }` so the UI can show
the current task, the agent working, and the AI model in use. Live agent
progress from the Phase 3 orchestrator is mapped onto the workflow steps.

## What Gets Generated Automatically

A single "Generate Website" click produces a **complete multi-page project**:

- **Pages**: home, about, services, contact (+ privacy, terms, 404, coming
  soon are auto-added) — each with a section plan
- **Theme**: full token set (colors, typography, radii, spacing, motion,
  component styles) from the business type
- **Navigation & footer** built from the real pages
- **Copy** injected per section (hero headline, subheadline, CTAs, mission,
  vision, values, footer)
- **SEO** (title, description, keywords, schema) from the SEO agent
- **Forms** (contact + newsletter), **blog** scaffold, **media** library
  seeded with generated image prompts
- **Quality gate** — 12-point checklist with deterministic auto-repairs

## Visual Editor (logic layer)

`lib/builder/` implements every editor capability as immutable,
testable operations:

| Module | Capabilities |
|---|---|
| `section-operations.ts` | add, delete, duplicate, move up/down, drag-drop reorder, hide/show, lock/unlock, regenerate, copy/paste, save/insert templates |
| `page-operations.ts` | create, rename, delete, duplicate, reorder pages, set homepage, draft/published, page SEO |
| `theme-system.ts` | 19 instant-switch themes + style editor (colors, fonts, radius, motion, button/card/icon styles via `updateStyleToken`) |
| `component-library.ts` | 18 reusable components × 3 variants (buttons, cards, testimonials, pricing, forms, FAQs, navbar, footer, gallery, team, stats, timeline, badges, icons…) |
| `navigation-builder.ts` | logo, menus, dropdowns, sticky/transparent navbar, mobile menu, footer columns + social links |
| `forms-config.ts` | contact, newsletter, booking, appointment, quote, consultation, lead — validation, honeypot spam protection, success states |
| `blog-system.ts` | posts, categories, tags, author, search, related posts, featured, pagination |
| `seo-panel.ts` | title, description, keywords, OG, Twitter, canonical, schema, robots + validation |
| `media-manager.ts` | images, videos, icons, backgrounds, illustrations; upload/AI/stock sources; search |
| `preview-service.ts` | desktop/laptop/tablet/mobile, zoom, dark/light, fullscreen, refresh |
| `export-service.ts` | JSON, self-contained HTML, ZIP manifest, React scaffold, Next.js scaffold, Tailwind config |
| `history.ts` + `store.ts` | undo/redo (50 snapshots), version list, BuilderSession with autosave wiring |
| `autosave.ts` | debounced saves every few seconds + crash recovery (memory/localStorage adapters) |
| `regeneration.ts` | ✨ section-scoped AI regeneration (only the target section is rebuilt) |
| `quality-checks.ts` | 12-point pre-launch checklist with auto-repair |
| `project-builder.ts` | assembles the editable project from the Phase 3 agent blueprint |
| `generation-workflow.ts` | the 15-step live-progress generation flow |

## API Routes

- `POST /api/builder/export` — export a project (single format or all six)
- `POST /api/builder/regenerate` — regenerate one section (project + pageId + sectionId)

## UI Wiring Notes

The modules above are framework-agnostic and testable. The existing editor
components (features/editor) can consume them directly:

- Insert panel → `COMPONENT_LIBRARY` + `addSection`
- Properties panel → `updateSectionContent`, `updateStyleToken`
- Page tree → `page-operations`
- Preview iframe → `previewUrl(slug, previewState)` + `PREVIEW_DEVICES`
- Save button → `BuilderSession.apply()` (history + autosave)
- Generate button → `runGenerationWorkflow(brief, { onProgress })` driving
  the generation dashboard
- Theme picker → `BUILDER_THEMES` + `applyTheme`

## Quality Checklist (auto-repairing)

Pages exist · Navigation works · Footer works · CTAs work · Responsive
layouts · SEO complete · Alt text · Image dimensions (CLS) · No missing
images · No placeholder content · No broken links · No empty sections.

Deterministic repairs: broken nav links → home, missing CTA appended, empty
sections removed, alt text added, dimensions defaulted, SEO filled,
required pages added.

## Testing

`__tests__/api/builder/` — 4 suites + shared fixtures covering:

- Section ops (9 cases), page ops (10 cases)
- History (limit/undo/redo/clear), session, autosave (debounce, recovery,
  garbage handling, server localStorage = null)
- Quality checks (pass/repair/CTA/SEO), exports (JSON/HTML/ZIP/Tailwind/all),
  component library (18×3), themes (19 + switch + style edit), forms
  (validation/spam), blog (CRUD/search/related/pagination), SEO validation,
  section regeneration, and the full generation workflow (7+ pages, 15-step
  progress, industry-distinct themes)

## Files Added

- `lib/builder/` — 20 modules + barrel
- `app/api/builder/export/route.ts`, `app/api/builder/regenerate/route.ts`
- `__tests__/api/builder/` — fixtures + 4 suites
- `docs/PHASE4-BUILDER.md` — this document

## Recommendations for Phase 5

- Wire the builder modules into the editor UI components (see UI Wiring Notes)
- Persist BuilderProject snapshots to Postgres (projects table) + autosave
  drafts to the database instead of localStorage
- Add real AI regeneration through the OpenRouter provider using
  `buildRegenerationPrompt` when `AGENT_AI_ENABLED=true`
- Add the generation dashboard UI consuming `runGenerationWorkflow` progress
- Add export streaming for large projects (download via signed URL)
