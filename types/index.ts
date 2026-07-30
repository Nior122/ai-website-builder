// =============================================================================
// AI Website Builder Studio — Master Type Definitions
// =============================================================================
// This file exports all types used across the application.
// Organized by domain for discoverability and maintainability.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  businessType: string;
  industry: string;
  status: ProjectStatus;
  pages: Page[];
  globalStyles: GlobalStyles;
  seo: SEOConfig;
  settings: ProjectSettings;
  ownerId: string;
  organizationId: string | null;
  templateId: string | null;
  // Delivery — match the Prisma `Project` model exactly. `status` is the
  // single source of truth for published-state; `publishedAt` records when it
  // last went live; `customDomain` is set later (Phase 12); `thumbnailUrl` is
  // the dashboard card image. The earlier ghost fields `isPublished` /
  // `publishedUrl` / `favicon` / `ogImage` were never backed by DB columns and
  // are removed (favicon/ogImage now live in `ProjectSettings` / `SEOConfig`).
  customDomain: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  language: string;
  direction: 'ltr' | 'rtl';
  favicon: string | null;
  customCss: string | null;
  customHead: string | null;
  analyticsId: string | null;
  passwordProtection: boolean;
  passwordHash: string | null;
  maintenanceMode: boolean;
}

/** Global styles JSON — flexible config stored per-project. */
export type GlobalStyles = Record<string, unknown>;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Page {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  // `ogImage` and `isPublished` were never backed by the Prisma `Page` model
  // and are removed. Per-page OG imagery can be stored in the `settings` JSON
  // column if needed later; publish-state is a project-level concern (`Project.status`).
  sections: Section[];
  isHome: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageInput {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  isHome?: boolean;
  order?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

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
  | 'html'
  | 'checkout'
  | 'booking'
  | 'appointment'
  | 'terms'
  | 'privacy'
  | '404'
  | 'coming-soon'
  | 'landing'
  | 'sales';

export type LayoutType =
  | 'centered'
  | 'split'
  | 'image-left'
  | 'image-right'
  | 'full-width'
  | 'grid-2'
  | 'grid-3'
  | 'grid-4'
  | 'cards'
  | 'masonry'
  | 'carousel'
  | 'tabs'
  | 'accordion'
  | 'timeline'
  | 'columns-2'
  | 'columns-3';

export interface Section {
  id: string;
  pageId: string;
  type: SectionType;
  layout: LayoutType;
  content: SectionContent;
  styles: SectionStyles;
  animations: Animation[];
  images: ImageConfig[];
  visibility: SectionVisibility;
  order: number;
  isLocked: boolean;
  customId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionVisibility {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
}

export interface SectionStyles {
  padding: SpacingValue;
  margin: SpacingValue;
  backgroundColor: string | null;
  backgroundImage: string | null;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  borderRadius: string | null;
  boxShadow: string | null;
  border: string | null;
  opacity: number;
  overflow: string;
  customClass: string | null;
  customCss: string | null;
  maxWidth: string | null;
  textAlign: 'left' | 'center' | 'right';
  animation: AnimationType | null;
}

export interface SpacingValue {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

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
  blog?: BlogPreview[];
  form?: FormData;
  video?: VideoConfig;
  map?: MapConfig;
  html?: string;
}

export interface CTA {
  text: string;
  url: string;
  style: CTAStyle;
  size: 'sm' | 'md' | 'lg';
  icon?: string;
  openInNewTab: boolean;
}

export type CTAStyle = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  url?: string;
  badge?: string;
  highlight?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating?: number;
  featured: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
}

export interface PricingTeam {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  period: 'monthly' | 'yearly' | 'one-time';
  features: PricingFeature[];
  highlighted: boolean;
  cta: string;
  badge?: string;
}

export interface PricingFeature {
  text: string;
  included: boolean;
  icon?: string;
}

export interface Stat {
  id: string;
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  social?: SocialLinks;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category?: string;
  width?: number;
  height?: number;
}

export interface BlogPreview {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  image?: string;
  category?: string;
  date: string;
  readTime?: string;
  author?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FormType = 'contact' | 'booking' | 'reservation' | 'quote' | 'job' | 'support' | 'newsletter' | 'checkout' | 'appointment';

export interface FormData {
  type: FormType;
  title: string;
  description?: string;
  fields: FormField[];
  submitText: string;
  successMessage: string;
  redirectUrl?: string;
  emailTo?: string;
  webhookUrl?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: SelectOption[];
  validation?: FieldValidation;
  width: 'full' | 'half' | 'third';
  order: number;
}

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'file'
  | 'hidden';

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ImageConfig {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading: 'lazy' | 'eager';
  placeholder?: string;
  blurDataURL?: string;
}

export interface VideoConfig {
  url: string;
  poster?: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
}

export interface MapConfig {
  address: string;
  lat?: number;
  lng?: number;
  zoom: number;
  style: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'minimal' | 'luxury' | 'corporate' | 'modern' | 'creative' | 'glassmorphism' | 'neumorphism';

export interface Theme {
  name: string;
  mode: ThemeMode;
  preset: ThemePreset;
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  borderRadius: BorderRadiusConfig;
  shadows: ShadowConfig;
  animations: AnimationConfig;
}

export interface ColorPalette {
  primary: ColorShade;
  secondary: ColorShade;
  accent: ColorShade;
  neutral: ColorShade;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: ColorShade;
  warning: ColorShade;
  error: ColorShade;
  info: ColorShade;
  gradient: GradientConfig;
}

export interface ColorShade {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface GradientConfig {
  primary: string;
  secondary: string;
  accent: string;
  mesh: string;
}

export interface TypographyConfig {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  scale: number;
  lineHeight: {
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

export interface SpacingConfig {
  unit: number;
  scale: number[];
}

export interface BorderRadiusConfig {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface ShadowConfig {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  glow: string;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    default: string;
    in: string;
    out: string;
    inOut: string;
  };
  reduceMotion: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AnimationType =
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'fade-in-left'
  | 'fade-in-right'
  | 'scale-in'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'zoom-in'
  | 'blur-in'
  | 'flip-in'
  | 'bounce-in'
  | 'none';

export interface Animation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: string;
  once: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SEOConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string | null;
  ogImage: string | null;
  ogType: 'website' | 'article' | 'product';
  twitterCard: 'summary' | 'summary_large_image';
  twitterSite: string | null;
  twitterCreator: string | null;
  noIndex: boolean;
  noFollow: boolean;
  jsonLd: JsonLdConfig[];
  sitemap: boolean;
  robotsTxt: string;
}

export interface JsonLdConfig {
  type: string;
  data: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface BrandConfig {
  name: string;
  tagline: string;
  slogan: string;
  mission: string;
  vision: string;
  values: string[];
  personality: string[];
  voice: BrandVoice;
  colors: ColorPalette;
  typography: TypographyConfig;
  logo: LogoConfig;
  socialLinks: SocialLinks;
}

export interface BrandVoice {
  tone: string[];
  style: string;
  doUse: string[];
  dontUse: string[];
}

export interface LogoConfig {
  primary: string;
  secondary?: string;
  icon?: string;
  favicon?: string;
  width: number;
  height: number;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  pinterest?: string;
  github?: string;
  discord?: string;
  whatsapp?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI GENERATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AIProvider = 'openrouter' | 'anthropic' | 'openai';
export type ImageProvider = 'dalle' | 'flux' | 'midjourney' | 'stable-diffusion';

export interface GenerateRequest {
  /** Pre-created project ID — generation fills this project instead of
   *  creating a new one. Avoids duplicate projects + Clerk-ID-vs-DB-ID bugs. */
  projectId?: string;
  description: string;
  industry: string;
  businessType: string;
  businessName?: string;
  tone: BrandTone;
  features: string[];
  pages: string[];
  templateId?: string;
  imageProvider?: ImageProvider;
  language?: string;
}

export type BrandTone =
  | 'professional'
  | 'casual'
  | 'luxury'
  | 'creative'
  | 'corporate'
  | 'playful'
  | 'authoritative'
  | 'friendly'
  | 'minimal'
  | 'bold';

export interface GenerateContext {
  requestId: string;
  userId: string;
  organizationId: string | null;
  tokenBudget: number;
  tokensUsed: number;
  startTime: number;
}

export interface GenerationProgress {
  stage: GenerationStage;
  progress: number;
  message: string;
  data?: unknown;
}

export type GenerationStage =
  | 'analyzing'
  | 'branding'
  | 'structuring'
  | 'content'
  | 'design'
  | 'seo'
  | 'images'
  | 'assembling'
  | 'validating'
  | 'complete'
  | 'error';

export interface GenerationResult {
  project: Project;
  metadata: GenerationMetadata;
}

export interface GenerationMetadata {
  requestId: string;
  tokensUsed: number;
  duration: number;
  model: string;
  sectionsGenerated: number;
  pagesGenerated: number;
  imagesGenerated: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ExportFormat = 'nextjs' | 'react' | 'html' | 'tailwind' | 'zip' | 'markdown' | 'pdf' | 'json';

export interface ExportConfig {
  format: ExportFormat;
  options: ExportOptions;
}

export interface ExportOptions {
  includeImages: boolean;
  includeStyles: boolean;
  minify: boolean;
  typescript: boolean;
  tailwind: boolean;
  eslint: boolean;
  prettier: boolean;
}

export interface ExportResult {
  id: string;
  projectId: string;
  format: ExportFormat;
  status: 'pending' | 'building' | 'ready' | 'failed';
  downloadUrl: string | null;
  fileSize: number | null;
  buildLog: string[];
  createdAt: Date;
  expiresAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DeployPlatform = 'vercel' | 'netlify' | 'cloudflare' | 'github' | 'docker';

export type DeployStatus = 'pending' | 'building' | 'deploying' | 'deployed' | 'failed' | 'cancelled';

export interface Deployment {
  id: string;
  projectId: string;
  platform: DeployPlatform;
  status: DeployStatus;
  url: string | null;
  buildId: string | null;
  buildLog: string[];
  environment: 'production' | 'preview';
  createdAt: Date;
  completedAt: Date | null;
}

export interface DeployConfig {
  platform: DeployPlatform;
  branch?: string;
  environment: 'production' | 'preview';
  customDomain?: string;
  envVars?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER & ORGANIZATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  clerkId: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
}

export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  organizationId: string;
  invitedById: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION & BILLING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface PlanConfig {
  id: string;
  name: SubscriptionPlan;
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  limits: PlanLimits;
  stripePriceId: {
    monthly: string;
    yearly: string;
  };
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
  tooltip?: string;
}

export interface PlanLimits {
  projects: number;
  pagesPerProject: number;
  sectionsPerPage: number;
  aiGenerations: number;
  exports: number;
  deployments: number;
  teamMembers: number;
  storage: number; // in MB
  customDomains: number;
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  interval: 'monthly' | 'yearly';
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt: Date | null;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  stripeInvoiceId: string;
  invoiceUrl: string | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type IndustryType =
  | 'restaurant'
  | 'hotel'
  | 'gym'
  | 'bakery'
  | 'real-estate'
  | 'law-firm'
  | 'hospital'
  | 'software'
  | 'logistics'
  | 'church'
  | 'school'
  | 'agency'
  | 'construction'
  | 'photography'
  | 'consulting'
  | 'startup'
  | 'ecommerce'
  | 'portfolio'
  | 'fitness'
  | 'beauty'
  | 'automotive'
  | 'finance'
  | 'healthcare'
  | 'education'
  | 'nonprofit'
  | 'other';

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  industry: IndustryType;
  category: string;
  thumbnail: string;
  preview: string;
  pages: string[];
  features: string[];
  theme: ThemePreset;
  isPremium: boolean;
  downloads: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  projectId: string;
  pageId: string | null;
  sectionId: string | null;
  userId: string;
  content: string;
  resolved: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Version {
  id: string;
  projectId: string;
  snapshot: Project;
  message: string;
  createdBy: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;
  projectId: string;
  type: AnalyticsEventType;
  data: Record<string, unknown>;
  timestamp: Date;
}

export type AnalyticsEventType =
  | 'page_view'
  | 'section_view'
  | 'click'
  | 'form_submit'
  | 'cta_click'
  | 'link_click'
  | 'scroll'
  | 'time_on_page';

export interface AnalyticsSummary {
  projectId: string;
  period: 'day' | 'week' | 'month' | 'year';
  totalViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  topPages: PageAnalytics[];
  deviceBreakdown: DeviceBreakdown;
  referrerBreakdown: ReferrerBreakdown;
}

export interface PageAnalytics {
  pageId: string;
  slug: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgTime: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface ReferrerBreakdown {
  source: string;
  visits: number;
  percentage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'project_created'
  | 'project_published'
  | 'project_exported'
  | 'deployment_complete'
  | 'deployment_failed'
  | 'team_invite'
  | 'team_joined'
  | 'comment_added'
  | 'subscription_updated'
  | 'payment_failed'
  | 'usage_limit';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalGenerations: number;
  totalExports: number;
  totalDeployments: number;
  revenue: number;
  aiTokensUsed: number;
  storageUsed: number;
  planBreakdown: Record<SubscriptionPlan, number>;
  industryBreakdown: Record<string, number>;
  dailySignups: DailyStat[];
  dailyGenerations: DailyStat[];
  dailyRevenue: DailyStat[];
}

export interface DailyStat {
  date: string;
  value: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedPlans: SubscriptionPlan[];
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
  timestamp: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type EditorTool = 'select' | 'move' | 'add' | 'style' | 'text';

export interface EditorState {
  projectId: string;
  pageId: string;
  sections: Section[];
  selectedSectionId: string | null;
  selectedElementId: string | null;
  activeTool: EditorTool;
  zoom: number;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  state: Section[];
  userId: string;
}

export interface DragDropResult {
  sourceIndex: number;
  destinationIndex: number;
  sourcePageId: string;
  destinationPageId: string;
  sectionId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT LIBRARY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentDefinition {
  id: string;
  name: string;
  category: ComponentCategory;
  icon: string;
  description: string;
  defaultProps: Record<string, unknown>;
  preview: string;
  tags: string[];
}

export type ComponentCategory =
  | 'layout'
  | 'navigation'
  | 'hero'
  | 'content'
  | 'media'
  | 'forms'
  | 'commerce'
  | 'social'
  | 'utility';

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface MarketingCopy {
  facebookAd?: AdCopy;
  googleAd?: AdCopy;
  instagramCaption?: string;
  linkedinPost?: string;
  tweet?: string;
  newsletter?: EmailCopy;
  landingPage?: LandingPageCopy;
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
  url: string;
}

export interface EmailCopy {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
}

export interface LandingPageCopy {
  headline: string;
  subheadline: string;
  benefits: string[];
  testimonials: Testimonial[];
  cta: string;
  guarantee?: string;
}
