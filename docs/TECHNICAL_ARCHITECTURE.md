# AI Website Builder Studio — Technical Architecture

## 1. System Overview

This document details the technical implementation architecture for AI Website Builder Studio. It covers every subsystem, their interactions, data flows, and implementation strategies.

---

## 2. Application Architecture

### 2.1 Next.js App Router Structure

```
app/
├── (marketing)/              # Public marketing pages (SSG)
│   ├── layout.tsx            # Marketing layout with nav/footer
│   ├── page.tsx              # Homepage
│   ├── pricing/page.tsx
│   ├── templates/page.tsx
│   ├── about/page.tsx
│   └── blog/
│       ├── page.tsx          # Blog listing (ISR)
│       └── [slug]/page.tsx   # Blog post (ISR)
│
├── (auth)/                   # Authentication pages
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   └── layout.tsx
│
├── (dashboard)/              # Authenticated dashboard
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Workspace overview
│   ├── projects/
│   │   ├── page.tsx          # Project listing
│   │   ├── new/page.tsx      # New project wizard
│   │   └── [id]/
│   │       ├── page.tsx      # Project overview
│   │       ├── editor/page.tsx    # Visual editor
│   │       ├── preview/page.tsx   # Live preview
│   │       ├── settings/page.tsx  # Project settings
│   │       ├── seo/page.tsx       # SEO settings
│   │       └── export/page.tsx    # Export options
│   ├── templates/
│   │   ├── page.tsx          # My templates
│   │   └── marketplace/page.tsx   # Template marketplace
│   ├── settings/
│   │   ├── page.tsx          # Account settings
│   │   ├── billing/page.tsx  # Billing & subscription
│   │   ├── team/page.tsx     # Team management
│   │   └── notifications/page.tsx
│   └── analytics/page.tsx
│
├── (admin)/                  # Admin panel
│   ├── layout.tsx            # Admin layout
│   ├── page.tsx              # Admin dashboard
│   ├── users/page.tsx
│   ├── subscriptions/page.tsx
│   ├── templates/page.tsx
│   ├── analytics/page.tsx
│   ├── logs/page.tsx
│   └── settings/page.tsx
│
├── api/                      # API routes
│   ├── ai/
│   │   ├── generate/route.ts       # Main generation endpoint
│   │   ├── stream/route.ts         # Streaming generation
│   │   ├── images/route.ts         # Image generation
│   │   └── blog/route.ts           # Blog generation
│   ├── projects/
│   │   ├── route.ts                # CRUD operations
│   │   ├── [id]/route.ts
│   │   ├── [id]/duplicate/route.ts
│   │   └── [id]/export/route.ts
│   ├── templates/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── webhooks/
│   │   ├── stripe/route.ts
│   │   └── clerk/route.ts
│   └── admin/
│       ├── users/route.ts
│       ├── analytics/route.ts
│       └── logs/route.ts
│
├── preview/
│   └── [projectId]/page.tsx  # Public preview page
│
├── deploy/
│   └── [projectId]/page.tsx  # Deployment status page
│
├── layout.tsx                # Root layout
├── loading.tsx               # Global loading state
├── error.tsx                 # Global error boundary
├── not-found.tsx             # 404 page
└── globals.css               # Global styles
```

### 2.2 Feature Module Structure

