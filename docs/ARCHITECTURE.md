# AI Website Builder Studio — System Architecture

## Overview

AI Website Builder Studio is a production-ready SaaS platform that converts plain English business descriptions into fully functional, professional websites. The system uses a JSON-first architecture where AI generates structured data, and a React renderer converts it into production-quality components.

---

## 1. Architectural Principles

### 1.1 JSON-First Generation
- **Never generate raw HTML.** All AI output is structured JSON.
- JSON is validated, versioned, and diffable.
- The React renderer converts JSON → components at render time.
- Enables multi-format export (Next.js, React, HTML, etc.).

### 1.2 Feature-Based Architecture
- Code is organized by **domain feature**, not by technical layer.
- Each feature is self-contained: components, hooks, services, types, utils.
- Features communicate through well-defined interfaces.

### 1.3 Server-First with Client Enhancement
- Next.js App Router with Server Components by default.
- Client components only where interactivity requires it (editor, preview).
- Streaming and Suspense for progressive loading.

### 1.4 Edge-First Performance
- Middleware runs at the edge for auth, rate limiting, and routing.
- Static generation for marketing pages.
- ISR for template gallery and blog.
- Dynamic rendering for editor and preview.

### 1.5 Defense in Depth Security
- Clerk for authentication (JWT-based).
- Middleware-level CSRF/XSS protection.
- Input validation at every boundary.
- CSP headers enforced.
- Rate limiting per user and per IP.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│  Next.js App Router (Server + Client Components)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Dashboard │ │  Editor  │ │ Preview  │ │  Admin   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│                    MIDDLEWARE LAYER                       │
│  Auth │ Rate Limit │ CSRF │ CSP │ Logging               │
├─────────────────────────────────────────────────────────┤
│                    API / ACTION LAYER                     │
│  Server Actions │ API Routes │ Webhooks                  │
├─────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                          │
│  AI Engine │ Export Engine │ Deploy Engine │ SEO Engine  │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                             │
│  Prisma ORM │ PostgreSQL │ Redis Cache │ S3 Storage      │
├─────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                      │
│  Claude API │ Stripe │ Clerk │ Vercel │ Netlify          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Core Subsystems

### 3.1 AI Generation Pipeline

The AI pipeline is the heart of the system. It transforms a user's plain-English description into a complete website through a multi-stage process:

```
User Input (plain English)
    │
    ▼
┌─────────────────┐
│  Intent Parser   │  Extracts: business type, industry, tone, features
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Brand Generator  │  Colors, typography, voice, personality
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Content Writer   │  Headlines, copy, descriptions, FAQs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Layout Designer  │  Section order, grid system, responsive
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Image Prompter   │  DALL-E, Flux, Midjourney prompts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SEO Optimizer    │  Meta tags, schema, sitemap
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JSON Assembler   │  Combines all outputs into project JSON
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validator       │  Schema validation + quality checks
└─────────────────┘
```

**Why this order:** Each stage builds on the previous. Brand informs content tone. Layout depends on content length. SEO needs both content and structure. Validation catches errors before rendering.

### 3.2 JSON Project Schema

Every generated website is a single JSON document:

```typescript
interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  businessType: string;
  industry: string;
  theme: Theme;
  pages: Page[];
  globalStyles: GlobalStyles;
  seo: SEOConfig;
  settings: ProjectSettings;
  versions: Version[];
  createdAt: Date;
  updatedAt: Date;
}

interface Page {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  sections: Section[];
  isPublished: boolean;
}

interface Section {
  id: string;
  type: SectionType;    // hero, features, pricing, etc.
  layout: LayoutType;   // centered, split, grid, etc.
  content: Content;
  styles: SectionStyles;
  animations: Animation[];
  images: ImageConfig[];
  order: number;
}

interface SectionContent {
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: CTA;
  items?: ContentItem[];
  testimonials?: Testimonial[];
  faqs?: FAQ[];
  pricing?: PricingTier[];
  // ... more content types
}
```

**Why JSON over direct rendering:** JSON is diffable, versionable, serializable, and exportable to any framework. It enables undo/redo, collaboration, and multi-format output.

### 3.3 Visual Editor Architecture

The editor uses a state-machine pattern:

```
┌─────────────────────────────────────┐
│           Editor State               │
│  ┌─────────┐  ┌─────────────────┐  │
│  │ History  │  │ Current State   │  │
│  │ Stack    │  │ (Project JSON)  │  │
│  └─────────┘  └─────────────────┘  │
│  ┌─────────┐  ┌─────────────────┐  │
│  │ Redo     │  │ Selection       │  │
│  │ Stack    │  │ State           │  │
│  └─────────┘  └─────────────────┘  │
├─────────────────────────────────────┤
│         Component Layer              │
│  DragHandle │ DropZone │ Properties │
├─────────────────────────────────────┤
│         Rendering Layer              │
│  JSON → React Component Tree        │
└─────────────────────────────────────┘
```

