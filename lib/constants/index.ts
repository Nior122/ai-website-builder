// =============================================================================
// Application Constants
// =============================================================================
// Central source of truth for all configuration values, limits, and enums.
// No magic numbers or strings anywhere in the codebase.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// APP CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export const APP_NAME = 'AI Website Builder Studio';
export const APP_DESCRIPTION = 'Transform your business idea into a professional website with AI';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const APP_VERSION = '1.0.0';

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PLANS
// ─────────────────────────────────────────────────────────────────────────────

export const PLANS = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for getting started',
    price: { monthly: 0, yearly: 0 },
    features: [
      { name: 'Projects', included: true, limit: 3 },
      { name: 'Pages per project', included: true, limit: 5 },
      { name: 'AI generations', included: true, limit: 10 },
      { name: 'Exports', included: true, limit: 5 },
      { name: 'Custom domains', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'Priority support', included: false },
      { name: 'Remove branding', included: false },
    ],
    limits: {
      projects: 10,
      pagesPerProject: 5,
      sectionsPerPage: 10,
      aiGenerations: 10,
      exports: 5,
      deployments: 1,
      teamMembers: 1,
      storage: 100, // MB
      customDomains: 0,
    },
    stripePriceId: { monthly: '', yearly: '' },
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    description: 'For professionals and growing businesses',
    price: { monthly: 29, yearly: 290 },
    features: [
      { name: 'Projects', included: true, limit: 50 },
      { name: 'Pages per project', included: true, limit: 30 },
      { name: 'AI generations', included: true, limit: 500 },
      { name: 'Exports', included: true, limit: 100 },
      { name: 'Custom domains', included: true, limit: 10 },
      { name: 'Team collaboration', included: true, limit: 5 },
      { name: 'Priority support', included: true },
      { name: 'Remove branding', included: true },
    ],
    limits: {
      projects: 50,
      pagesPerProject: 30,
      sectionsPerPage: 50,
      aiGenerations: 500,
      exports: 100,
      deployments: 50,
      teamMembers: 5,
      storage: 5000, // MB
      customDomains: 10,
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For agencies and large teams',
    price: { monthly: 99, yearly: 990 },
    features: [
      { name: 'Unlimited projects', included: true },
      { name: 'Unlimited pages', included: true },
      { name: 'Unlimited AI generations', included: true },
      { name: 'Unlimited exports', included: true },
      { name: 'Custom domains', included: true, limit: 100 },
      { name: 'Team collaboration', included: true, limit: 50 },
      { name: 'Priority support', included: true },
      { name: 'Remove branding', included: true },
      { name: 'White-label', included: true },
      { name: 'API access', included: true },
    ],
    limits: {
      projects: -1, // unlimited
      pagesPerProject: -1,
      sectionsPerPage: -1,
      aiGenerations: -1,
      exports: -1,
      deployments: -1,
      teamMembers: 50,
      storage: 50000, // MB
      customDomains: 100,
    },
    stripePriceId: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const INDUSTRIES = [
  { value: 'restaurant', label: 'Restaurant & Food', icon: '🍽️' },
  { value: 'hotel', label: 'Hotel & Hospitality', icon: '🏨' },
  { value: 'gym', label: 'Gym & Fitness', icon: '💪' },
  { value: 'bakery', label: 'Bakery & Desserts', icon: '🧁' },
  { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
  { value: 'law-firm', label: 'Law Firm', icon: '⚖️' },
  { value: 'hospital', label: 'Healthcare', icon: '🏥' },
  { value: 'software', label: 'Software & Tech', icon: '💻' },
  { value: 'logistics', label: 'Logistics & Shipping', icon: '🚚' },
  { value: 'church', label: 'Church & Religious', icon: '⛪' },
  { value: 'school', label: 'Education & School', icon: '🎓' },
  { value: 'agency', label: 'Agency & Marketing', icon: '📈' },
  { value: 'construction', label: 'Construction', icon: '🔨' },
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'consulting', label: 'Consulting', icon: '💼' },
  { value: 'startup', label: 'Startup & SaaS', icon: '🚀' },
  { value: 'ecommerce', label: 'E-Commerce', icon: '🛒' },
  { value: 'portfolio', label: 'Portfolio & Creative', icon: '🎨' },
  { value: 'fitness', label: 'Fitness & Wellness', icon: '🧘' },
  { value: 'beauty', label: 'Beauty & Salon', icon: '💄' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'finance', label: 'Finance & Banking', icon: '💰' },
  { value: 'healthcare', label: 'Healthcare & Medical', icon: '🩺' },
  { value: 'education', label: 'Education & Training', icon: '📚' },
  { value: 'nonprofit', label: 'Non-Profit', icon: '🤝' },
  { value: 'other', label: 'Other', icon: '🏢' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABLE PAGES
// ─────────────────────────────────────────────────────────────────────────────

export const AVAILABLE_PAGES = [
  { value: 'home', label: 'Home', icon: '🏠', required: true },
  { value: 'about', label: 'About', icon: 'ℹ️', required: false },
  { value: 'services', label: 'Services', icon: '🔧', required: false },
  { value: 'portfolio', label: 'Portfolio', icon: '💼', required: false },
  { value: 'gallery', label: 'Gallery', icon: '🖼️', required: false },
  { value: 'pricing', label: 'Pricing', icon: '💰', required: false },
  { value: 'blog', label: 'Blog', icon: '📝', required: false },
  { value: 'careers', label: 'Careers', icon: '👥', required: false },
  { value: 'faq', label: 'FAQ', icon: '❓', required: false },
  { value: 'privacy', label: 'Privacy Policy', icon: '🔒', required: false },
  { value: 'terms', label: 'Terms of Service', icon: '📄', required: false },
  { value: 'contact', label: 'Contact', icon: '📞', required: false },
  { value: '404', label: '404 Page', icon: '🔍', required: false },
  { value: 'coming-soon', label: 'Coming Soon', icon: '⏳', required: false },
  { value: 'landing', label: 'Landing Page', icon: '🎯', required: false },
  { value: 'sales', label: 'Sales Page', icon: '💲', required: false },
  { value: 'booking', label: 'Booking Page', icon: '📅', required: false },
  { value: 'checkout', label: 'Checkout', icon: '💳', required: false },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const SECTION_TYPES = [
  { value: 'hero', label: 'Hero', category: 'hero', icon: '🎯' },
  { value: 'features', label: 'Features', category: 'content', icon: '✨' },
  { value: 'services', label: 'Services', category: 'content', icon: '🔧' },
  { value: 'pricing', label: 'Pricing', category: 'commerce', icon: '💰' },
  { value: 'testimonials', label: 'Testimonials', category: 'social', icon: '💬' },
  { value: 'faq', label: 'FAQ', category: 'content', icon: '❓' },
  { value: 'gallery', label: 'Gallery', category: 'media', icon: '🖼️' },
  { value: 'contact', label: 'Contact', category: 'forms', icon: '📞' },
  { value: 'blog', label: 'Blog', category: 'content', icon: '📝' },
  { value: 'cta', label: 'Call to Action', category: 'content', icon: '🎯' },
  { value: 'stats', label: 'Statistics', category: 'content', icon: '📊' },
  { value: 'team', label: 'Team', category: 'social', icon: '👥' },
  { value: 'timeline', label: 'Timeline', category: 'content', icon: '📅' },
  { value: 'about', label: 'About', category: 'content', icon: 'ℹ️' },
  { value: 'mission', label: 'Mission & Vision', category: 'content', icon: '🌟' },
  { value: 'values', label: 'Values', category: 'content', icon: '💎' },
  { value: 'process', label: 'Process', category: 'content', icon: '⚙️' },
  { value: 'portfolio', label: 'Portfolio', category: 'media', icon: '💼' },
  { value: 'newsletter', label: 'Newsletter', category: 'forms', icon: '📧' },
  { value: 'video', label: 'Video', category: 'media', icon: '🎬' },
  { value: 'map', label: 'Map', category: 'utility', icon: '🗺️' },
  { value: 'accordion', label: 'Accordion', category: 'layout', icon: '📋' },
  { value: 'tabs', label: 'Tabs', category: 'layout', icon: '📑' },
  { value: 'divider', label: 'Divider', category: 'utility', icon: '➖' },
  { value: 'spacer', label: 'Spacer', category: 'utility', icon: '⬜' },
  { value: 'html', label: 'Custom HTML', category: 'utility', icon: '🔗' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// BRAND TONES
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND_TONES = [
  'professional',
  'casual',
  'luxury',
  'creative',
  'corporate',
  'playful',
  'authoritative',
  'friendly',
  'minimal',
  'bold',
] as const;

export type BrandTone = (typeof BRAND_TONES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const PAGE_TYPES = [
  { id: 'home', label: 'Home', icon: '🏠', default: true },
  { id: 'about', label: 'About', icon: 'ℹ️', default: true },
  { id: 'services', label: 'Services', icon: '💼', default: true },
  { id: 'pricing', label: 'Pricing', icon: '💰', default: false },
  { id: 'blog', label: 'Blog', icon: '📝', default: false },
  { id: 'contact', label: 'Contact', icon: '📞', default: true },
  { id: 'portfolio', label: 'Portfolio', icon: '🎨', default: false },
  { id: 'faq', label: 'FAQ', icon: '❓', default: false },
  { id: 'team', label: 'Team', icon: '👥', default: false },
  { id: 'testimonials', label: 'Testimonials', icon: '⭐', default: false },
  { id: 'gallery', label: 'Gallery', icon: '🖼️', default: false },
  { id: 'careers', label: 'Careers', icon: '💼', default: false },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const LAYOUT_TYPES = [
  { value: 'centered', label: 'Centered', description: 'Content centered on the page' },
  { value: 'split', label: 'Split', description: '50/50 split layout' },
  { value: 'image-left', label: 'Image Left', description: 'Image on left, content on right' },
  { value: 'image-right', label: 'Image Right', description: 'Image on right, content on left' },
  { value: 'full-width', label: 'Full Width', description: 'Content spans full width' },
  { value: 'grid-2', label: '2 Column Grid', description: 'Two column grid layout' },
  { value: 'grid-3', label: '3 Column Grid', description: 'Three column grid layout' },
  { value: 'grid-4', label: '4 Column Grid', description: 'Four column grid layout' },
  { value: 'cards', label: 'Card Grid', description: 'Content in card format' },
  { value: 'masonry', label: 'Masonry', description: 'Pinterest-style layout' },
  { value: 'carousel', label: 'Carousel', description: 'Horizontal scrolling' },
  { value: 'tabs', label: 'Tabbed', description: 'Content organized in tabs' },
  { value: 'accordion', label: 'Accordion', description: 'Expandable sections' },
  { value: 'timeline', label: 'Timeline', description: 'Chronological layout' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_PRESETS = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean, simple, and elegant',
    preview: '#ffffff',
  },
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Premium, sophisticated, gold accents',
    preview: '#1a1a2e',
  },
  {
    value: 'corporate',
    label: 'Corporate',
    description: 'Professional, trustworthy, blue tones',
    preview: '#1e3a5f',
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Contemporary, bold, vibrant',
    preview: '#6366f1',
  },
  {
    value: 'creative',
    label: 'Creative',
    description: 'Artistic, colorful, playful',
    preview: '#ec4899',
  },
  {
    value: 'glassmorphism',
    label: 'Glassmorphism',
    description: 'Frosted glass, translucent, modern',
    preview: 'rgba(255,255,255,0.25)',
  },
  {
    value: 'neumorphism',
    label: 'Neumorphism',
    description: 'Soft shadows, embossed, subtle',
    preview: '#e0e5ec',
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT FORMATS
// ─────────────────────────────────────────────────────────────────────────────

export const EXPORT_FORMATS = [
  {
    value: 'nextjs',
    label: 'Next.js',
    description: 'Full Next.js project with App Router',
    icon: '⚛️',
    popular: true,
  },
  {
    value: 'react',
    label: 'React',
    description: 'Create React App compatible',
    icon: '⚛️',
    popular: false,
  },
  {
    value: 'html',
    label: 'HTML/CSS/JS',
    description: 'Static HTML with Tailwind CSS',
    icon: '🌐',
    popular: true,
  },
  {
    value: 'tailwind',
    label: 'Tailwind Only',
    description: 'Just the Tailwind components',
    icon: '🎨',
    popular: false,
  },
  {
    value: 'zip',
    label: 'ZIP Archive',
    description: 'Download as a ZIP file',
    icon: '📦',
    popular: true,
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Content as Markdown files',
    icon: '📝',
    popular: false,
  },
  {
    value: 'pdf',
    label: 'PDF Documentation',
    description: 'PDF with screenshots and code',
    icon: '📄',
    popular: false,
  },
  {
    value: 'json',
    label: 'JSON Project',
    description: 'Raw project JSON data',
    icon: '{ }',
    popular: false,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT PLATFORMS
// ─────────────────────────────────────────────────────────────────────────────

export const DEPLOY_PLATFORMS = [
  {
    value: 'vercel',
    label: 'Vercel',
    description: 'Deploy to Vercel with one click',
    icon: '▲',
    popular: true,
  },
  {
    value: 'netlify',
    label: 'Netlify',
    description: 'Deploy to Netlify',
    icon: ' Дмитрій',
    popular: true,
  },
  {
    value: 'cloudflare',
    label: 'Cloudflare Pages',
    description: 'Deploy to Cloudflare Pages',
    icon: '☁️',
    popular: false,
  },
  {
    value: 'github-pages',
    label: 'GitHub Pages',
    description: 'Deploy to GitHub Pages',
    icon: '🐙',
    popular: false,
  },
  {
    value: 'docker',
    label: 'Docker',
    description: 'Generate Docker configuration',
    icon: '🐳',
    popular: false,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  anonymous: { requests: 100, windowMs: 60_000 },
  free: { requests: 60, windowMs: 60_000 },
  pro: { requests: 300, windowMs: 60_000 },
  enterprise: { requests: 1000, windowMs: 60_000 },
  ai: {
    free: { requests: 5, windowMs: 300_000 }, // 5 per 5 min
    pro: { requests: 20, windowMs: 300_000 },
    enterprise: { requests: 100, windowMs: 300_000 },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SAVE & HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export const EDITOR_CONFIG = {
  autoSaveDelayMs: 2000,
  maxHistoryEntries: 100,
  maxVersions: 50,
  previewDebounceMs: 300,
  zoomMin: 25,
  zoomMax: 200,
  zoomStep: 25,
  zoomDefault: 100,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD LIMITS
// ─────────────────────────────────────────────────────────────────────────────

export const UPLOAD_LIMITS = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  },
  export: {
    maxSize: 100 * 1024 * 1024, // 100MB
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AI CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export const AI_CONFIG = {
  model: process.env.OPENROUTER_MODEL || process.env.AI_MODEL || '',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '8192', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  streamingEnabled: true,
  tokenBudgets: {
    free: 100_000,
    pro: 1_000_000,
    enterprise: 10_000_000,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────────────

export const VALIDATION = {
  slug: {
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    minLength: 1,
    maxLength: 100,
  },
  name: {
    minLength: 1,
    maxLength: 100,
  },
  description: {
    minLength: 10,
    maxLength: 5000,
  },
} as const;