```
features/
├── auth/                     # Authentication feature
│   ├── components/
│   │   ├── AuthForm.tsx
│   │   ├── SocialLogin.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── services/
│   │   └── clerk.ts
│   └── types/
│       └── auth.types.ts
│
├── projects/                 # Project management feature
│   ├── components/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── NewProjectWizard.tsx
│   │   └── ProjectSettings.tsx
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   └── useProject.ts
│   ├── actions/
│   │   └── project.actions.ts
│   ├── services/
│   │   └── project.service.ts
│   ├── types/
│   │   └── project.types.ts
│   └── utils/
│       └── project.utils.ts
│
├── editor/                   # Visual editor feature
│   ├── components/
│   │   ├── Editor.tsx
│   │   ├── Canvas.tsx
│   │   ├── SectionToolbar.tsx
│   │   ├── PropertyPanel.tsx
│   │   ├── LayerPanel.tsx
│   │   ├── DragHandle.tsx
│   │   ├── DropZone.tsx
│   │   └── UndoRedo.tsx
│   ├── hooks/
│   │   ├── useEditor.ts
│   │   ├── useDragDrop.ts
│   │   ├── useHistory.ts
│   │   └── useAutoSave.ts
│   ├── services/
│   │   └── editor.service.ts
│   ├── types/
│   │   └── editor.types.ts
│   └── utils/
│       └── editor.utils.ts
│
├── ai-engine/                # AI generation feature
│   ├── components/
│   │   ├── GenerationPanel.tsx
│   │   ├── GenerationProgress.tsx
│   │   └── AIChat.tsx
│   ├── hooks/
│   │   └── useGeneration.ts
│   ├── services/
│   │   ├── intent.parser.ts
│   │   ├── brand.generator.ts
│   │   ├── content.writer.ts
│   │   ├── layout.designer.ts
│   │   ├── image.prompter.ts
│   │   ├── seo.optimizer.ts
│   │   ├── json.assembler.ts
│   │   └── validator.ts
│   ├── prompts/
│   │   ├── intent.parser.md
│   │   ├── brand.generator.md
│   │   ├── content.writer.md
│   │   └── seo.optimizer.md
│   ├── types/
│   │   └── ai-engine.types.ts
│   └── utils/
│       └── ai-engine.utils.ts
│
├── renderer/                 # JSON → React renderer
│   ├── components/
│   │   ├── ProjectRenderer.tsx
│   │   ├── PageRenderer.tsx
│   │   ├── SectionRenderer.tsx
│   │   └── ComponentRegistry.tsx
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── FAQSection.tsx
│   │   ├── GallerySection.tsx
│   │   ├── ContactSection.tsx
│   │   ├── BlogSection.tsx
│   │   ├── CTAT Section.tsx
│   │   ├── StatsSection.tsx
│   │   ├── TeamSection.tsx
│   │   ├── TimelineSection.tsx
│   │   └── [more sections]/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Form.tsx
│   │   └── [more components]/
│   ├── types/
│   │   └── renderer.types.ts
│   └── utils/
│       └── registry.ts
│
├── themes/                   # Theme engine
│   ├── components/
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   ├── GradientBuilder.tsx
│   │   ├── FontManager.tsx
│   │   └── ColorPicker.tsx
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── presets/
│   │   ├── minimal.ts
│   │   ├── luxury.ts
│   │   ├── corporate.ts
│   │   ├── modern.ts
│   │   ├── creative.ts
│   │   ├── glassmorphism.ts
│   │   └── neumorphism.ts
│   ├── types/
│   │   └── theme.types.ts
│   └── utils/
│       └── theme.utils.ts
│
├── export/                   # Export engine
│   ├── components/
│   │   ├── ExportPanel.tsx
│   │   └── ExportProgress.tsx
│   ├── hooks/
│   │   └── useExport.ts
│   ├── services/
│   │   ├── nextjs.exporter.ts
│   │   ├── react.exporter.ts
│   │   ├── html.exporter.ts
│   │   ├── zip.exporter.ts
│   │   └── markdown.exporter.ts
│   ├── templates/
│   │   ├── nextjs/
│   │   ├── react/
│   │   └── html/
│   ├── types/
│   │   └── export.types.ts
│   └── utils/
│       └── export.utils.ts
│
├── deployment/               # Deployment engine
│   ├── components/
│   │   ├── DeployPanel.tsx
│   │   └── DeployStatus.tsx
│   ├── hooks/
│   │   └── useDeployment.ts
│   ├── services/
│   │   ├── vercel.deployer.ts
│   │   ├── netlify.deployer.ts
│   │   ├── cloudflare.deployer.ts
│   │   └── github.deployer.ts
│   ├── types/
│   │   └── deployment.types.ts
│   └── utils/
│       └── deployment.utils.ts
│
├── seo/                      # SEO engine
│   ├── components/
│   │   ├── SEOPreview.tsx
│   │   ├── MetaEditor.tsx
│   │   └── SchemaEditor.tsx
│   ├── hooks/
│   │   └── useSEO.ts
│   ├── services/
│   │   ├── seo.generator.ts
│   │   ├── schema.generator.ts
│   │   ├── sitemap.generator.ts
│   │   └── robots.generator.ts
│   ├── types/
│   │   └── seo.types.ts
│   └── utils/
│       └── seo.utils.ts
│
├── blog/                     # Blog engine
│   ├── components/
│   │   ├── BlogEditor.tsx
│   │   ├── BlogPreview.tsx
│   │   └── BlogList.tsx
│   ├── hooks/
│   │   └── useBlog.ts
│   ├── services/
│   │   └── blog.generator.ts
│   ├── types/
│   │   └── blog.types.ts
│   └── utils/
│       └── blog.utils.ts
│
├── analytics/                # Analytics feature
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── TrafficChart.tsx
│   │   └── ConversionChart.tsx
│   ├── hooks/
│   │   └── useAnalytics.ts
│   ├── services/
│   │   └── analytics.service.ts
│   └── types/
│       └── analytics.types.ts
│
├── billing/                  # Billing feature
│   ├── components/
│   │   ├── PricingCards.tsx
│   │   ├── SubscriptionManager.tsx
│   │   ├── InvoiceList.tsx
│   │   └── CouponInput.tsx
│   ├── hooks/
│   │   └── useBilling.ts
│   ├── services/
│   │   └── stripe.service.ts
│   ├── types/
│   │   └── billing.types.ts
│   └── utils/
│       └── billing.utils.ts
│
├── collaboration/            # Team collaboration
│   ├── components/
│   │   ├── TeamManager.tsx
│   │   ├── InviteDialog.tsx
│   │   ├── CommentThread.tsx
│   │   └── ReviewMode.tsx
│   ├── hooks/
│   │   └── useCollaboration.ts
│   ├── services/
│   │   └── collaboration.service.ts
│   ├── types/
│   │   └── collaboration.types.ts
│   └── utils/
│       └── collaboration.utils.ts
│
├── templates/                # Template marketplace
│   ├── components/
│   │   ├── TemplateCard.tsx
│   │   ├── TemplateGallery.tsx
│   │   ├── TemplatePreview.tsx
│   │   └── CategoryFilter.tsx
│   ├── hooks/
│   │   └── useTemplates.ts
│   ├── services/
│   │   └── template.service.ts
│   ├── data/
│   │   ├── restaurant.ts
│   │   ├── hotel.ts
│   │   ├── gym.ts
│   │   ├── law-firm.ts
│   │   └── [more industries]/
│   ├── types/
│   │   └── template.types.ts
│   └── utils/
│       └── template.utils.ts
│
├── admin/                    # Admin panel
│   ├── components/
│   │   ├── AdminDashboard.tsx
│   │   ├── UserManagement.tsx
│   │   ├── SubscriptionOverview.tsx
│   │   ├── SystemLogs.tsx
│   │   └── FeatureFlags.tsx
│   ├── hooks/
│   │   └── useAdmin.ts
│   ├── services/
│   │   └── admin.service.ts
│   └── types/
│       └── admin.types.ts
│
└── notifications/            # Notifications
    ├── components/
    │   ├── NotificationBell.tsx
    │   └── NotificationList.tsx
    ├── hooks/
    │   └── useNotifications.ts
    ├── services/
    │   └── notification.service.ts
    └── types/
        └── notification.types.ts
```