**Key decisions:**
- **Optimistic updates** for instant feedback.
- **Debounced auto-save** (2s delay) to reduce API calls.
- **Immutable state** for reliable undo/redo.
- **Section-level granularity** for drag-and-drop operations.

### 3.4 Export Engine Architecture

```
Project JSON
    │
    ├──→ Next.js Export (App Router + Tailwind)
    ├──→ React Export (CRA compatible)
    ├──→ Static HTML Export
    ├──→ Tailwind Config Export
    ├──→ ZIP Bundle
    ├──→ Markdown Documentation
    └──→ PDF Documentation
```

**Why multiple formats:** Different users have different deployment targets. A restaurant owner might want simple HTML. A developer wants Next.js. An agency wants a ZIP to hand off.

### 3.5 Deployment Architecture

```
User clicks "Deploy"
    │
    ▼
┌─────────────────┐
│ Build Pipeline   │  Optimize, minify, generate assets
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Vercel  │ │Netlify │  ... other targets
└────────┘ └────────┘
    │         │
    ▼         ▼
┌─────────────────┐
│  DNS + SSL       │  Automatic certificate provisioning
└─────────────────┘
```

---

## 4. Technology Stack

### 4.1 Core Framework
| Technology | Purpose | Why |
|---|---|---|
| Next.js 15 (App Router) | Full-stack framework | Server Components, streaming, edge runtime, file-based routing |
| React 19 | UI library | Server Components, Actions, improved Suspense |
| TypeScript 5 | Type safety | End-to-end type safety, better DX |
| Tailwind CSS 4 | Styling | Utility-first, zero-runtime, excellent DX |

### 4.2 Data Layer
| Technology | Purpose | Why |
|---|---|---|
| PostgreSQL | Primary database | ACID, JSON support, full-text search, mature ecosystem |
| Prisma ORM | Database access | Type-safe queries, migrations, schema management |
| Redis | Caching + sessions | Fast reads, pub/sub for collaboration, rate limiting |
| AWS S3 / Cloudflare R2 | Asset storage | Images, exports, backups |

### 4.3 Authentication & Authorization
| Technology | Purpose | Why |
|---|---|---|
| Clerk | Authentication | JWT, social login, MFA, organizations, RBAC |
| Custom RBAC | Authorization | Fine-grained permissions for teams |

### 4.4 AI Services
| Technology | Purpose | Why |
|---|---|---|
| Claude API (Anthropic) | Content generation | Best reasoning, structured output, long context |
| OpenAI DALL-E 3 | Image generation | High quality, API access |
| Flux / Replicate | Image generation | Alternative, cost-effective |

### 4.5 Payments
| Technology | Purpose | Why |
|---|---|---|
| Stripe | Payments | Industry standard, subscriptions, invoicing |
| Stripe Webhooks | Event handling | Real-time subscription updates |

### 4.6 Infrastructure
| Technology | Purpose | Why |
|---|---|---|
| Vercel | Hosting + Edge | Native Next.js support, edge functions |
| GitHub Actions | CI/CD | Automated testing, deployment |
| Sentry | Error tracking | Real-time error monitoring |
| PostHog | Analytics | Product analytics, feature flags |

---

## 5. Database Schema Overview

### Core Entities

```
User ──┬── Organization (many-to-many via Membership)
       ├── Project (one-to-many)
       ├── Template (one-to-many)
       └── Notification (one-to-many)

Organization ──┬── Membership (one-to-many)
               ├── Project (one-to-many)
               └── Invitation (one-to-many)

Project ──┬── Page (one-to-many)
          ├── Version (one-to-many)
          ├── Export (one-to-many)
          ├── Comment (one-to-many)
          └── Analytics (one-to-many)

Page ──────── Section (one-to-many)

Section ───── Component (one-to-many)

Template ──── Component (one-to-many)

Subscription ── Invoice (one-to-many)
```

### Key Design Decisions

1. **Organizations for team collaboration** — Not just individual users. Supports agencies and teams.
2. **Version history on Project** — Every save creates an optional version snapshot. Enables undo and comparison.
3. **Sections as first-class entities** — Sections are stored in the database, not just in JSON blobs. Enables section-level operations and reuse.
4. **Templates as shareable entities** — Templates are projects with a `isTemplate` flag and marketplace metadata.

---

## 6. Security Architecture

### 6.1 Authentication Flow
```
Request → Clerk Middleware → JWT Validation → User Context → Route Handler
```

### 6.2 Authorization Matrix
| Resource | Owner | Editor | Viewer | Public |
|---|---|---|---|---|
| Project | CRUD | RU | R | - |
| Page | CRUD | CRUD | R | Published only |
| Section | CRUD | CRUD | R | - |
| Template | CRUD | R | R | R (listed) |
| Settings | CRUD | R | - | - |
| Billing | CRUD | - | - | - |

