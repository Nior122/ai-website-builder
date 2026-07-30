// =============================================================================
// Renderer — Barrel Exports
// =============================================================================
// Public API for the renderer feature. Import from '@/features/renderer'.
// =============================================================================

// Providers
export { default as ThemeProvider } from './providers/theme-provider';

// Core Renderers
export { PageRenderer } from './components/page-renderer';
export { SectionRenderer } from './components/section-renderer';
export type { SectionProps } from './components/section-renderer';

// Animation
export { default as AnimatedSection } from './components/animated-section';

// CSS Variables
export { generateCSSVariables, generateDarkModeCSSVariables } from './lib/css-variables';

// UI Components
export { Button } from './components/ui/button';
export { Badge } from './components/ui/badge';
export { Card } from './components/ui/card';

// Section Components
export { HeroSection } from './sections/hero';
export { FeaturesSection } from './sections/features';
export { TestimonialsSection } from './sections/testimonials';
export { PricingSection } from './sections/pricing';
export { FAQSection } from './sections/faq';
export { ContactSection } from './sections/contact';
export { CTASection } from './sections/cta';
export { StatsSection } from './sections/stats';
export { TeamSection } from './sections/team';
export { NewsletterSection } from './sections/newsletter';
export { AboutSection } from './sections/about';
export { FooterSection } from './sections/footer';