---

## 3. Core Library Architecture

### 3.1 Library Modules

```
lib/
├── ai/
│   ├── client.ts             # Claude API client setup
│   ├── prompts.ts            # Prompt templates
│   ├── streaming.ts          # Streaming response handler
│   ├── structured-output.ts  # JSON schema enforcement
│   └── token-tracker.ts      # Token usage tracking
│
├── prisma/
│   ├── client.ts             # Prisma client singleton
│   └── extensions/
│       ├── soft-delete.ts    # Soft delete extension
│       └── audit-log.ts     # Audit logging extension
│
├── redis/
│   ├── client.ts             # Redis client setup
│   ├── cache.ts              # Cache utilities
│   ├── rate-limit.ts         # Rate limiting
│   └── queue.ts              # Job queue
│
├── s3/
│   ├── client.ts             # S3 client setup
│   ├── upload.ts             # File upload utilities
│   └── assets.ts             # Asset management
│
├── stripe/
│   ├── client.ts             # Stripe client setup
│   ├── subscriptions.ts      # Subscription management
│   └── webhooks.ts           # Webhook handling
│
├── validations/
│   ├── project.ts            # Project Zod schemas
│   ├── section.ts            # Section Zod schemas
│   ├── user.ts               # User Zod schemas
│   ├── template.ts           # Template Zod schemas
│   └── api.ts                # API request/response schemas
│
├── constants/
│   ├── plans.ts              # Subscription plan definitions
│   ├── limits.ts             # Usage limits per plan
│   ├── sections.ts           # Available section types
│   ├── themes.ts             # Theme presets
│   └── industries.ts         # Business industry categories
│
└── errors/
    ├── api-error.ts          # Custom API error classes
    ├── ai-error.ts           # AI generation errors
    └── validation-error.ts   # Validation error formatting
```