### 6.3 Security Headers
- `Content-Security-Policy`: Strict policy for inline scripts
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: camera=(), microphone=(), geolocation=()

### 6.4 Rate Limiting
- Anonymous: 10 requests/minute
- Free tier: 60 requests/minute
- Pro tier: 300 requests/minute
- Enterprise: Custom

### 6.5 Input Validation
- Zod schemas at every API boundary
- Sanitization of user-generated content
- File upload validation (type, size, content)
- SQL injection prevention via Prisma parameterized queries

---

## 7. Performance Strategy

### 7.1 Rendering Strategy
| Page | Strategy | Why |
|---|---|---|
| Marketing pages | Static (SSG) | No dynamic data, instant load |
| Template gallery | ISR (60s) | Changes infrequently, cacheable |
| Blog | ISR (300s) | SEO critical, moderate update frequency |
| Dashboard | CSR + Suspense | User-specific, needs interactivity |
| Editor | CSR | Heavy interactivity, real-time |
| Preview | Streaming SSR | Progressive loading, SEO for previews |

### 7.2 Caching Strategy
- **Edge cache** for static assets (immutable with hash)
- **CDN cache** for ISR pages (stale-while-revalidate)
- **Redis cache** for session data and rate limiting
- **React cache()** for request-level deduplication
- **SWR** for client-side data fetching

### 7.3 Bundle Optimization
- Code splitting by route
- Dynamic imports for heavy components (editor, preview)
- Tree shaking for unused exports
- Image optimization via next/image
- Font optimization via next/font

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling
- Stateless server components (no server-side sessions)
- Redis for shared state
- Database connection pooling via Prisma
- Edge functions for middleware (auto-scaling)

### 8.2 AI Generation Scaling
- Queue-based generation (BullMQ + Redis)
- Streaming responses for perceived performance
- Rate limiting per user tier
- Token budget tracking
- Fallback models for high load

### 8.3 Storage Scaling
- S3/R2 for assets (unlimited scale)
- Database partitioning for analytics
- CDN for global asset delivery

---

## 9. Monitoring & Observability

### 9.1 Metrics
- Request latency (p50, p95, p99)
- AI generation time
- Error rates by endpoint
- Active users (DAU/MAU)
- AI token consumption
- Storage usage
- Export/deploy success rates

### 9.2 Logging
- Structured JSON logging
- Request ID correlation
- Error stack traces
- Audit log for sensitive operations

### 9.3 Alerting
- Error rate spikes
- Latency degradation
- AI API failures
- Payment processing errors
- Storage quota warnings

---

## 10. Development Workflow

### 10.1 Branch Strategy
- `main` → Production
- `develop` → Staging
- `feature/*` → Feature branches
- `hotfix/*` → Emergency fixes

### 10.2 CI/CD Pipeline
```
Push → Lint → Type Check → Unit Tests → Integration Tests → Build → Deploy
```

### 10.3 Quality Gates
- TypeScript strict mode (no `any`)
- 80% unit test coverage
- No critical security vulnerabilities
- Lighthouse score > 90
- Bundle size budget (500KB initial)

---

## 11. Cost Estimation

### Monthly costs at 10K users:
| Service | Cost |
|---|---|
| Vercel Pro | $20/month |
| PostgreSQL (Supabase) | $25/month |
| Redis (Upstash) | $10/month |
| Clerk | $25/month |
| Claude API | ~$500/month (varies) |
| Stripe | 2.9% + $0.30/txn |
| S3/R2 | ~$5/month |
| Sentry | $26/month |
| PostHog | Free tier |
| **Total** | **~$611/month** |

### Per-user cost: ~$0.06/month
### Break-even at ~$3/user/month (Free tier drives acquisition)

---

## Appendix A: File Structure Overview

```
ai-website-builder/
├── app/                    # Next.js App Router pages
├── components/             # Shared UI components
├── features/               # Feature-based modules
├── services/               # External service integrations
├── hooks/                  # Custom React hooks
├── actions/                # Server Actions
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── styles/                 # Global styles and theme
├── middleware/             # Next.js middleware
├── lib/                    # Core library code
├── api/                    # API route handlers
├── prisma/                 # Database schema and migrations
├── tests/                  # Test files
├── docs/                   # Documentation
└── public/                 # Static assets
```

## Appendix B: Key Design Patterns

1. **Repository Pattern** — Database access abstracted behind service interfaces
2. **Strategy Pattern** — Export engine uses strategies for different output formats
3. **Observer Pattern** — Real-time collaboration via WebSocket events
4. **Command Pattern** — Editor actions (undo/redo) as reversible commands
5. **Factory Pattern** — AI engine creates different section types via factories
6. **Pipe Pattern** — AI generation pipeline as composable stages
