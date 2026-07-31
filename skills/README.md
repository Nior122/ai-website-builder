# Skills

Professional design, copywriting, and frontend skills installed into the AI
generation engine. Managed by `lib/skills/` (registry + skill manager) and
consumed by the design pipeline in `lib/ai/design-pipeline/`.

| Skill | Purpose | Files |
|---|---|---|
| `frontend-design` | Professional layouts, spacing, grids, hierarchy, responsive composition | SKILL.md, LICENSE.txt |
| `premium-web-design` | Premium UI patterns, landing pages, hero layouts, SaaS polish | SKILL.md, references/landing-page-patterns.md |
| `emil-kowalski` | Modern interaction design, component architecture, animation inspiration | SKILL.md, references/animation-vocabulary.md |
| `impeccable` | Modern CSS, spacing systems, typography, consistency, craft | SKILL.md, agents/, reference/ (152 files) |
| `design-taste-frontend` | Visual taste, color harmony, typography, rhythm, consistency | SKILL.md |
| `gpt-taste` | UI/UX judgement, critiques, hierarchy, composition, refinement | SKILL.md |
| `copy-editing` | Marketing copy, landing copy, CTAs, headlines, plain English | SKILL.md, references/plain-english-alternatives.md |
| `frontend-patterns` | Performance, reusable components, accessibility, modern patterns | SKILL.md, references/patterns.md |

Enable/disable via `SKILLS_ENABLED` and `SKILL_<NAME>_ENABLED` env vars.
See `docs/PHASE2-SKILLS.md` for the full guide.