### 3.2 Middleware Stack

```
middleware/
├── auth.ts                   # Clerk authentication
├── rate-limit.ts             # Rate limiting middleware
├── security.ts               # Security headers
├── logging.ts                # Request logging
└── error-handler.ts          # Global error handling
```

---

## 4. Data Flow Diagrams

### 4.1 Website Generation Flow

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  User    │───▶│  API     │───▶│  AI       │───▶│  Redis   │
│  Input   │    │  Route   │    │  Engine   │    │  Queue   │
└─────────┘    └──────────┘    └───────────┘    └──────────┘
                                  │                   │
                                  ▼                   ▼
                            ┌───────────┐    ┌──────────┐
                            │  Claude   │    │  Worker  │
                            │  API      │    │  Process │
                            └───────────┘    └──────────┘
                                                  │
                                                  ▼
                                            ┌──────────┐
                                            │ Database │
                                            │ (Save)   │
                                            └──────────┘
                                                  │
                                                  ▼
                                            ┌──────────┐
                                            │ Stream   │
                                            │ Response │
                                            └──────────┘
```

### 4.2 Editor Save Flow

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Editor  │───▶│  Auto-   │───▶│  Validate │───▶│  Save    │
│  Change  │    │  Save    │    │  (Zod)    │    │  (DB)    │
└─────────┘    │  (2s)    │    └───────────┘    └──────────┘
               └──────────┘                          │
                                                     ▼
                                              ┌──────────┐
                                              │  Create  │
                                              │  Version │
                                              │  (Opt.)  │
                                              └──────────┘
```

### 4.3 Export Flow

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  User   │───▶│  Export  │───▶│  Format   │───▶│  Build   │
│  Select │    │  Config  │    │  Strategy │    │  Bundle  │
└─────────┘    └──────────┘    └───────────┘    └──────────┘
                                                  │
                                                  ▼
                                              ┌──────────┐
                                              │  Upload  │
                                              │  to S3   │
                                              └──────────┘
                                                  │
                                                  ▼
                                              ┌──────────┐
                                              │  Return  │
                                              │  URL     │
                                              └──────────┘
```

---

## 5. API Design

### 5.1 REST API Endpoints

```
POST   /api/ai/generate           # Generate website from description
POST   /api/ai/stream             # Stream generation progress
POST   /api/ai/images             # Generate image prompts
POST   /api/ai/blog               # Generate blog content

GET    /api/projects               # List user projects
POST   /api/projects               # Create new project
GET    /api/projects/:id           # Get project details
PUT    /api/projects/:id           # Update project
DELETE /api/projects/:id           # Delete project
POST   /api/projects/:id/duplicate # Duplicate project
POST   /api/projects/:id/export    # Export project

GET    /api/projects/:id/pages     # List pages
POST   /api/projects/:id/pages     # Create page
PUT    /api/projects/:id/pages/:pid # Update page
DELETE /api/projects/:id/pages/:pid # Delete page

POST   /api/projects/:id/deploy    # Deploy project
GET    /api/projects/:id/deploy    # Get deployment status

GET    /api/templates              # List templates
GET    /api/templates/:id          # Get template details
POST   /api/templates/:id/use      # Create project from template

