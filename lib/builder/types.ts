// =============================================================================
// Website Builder — Core Types
// =============================================================================
// Domain model for the professional website builder: projects, pages,
// sections, themes, navigation, forms, blog, media, SEO, preview, history,
// exports, and quality reporting.
// =============================================================================

export type ThemeMode = 'light' | 'dark';

export type PreviewDevice = 'desktop' | 'laptop' | 'tablet' | 'mobile';

export interface PreviewState {
  device: PreviewDevice;
  zoom: number;
  mode: ThemeMode;
  fullscreen: boolean;
  refreshKey: number;
}

export interface BuilderSection {
  id: string;
  type: string;
  layout: string;
  order: number;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  animations: Record<string, unknown>;
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  locked: boolean;
  visible: boolean;
  templateId: string | null;
}

export type PageStatus = 'draft' | 'published';

export interface BuilderPage {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  isHome: boolean;
  status: PageStatus;
  order: number;
  sections: BuilderSection[];
}

export interface BuilderTheme {
  preset: string;
  mode: ThemeMode;
  tokens: Record<string, unknown>;
  styleOverrides: Record<string, unknown>;
}

export interface NavLink {
  id: string;
  label: string;
  href: string;
  children?: NavLink[];
}

export interface NavigationConfig {
  logoText: string;
  links: NavLink[];
  sticky: boolean;
  transparent: boolean;
  cta: { label: string; href: string } | null;
  mobileMenu: 'drawer' | 'dropdown';
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface FooterConfig {
  tagline: string;
  columns: FooterColumn[];
  socialLinks: Array<{ platform: string; url: string }>;
  copyright: string;
}

export interface SiteSeo {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string | null;
  twitterCard: string;
  canonicalUrl: string | null;
  robots: string;
  sitemap: boolean;
  schema: Array<Record<string, unknown>>;
}

export type MediaType = 'image' | 'video' | 'icon' | 'background' | 'illustration';
export type MediaSource = 'upload' | 'ai' | 'stock' | 'generated';

export interface MediaItem {
  id: string;
  type: MediaType;
  src: string;
  alt: string;
  source: MediaSource;
  width?: number;
  height?: number;
}

export type FormKind =
  | 'contact'
  | 'newsletter'
  | 'booking'
  | 'appointment'
  | 'quote'
  | 'consultation'
  | 'lead';

export type FormFieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
}

export interface FormConfig {
  id: string;
  kind: FormKind;
  title: string;
  fields: FormField[];
  validation: {
    required: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  spamProtection: boolean;
  successMessage: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  featured: boolean;
  publishedAt: string | null;
}

export interface BlogState {
  posts: BlogPost[];
  categories: string[];
  tags: string[];
  author: string;
}

export interface BuilderProject {
  id: string;
  name: string;
  description: string;
  industry: string;
  businessType: string;
  theme: BuilderTheme;
  pages: BuilderPage[];
  navigation: NavigationConfig;
  footer: FooterConfig;
  seo: SiteSeo;
  media: MediaItem[];
  blog: BlogState;
  forms: FormConfig[];
  updatedAt: number;
  version: number;
}

export interface HistoryEntry {
  id: string;
  label: string;
  createdAt: number;
}

export interface LibraryVariant {
  id: string;
  label: string;
  tokens: Record<string, unknown>;
}

export interface LibraryComponent {
  id: string;
  label: string;
  variants: LibraryVariant[];
}

export interface QualityIssue {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  fix?: string;
}

export interface QualityReport {
  passed: boolean;
  issues: QualityIssue[];
  repaired: string[];
}

export interface WorkflowProgress {
  step: number;
  total: number;
  message: string;
  agent?: string;
  model?: string;
}

export type ExportFormat = 'json' | 'html' | 'zip' | 'react' | 'nextjs' | 'tailwind';

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  content: string;
  mime: string;
}
