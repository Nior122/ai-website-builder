# Phase 3 — Multi-Agent AI Website Builder System

## Architecture

The AI website generator is now a multi-agent platform. One model never
handles every responsibility. Twelve specialized agents collaborate through a
shared project context, coordinated by a central orchestrator.

```
User Prompt
    ↓
Agent Orchestrator (lib/agents/orchestrator.ts)
    ↓
┌────────────────────────────────────────────────────────────┐
│  Shared Project Context (lib/agents/context.ts)            │
│  business · brand · ux · ui · copy · images · seo          │
│  frontend · accessibility · performance · security · qa    │
└────────────────────────────────────────────────────────────┘
    ↓
12 Specialized Agents → Website Blueprint → Validation → Final Website
```

## The Agents

| # | Agent | Output key | Responsibility |
|---|-------|-----------|----------------|
| 1 | Business Analyst | `business` | Industry, audience, problems, products, services, goals, competitors, USP |
| 2 | Brand Identity | `brand` | Personality, colors, typography, direction, logo concept, image style, voice |
| 3 | UX Strategist | `ux` | User journey, hierarchy, conversion flow, page structure, section order |
| 4 | UI Design | `ui` | Layout patterns, components, grid, spacing, animation, interactions |
| 5 | Copywriting | `copy` | Hero, services, features, benefits, FAQs, testimonials, about, CTA, footer |
| 6 | Image Direction | `images` | Hero/gallery/service/team/background prompts + icons — one unified style |
| 7 | SEO | `seo` | Meta title/description, keywords, OG, Twitter, schema, sitemap, recommendations |
| 8 | Frontend Architect | `frontend` | Component architecture, folder structure, performance patterns |
| 9 | Accessibility | `accessibility` | Semantic HTML, keyboard, ARIA, contrast, headings, reduced motion |
| 10 | Performance | `performance` | Images, bundles, loading, caching, rendering, Core Web Vitals |
| 11 | Security | `security` | Auth, API exposure, secrets, input validation, data handling, deps |
| 12 | QA | `qa` | Pages, sections, links, CTAs, forms, responsiveness, placeholders, errors |

## How Agents Communicate

Agents never work independently. The orchestrator creates one
`ProjectContext` per request; each agent reads the outputs of its declared
dependencies (`AGENT_META[id].dependencies`) and writes its own output to a
typed key. Example chain:

```
Business Agent: business_context
    ↓
Brand Agent: business_context + brand_rules
    ↓
UX Agent: brand_rules + business_context
    ↓
Frontend Agent: complete blueprint
```

## Failure Handling

When an agent fails (throw or failed validation):

1. **Retry once** — the orchestrator re-runs the agent (`status: retrying`).
2. **Repair via fallback** — if the retry fails, the agent's deterministic
   `fallback(context)` output is used (`status: fallback`, `usedFallback`).
3. **Continue** — the workflow never stops; downstream agents consume the
   recovered output.

## Model Management

Everything is environment-driven — nothing hardcoded:

```bash
PRIMARY_MODEL=openrouter/free
FALLBACK_MODELS=inclusionai/ling-3.0-flash:free,cohere/north-mini-code:free
AGENT_AI_ENABLED=false          # deterministic engine by default
AGENT_TIMEOUT_MS=120000
AGENT_COPY_MODEL=<override>     # per-agent model override
```

`lib/agents/models.ts` resolves: per-agent override → primary → fallbacks.
Without an API key the system runs on the deterministic engine (Phase 2
design tokens, theme generator, copywriter, validators).

## Progress Tracking

`lib/agents/progress.ts` emits human-readable checkpoints (not
percentage-only):

```
Understanding business...      →  ✓ Understanding business
Creating brand identity...     →  ✓ Creating brand
Designing the user experience… →  ✓ Designing experience
Crafting the visual system...  →  ✓ Crafting visual system
Writing conversion-focused copy… → ✓ Writing content
...
Running final quality checks... → ✓ Running quality checks
```

## Logging

`lib/agents/logger.ts` produces structured logs per agent:

```
[Business Analyst] Starting...
[Business Analyst] ✓ Completed in 12ms
[Copywriting] Attempt 1 failed — retrying. (...)
[Copywriting] Using deterministic fallback output.
```

Secrets are never logged — only agent id, status, duration, model, and
sanitized messages.

## Admin Dashboard

`GET /api/agents/executions` (backed by `lib/agents/execution-store.ts`)
exposes the last 200 agent executions: agent, status, duration, model,
attempts, error, fallback usage. Consumers (a future admin UI or ops tooling)
can poll this endpoint.

## Files Added

- `lib/agents/types.ts` — agent ids, statuses, metadata, output contracts
- `lib/agents/context.ts` — shared project context (agent memory)
- `lib/agents/base.ts` — `Agent` base class + validation helpers
- `lib/agents/registry.ts` — default 12-agent roster
- `lib/agents/models.ts` — env-driven model management
- `lib/agents/progress.ts` — checkpoint progress tracker
- `lib/agents/logger.ts` — structured agent logging
- `lib/agents/orchestrator.ts` — orchestrator + website-blueprint assembly
- `lib/agents/execution-store.ts` — admin execution log
- `lib/agents/agents/*.ts` — the 12 agents
- `lib/agents/index.ts` — barrel
- `app/api/agents/executions/route.ts` — admin API
- `__tests__/api/agents/orchestrator.test.ts` — full test suite

## Test Coverage

- Full 12-agent workflow with shared context (all outputs present, order
  matches `AGENT_ORDER`)
- Retry: a flaky agent succeeds on attempt 2
- Fallback: an always-failing agent recovers via deterministic fallback and
  the workflow continues
- Progress checkpoints emitted for every stage
- 10-industry differentiation acceptance test (≥8 distinct design languages)
- Website blueprint assembly
- Model management (env parsing, per-agent overrides, defaults)
- Execution store record/list

## Recommendations for Phase 4

- Wire the blueprint into the live generation flow (post-process
  `runGenerationPipeline` with `toWebsiteBlueprint` output)
- Add real AI calls per agent via `AGENT_AI_ENABLED=true` using the
  OpenRouter provider and per-stage prompts
- Persist executions to the database instead of in-memory for long-lived
  admin history
- Add an admin UI page consuming `/api/agents/executions`