POST   /api/webhooks/stripe        # Stripe webhook handler
POST   /api/webhooks/clerk         # Clerk webhook handler

# Admin endpoints
GET    /api/admin/users            # List all users
GET    /api/admin/analytics        # System analytics
GET    /api/admin/logs             # System logs
GET    /api/admin/subscriptions    # Subscription overview
```

### 5.2 Server Actions

```
# Project Actions
createProject(data: CreateProjectInput)
updateProject(id: string, data: UpdateProjectInput)
deleteProject(id: string)
duplicateProject(id: string)
archiveProject(id: string)
restoreProject(id: string)

# Page Actions
createPage(projectId: string, data: CreatePageInput)
updatePage(projectId: string, pageId: string, data: UpdatePageInput)
deletePage(projectId: string, pageId: string)
reorderPages(projectId: string, pageIds: string[])

# Section Actions
createSection(projectId: string, pageId: string, data: CreateSectionInput)
updateSection(projectId: string, pageId: string, sectionId: string, data: UpdateSectionInput)
deleteSection(projectId: string, pageId: string, sectionId: string)
moveSection(projectId: string, pageId: string, sectionId: string, targetIndex: number)
duplicateSection(projectId: string, pageId: string, sectionId: string)

# AI Actions
generateWebsite(description: string, options: GenerateOptions)
refineSection(projectId: string, pageId: string, sectionId: string, instruction: string)
generateBlogPost(projectId: string, topic: string)

# Export Actions
exportProject(projectId: string, format: ExportFormat)
downloadExport(exportId: string)

# Deployment Actions
deployProject(projectId: string, platform: DeployPlatform)
getDeploymentStatus(deploymentId: string)

# Team Actions
inviteMember(organizationId: string, email: string, role: MemberRole)
updateMemberRole(organizationId: string, memberId: string, role: MemberRole)
removeMember(organizationId: string, memberId: string)

# Billing Actions
createCheckoutSession(priceId: string)
createPortalSession()
applyCoupon(couponCode: string)
```

---

## 6. Type System

### 6.1 Core Types

```typescript
// ============= Project Types =============
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  businessType: string;
  industry: string;
  status: 'draft' | 'published' | 'archived';
  pages: Page[];
  globalStyles: GlobalStyles;
  seo: SEOConfig;
  settings: ProjectSettings;
  ownerId: string;
  organizationId: string | null;
  templateId: string | null;
  isPublished: boolean;
  publishedUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  sections: Section[];
  isPublished: boolean;
  order: number;
}

export interface Section {
  id: string;
  type: SectionType;
  layout: LayoutType;
  content: SectionContent;
  styles: SectionStyles;
  animations: Animation[];
  images: ImageConfig[];
  visibility: SectionVisibility;
  order: number;
}

// ============= Section Types =============
export type SectionType =
  | 'hero'
  | 'features'
  | 'services'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'gallery'
  | 'contact'
  | 'blog'
  | 'cta'
  | 'stats'
  | 'team'
  | 'timeline'
  | 'about'
  | 'mission'
  | 'values'
  | 'process'
  | 'portfolio'
  | 'newsletter'
  | 'video'
  | 'map'
  | 'accordion'
  | 'tabs'
  | 'divider'
  | 'spacer'
  | 'html';

export type LayoutType =
  | 'centered'
  | 'split'
  | 'image-left'
  | 'image-right'
  | 'full-width'
  | 'grid'
  | 'cards'
  | 'masonry'
  | 'carousel'
  | 'tabs'
  | 'accordion'
  | 'timeline';

// ============= Content Types =============
export interface SectionContent {
  [key: string]: unknown;
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: CTA;
  items?: ContentItem[];
  testimonials?: Testimonial[];
  faqs?: FAQ[];
  pricing?: PricingTeam[];
  stats?: Stat[];
  team?: TeamMember[];
  gallery?: GalleryItem[];
}

export interface CTA {
  text: string;
  url: string;
  style: 'primary' | 'secondary' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg';
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  url?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating?: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface PricingTeam {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  highlighted: boolean;
  cta: string;
}

// ============= Theme Types =============
export interface Theme {
  name: string;
  mode: 'light' | 'dark' | 'system';
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: AnimationConfig;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  gradient: {
    from: string;
    via?: string;
    to: string;
  };
}

export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

// ============= AI Types =============
export interface GenerateRequest {
  description: string;
  industry: string;
  businessType: string;
  tone: 'professional' | 'casual' | 'luxury' | 'creative' | 'corporate';
  features: string[];
  pages: string[];
  templateId?: string;
}

export interface GenerateResponse {
  projectId: string;
  stream: ReadableStream<GenerationEvent>;
}

export interface GenerationEvent {
  type: 'progress' | 'section' | 'page' | 'complete' | 'error';
  data: unknown;
}

// ============= Export Types =============
export type ExportFormat = 'nextjs' | 'react' | 'html' | 'tailwind' | 'zip' | 'markdown' | 'pdf' | 'json';

export interface ExportConfig {
  format: ExportFormat;
  options: {
    includeImages: boolean;
    includeStyles: boolean;
    minify: boolean;
    typescript: boolean;
    tailwind: boolean;
  };
}

// ============= Deployment Types =============
export type DeployPlatform = 'vercel' | 'netlify' | 'cloudflare' | 'github-pages' | 'docker';

export interface Deployment {
  id: string;
  projectId: string;
  platform: DeployPlatform;
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
  url: string | null;
  buildLog: string[];
  createdAt: Date;
  completedAt: Date | null;
}
```

---

## 7. Error Handling Strategy

### 7.1 Error Hierarchy

```typescript
// Base application error
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// AI-specific errors
class AIGenerationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'AI_GENERATION_ERROR', 500, metadata);
  }
}

class AITokenLimitError extends AIGenerationError {
  constructor(used: number, limit: number) {
    super(`Token limit exceeded: ${used}/${limit}`, { used, limit });
  }
}

// Validation errors
class ValidationError extends AppError {
  constructor(errors: ZodError) {
    super('Validation failed', 'VALIDATION_ERROR', 400, {
      errors: errors.format()
    });
  }
}

// Authorization errors
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}
```

### 7.2 Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    timestamp: string;
  };
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

---

## 8. Testing Strategy

### 8.1 Test Pyramid

```
           ┌─────────┐
           │  E2E    │  10% - Playwright
           │  Tests  │  Critical user flows
          ┌┴─────────┴┐
          │ Integration│  30% - Vitest + MSW
          │ Tests      │  API routes, DB queries
         ┌┴────────────┴┐
         │  Unit Tests   │  60% - Vitest
         │  Pure logic   │  Utils, services, hooks
         └───────────────┘
```

### 8.2 Test Organization

```
tests/
├── unit/
│   ├── utils/
│   ├── services/
│   └── hooks/
├── integration/
│   ├── api/
│   ├── db/
│   └── ai/
├── e2e/
│   ├── auth.spec.ts
│   ├── editor.spec.ts
│   ├── generation.spec.ts
│   ├── export.spec.ts
│   └── deployment.spec.ts
└── fixtures/
    ├── projects.ts
    ├── users.ts
    └── templates.ts
```

---

## 9. Environment Configuration

```typescript
// Environment variables organized by category
// .env.example

# ============= Database =============
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# ============= Redis =============
REDIS_URL="redis://..."

# ============= Authentication (Clerk) =============
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# ============= AI (Anthropic) =============
ANTHROPIC_API_KEY="sk-ant-..."

# ============= AI (OpenAI - Images) =============
OPENAI_API_KEY="sk-..."

# ============= Payments (Stripe) =============
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ============= Storage (S3/R2) =============
S3_BUCKET="..."
S3_REGION="..."
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_ENDPOINT="..."

# ============= Deployment =============
VERCEL_TOKEN="..."
NETLIFY_AUTH_TOKEN="..."

# ============= Monitoring =============
SENTRY_DSN="..."
POSTHOG_KEY="..."

# ============= App =============
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="AI Website Builder Studio"
```

---

## 10. Build & Deployment Pipeline

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

This technical architecture provides the complete blueprint for building the AI Website Builder Studio. Each decision is documented with its rationale, and the system is designed for production-scale reliability, performance, and maintainability.
