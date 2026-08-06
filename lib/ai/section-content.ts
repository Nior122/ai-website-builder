// =============================================================================
// Section Content Generator — business-specific content for every section type
// =============================================================================
// Deterministic builders produce rich, business-specific content for all 34
// section types in SECTION_CONTENT_SCHEMAS — NEVER lorem ipsum or placeholders.
// The LLM stage then refines on top; any proposed refinement that doesn't
// validate against the per-type schema is rejected, so the deterministic base
// is always the guaranteed floor.
// =============================================================================

import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';
import { getModelManager, type ModelManager } from './model-manager';
import { repairAndParse } from './json-repair-engine';
import { safeValidate } from './safe-validation';
import { safeValidateSectionContent } from '@/features/json-engine/schemas/section-schemas';
import { getSectionConfig } from '@/features/json-engine/services/section-registry';
import { resolveStockImage, type StockImageOptions } from './stock-images';
import { logStageStart, logStageComplete, logStageFailed } from './observability';
import type { AIErrorContext } from './structured-errors';
import type { GenerateRequest } from '@/types';
import type { BusinessAnalysis } from './business-analysis';
import type { BrandIdentity, DesignTokens } from './design-system';
import type { IndustryProfile } from './industry-profiles';
import type { PlannedPage } from './page-planner';
import type { GenerationProgress } from '@/features/ai-engine/types';
import { z } from 'zod';

const LOG = { service: 'section-content' } as const;

export interface SectionDraft {
  type: string;
  layout: string;
  content: Record<string, unknown>;
  images: Array<Record<string, unknown>>;
}

export interface SectionBuildContext {
  analysis: BusinessAnalysis;
  brand: BrandIdentity;
  design: DesignTokens;
  request: GenerateRequest;
  profile: IndustryProfile;
}

const TODAY = new Date().toISOString().slice(0, 10);

// ─── Industry flavor maps (hero copy, process, team roles, pricing, milestones) ─

const HERO_HEADLINES: Record<string, string> = {
  restaurant: 'Flavors that bring people together',
  law: 'Protecting your rights, guiding your future',
  salon: 'Where beauty meets artistry',
  saas: 'Work smarter, grow faster',
  ecommerce: 'Shop the difference',
  education: 'Inspiring minds, shaping futures',
  medical: 'Compassionate care, close to home',
  construction: 'Building trust, brick by brick',
  consulting: 'Turning insight into advantage',
  fitness: 'Stronger every single day',
  travel: 'Your next journey starts here',
  finance: 'Your goals, guided with clarity',
  church: 'A place to belong, believe, and grow',
  'real-estate': 'Find the place you\'ll call home',
  beauty: 'Beauty, refreshed daily',
  automotive: 'Precision service, mile after mile',
  fashion: 'Style that speaks for you',
  'hospitality-hotel': 'Stay where memories are made',
  creative: 'Ideas worth remembering',
};

const PROCESS_BY_INDUSTRY: Record<string, string[]> = {
  restaurant: ['Discover', 'Prepare', 'Plate', 'Delight'],
  law: ['Listen', 'Analyze', 'Advocate', 'Resolve'],
  salon: ['Consult', 'Style', 'Finish', 'Maintain'],
  saas: ['Explore', 'Configure', 'Launch', 'Scale'],
  ecommerce: ['Browse', 'Personalize', 'Checkout', 'Deliver'],
  education: ['Assess', 'Teach', 'Practice', 'Grow'],
  medical: ['Listen', 'Diagnose', 'Treat', 'Follow Up'],
  construction: ['Consult', 'Design', 'Build', 'Hand Over'],
  consulting: ['Diagnose', 'Strategize', 'Implement', 'Optimize'],
  fitness: ['Assess', 'Train', 'Fuel', 'Recover'],
  finance: ['Understand', 'Plan', 'Invest', 'Review'],
  church: ['Welcome', 'Connect', 'Serve', 'Grow'],
  'real-estate': ['Match', 'Tour', 'Negotiate', 'Close'],
  beauty: ['Consult', 'Treat', 'Style', 'Glow'],
  automotive: ['Inspect', 'Repair', 'Detail', 'Return'],
  fashion: ['Discover', 'Curate', 'Style', 'Share'],
  'hospitality-hotel': ['Welcome', 'Stay', 'Dine', 'Return'],
  creative: ['Discover', 'Design', 'Produce', 'Deliver'],
};

const TEAM_ROLES_BY_INDUSTRY: Record<string, string[]> = {
  restaurant: ['Executive Chef', 'Head of Service', 'Sommelier', 'General Manager'],
  law: ['Managing Partner', 'Senior Associate', 'Legal Director', 'Of Counsel'],
  salon: ['Master Stylist', 'Color Director', 'Spa Manager', 'Client Care Lead'],
  saas: ['Chief Executive Officer', 'Head of Product', 'Engineering Lead', 'Head of Customer Success'],
  ecommerce: ['Founder', 'Head of Merchandising', 'Logistics Director', 'Customer Experience Lead'],
  education: ['Head of School', 'Academic Director', 'Lead Teacher', 'Student Success Lead'],
  medical: ['Chief Physician', 'Head of Nursing', 'Practice Manager', 'Patient Care Lead'],
  construction: ['Project Director', 'Site Manager', 'Head Estimator', 'Safety Officer'],
  consulting: ['Managing Director', 'Principal Consultant', 'Strategy Lead', 'Engagement Manager'],
  fitness: ['Head Coach', 'Nutrition Lead', 'Performance Director', 'Member Experience Lead'],
  finance: ['Senior Advisor', 'Portfolio Manager', 'Compliance Lead', 'Client Relations Director'],
  church: ['Senior Pastor', 'Worship Director', 'Outreach Coordinator', 'Family Ministry Lead'],
  'real-estate': ['Principal Broker', 'Lead Agent', 'Marketing Director', 'Client Relations Lead'],
  beauty: ['Founder & Aesthetician', 'Lead Makeup Artist', 'Spa Director', 'Client Care Lead'],
  automotive: ['Master Technician', 'Service Director', 'Parts Manager', 'Detail Lead'],
  fashion: ['Creative Director', 'Head of Design', 'Brand Manager', 'Styling Lead'],
  'hospitality-hotel': ['General Manager', 'Executive Chef', 'Rooms Director', 'Concierge Lead'],
  creative: ['Creative Director', 'Lead Designer', 'Strategy Director', 'Production Lead'],
};

const PRICING_BY_INDUSTRY: Record<string, Array<{ name: string; price: number; period: string; description: string; highlighted?: boolean }>> = {
  restaurant: [
    { name: 'À La Carte', price: 25, period: 'one-time', description: 'Flexible dining, crafted to order.' },
    { name: 'Tasting Menu', price: 75, period: 'one-time', description: 'A curated multi-course experience.', highlighted: true },
    { name: 'Private Events', price: 40, period: 'one-time', description: 'Tailored menus for groups up to 60.' },
  ],
  salon: [
    { name: 'Essential', price: 45, period: 'one-time', description: 'Signature cut and style.' },
    { name: 'Signature', price: 95, period: 'one-time', description: 'Cut, color, and finishing ritual.', highlighted: true },
    { name: 'Luxe', price: 150, period: 'one-time', description: 'Full transformation experience.' },
  ],
  saas: [
    { name: 'Starter', price: 19, period: 'monthly', description: 'For individuals getting started.' },
    { name: 'Pro', price: 49, period: 'monthly', description: 'For growing teams.', highlighted: true },
    { name: 'Enterprise', price: 149, period: 'monthly', description: 'Custom scale, SSO, and support.' },
  ],
  ecommerce: [
    { name: 'Essentials', price: 49, period: 'one-time', description: 'Everyday favorites, fair prices.' },
    { name: 'Signature Collection', price: 99, period: 'one-time', description: 'Curated premium pieces.', highlighted: true },
    { name: 'Luxe Line', price: 199, period: 'one-time', description: 'Limited-run, made to last.' },
  ],
  consulting: [
    { name: 'Advisory', price: 1500, period: 'one-time', description: 'Focused strategic session.' },
    { name: 'Engagement', price: 5000, period: 'monthly', description: 'Ongoing strategic partnership.', highlighted: true },
    { name: 'Transformation', price: 15000, period: 'one-time', description: 'End-to-end program delivery.' },
  ],
  education: [
    { name: 'Foundation', price: 100, period: 'monthly', description: 'Core curriculum access.' },
    { name: 'Scholar', price: 180, period: 'monthly', description: 'Full program + mentorship.', highlighted: true },
    { name: 'Academy', price: 300, period: 'monthly', description: 'Advanced track with coaching.' },
  ],
};

const MILESTONES_BY_INDUSTRY: Record<string, Array<{ year: string; title: string; description: string }>> = {
  restaurant: [
    { year: 'Day one', title: 'Our first table', description: 'Founded on a simple idea: honest food, warm welcome, no shortcuts.' },
    { year: 'Growing strong', title: 'A devoted following', description: 'Word of mouth turned first-time guests into regulars.' },
    { year: 'Today', title: 'Still handcrafted', description: 'Every dish still made to order from fresh, local ingredients.' },
  ],
  law: [
    { year: 'Founded', title: 'Built on integrity', description: 'We started with one conviction: clients deserve clear, honest counsel.' },
    { year: 'Growing', title: 'A trusted practice', description: 'Complex wins earned the referrals that built our firm.' },
    { year: 'Today', title: 'Your advocate', description: 'A full-service firm committed to outcomes, not billable theatrics.' },
  ],
  construction: [
    { year: 'Founded', title: 'First foundation poured', description: 'Hands-on from day one — quality over shortcuts.' },
    { year: 'Growing', title: 'Projects that stand', description: 'Residential and commercial builds delivered on time, on budget.' },
    { year: 'Today', title: 'Built on trust', description: 'A reputation earned one handshake and one completed project at a time.' },
  ],
  saas: [
    { year: 'Launched', title: 'From whiteboard to product', description: 'We built the tool we wished existed for our own team.' },
    { year: 'Scaling', title: 'Trusted by teams', description: 'Thousands of users rely on the platform every day.' },
    { year: 'Today', title: 'Built for what\'s next', description: 'Continuous delivery keeps us ahead of our customers\' needs.' },
  ],
  consulting: [
    { year: 'Founded', title: 'A better way to advise', description: 'We left the big-firm playbook to deliver hands-on results.' },
    { year: 'Growing', title: 'Results that repeat', description: 'Engagements measured by outcomes, not hours billed.' },
    { year: 'Today', title: 'A trusted partner', description: 'Leaders bring us their hardest problems and their biggest ambitions.' },
  ],
};

// ─── Deterministic content builders ─────────────────────────────────────

export function buildSectionContent(
  type: string,
  ctx: SectionBuildContext,
  page: PlannedPage,
  index: number
): Record<string, unknown> {
  const { analysis, brand, request, profile } = ctx;
  const name = brand.name || analysis.businessName;
  const audience = analysis.targetAudience || profile.audience;
  const ctaLabel = analysis.primaryCta || profile.primaryCta;
  const services = analysis.services.length ? analysis.services : profile.services;
  const industry = request.industry;
  const industryId = analysis.industryId || profile.id;

  switch (type) {
    case 'hero': return heroContent(ctx, page, index);
    case 'features': {
      const items = services.slice(0, 6).map((s, i) => ({
        title: s,
        description: featureDescriptionFor(industry, s),
        icon: featureIconFor(industry, i),
      }));
      return {
        headline: `Everything ${name} brings to the table`,
        subheadline: `Built around ${audience.toLowerCase()} — every detail considered, nothing left to chance.`,
        items,
        columns: '3',
        style: 'cards',
      };
    }
    case 'services': {
      return {
        headline: `Our ${industry} services`,
        subheadline: `Focused expertise that delivers ${(analysis.businessGoals[0] || 'real results').toLowerCase()} for ${audience.toLowerCase()}.`,
        items: services.slice(0, 6).map((s, i) => ({
          title: s,
          description: serviceDescriptionFor(industry, s, i),
          icon: featureIconFor(industry, i),
        })),
        columns: '3',
        showPricing: ['saas', 'consulting', 'education'].includes(industryId),
      };
    }
    case 'pricing': {
      return pricingContent(ctx);
    }
    case 'testimonials': {
      const seeded = profile.testimonials.slice(0, 3);
      return {
        headline: `What ${audience.toLowerCase()} say about ${name}`,
        subheadline: `Real experiences from people we\'ve had the privilege to serve.`,
        items: seeded.map((t, i) => ({
          name: t.name,
          role: t.role,
          company: name,
          content: t.content,
          rating: 5,
          featured: i === 0,
        })),
        style: 'cards',
        showRating: true,
      };
    }
    case 'faq': {
      const seeded = profile.faqs.slice(0, 5);
      return {
        headline: 'Frequently asked questions',
        subheadline: `Answers to the questions ${audience.toLowerCase()} ask us most.`,
        items: seeded.map((f, i) => ({ question: f.question, answer: f.answer, category: undefined, order: i })),
        style: 'accordion',
        allowMultiple: false,
      };
    }
    case 'gallery': {
      const queries = galleryQueriesFor(industry, services);
      return {
        headline: 'A look inside',
        subheadline: `A glimpse of what ${name} is all about.`,
        items: queries.slice(0, 6).map((q, i) => {
          const img = resolveStockImage({ query: q, sectionType: 'gallery', industry, alt: q, seed: `gallery:${industryId}:${i}` });
          return { src: img.src, alt: q, caption: q, category: services[i % services.length] || 'Highlights', width: img.width, height: img.height };
        }),
        columns: '3',
        style: 'grid',
        showCaptions: true,
      };
    }
    case 'contact': {
      const email = `hello@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`;
      const location = analysis.location || null;
      return {
        headline: `Get in touch with ${name}`,
        subheadline: `We\'d love to hear about your ${industry} needs.`,
        email,
        address: location ? `${name}, ${location}` : `${name} — ${profile.audience}`,
        businessHours: [
          { days: 'Monday — Friday', hours: '9:00 AM — 6:00 PM' },
          { days: 'Saturday', hours: '10:00 AM — 4:00 PM' },
          { days: 'Sunday', hours: 'Closed' },
        ],
        map: { address: location || name, zoom: 14, style: 'roadmap' },
        socialLinks: {},
        formType: ['consulting', 'law', 'medical'].includes(industryId) ? 'quote' : 'contact',
      };
    }
    case 'cta': {
      return {
        headline: `Ready to experience ${name}?`,
        subheadline: `${ctaLabel} today and see the difference.`,
        cta: { text: ctaLabel, url: '/contact', style: 'primary', size: 'lg' },
        secondaryCta: { text: 'Learn more', url: '/about', style: 'ghost', size: 'md' },
        backgroundStyle: 'gradient',
      };
    }
    case 'stats': {
      const seeded = profile.stats.slice(0, 4);
      return {
        headline: `${name} in numbers`,
        subheadline: `The results that ${audience.toLowerCase()} count on.`,
        items: seeded.map((s, i) => ({ value: s.value, label: s.label, prefix: undefined, suffix: undefined, icon: statIconFor(industry, i) })),
        style: 'cards',
        columns: '4',
      };
    }
    case 'team': {
      const roles = TEAM_ROLES_BY_INDUSTRY[industryId] || TEAM_ROLES_BY_INDUSTRY.general || ['Founder', 'Operations Lead', 'Client Care Lead'];
      return {
        headline: 'Meet the team',
        subheadline: `The people behind ${name}.`,
        members: roles.slice(0, 4).map((role, i) => ({
          name: teamNameFor(industryId, name, i),
          role,
          bio: `${role} at ${name}, focused on ${services[i % services.length]?.toLowerCase() || 'delivering excellence'} for ${audience.toLowerCase()}.`,
          avatarQuery: `professional portrait of a ${role.toLowerCase()} in ${industry}`,
        })),
        columns: '4',
        style: 'cards',
        showSocial: true,
      };
    }
    case 'timeline': {
      const seeded = MILESTONES_BY_INDUSTRY[industryId] || MILESTONES_BY_INDUSTRY.general || MILESTONES_BY_INDUSTRY.saas!;
      return {
        headline: 'Our journey',
        subheadline: `How ${name} came to be.`,
        items: seeded.slice(0, 4).map(m => ({ year: m.year, title: m.title, description: m.description })),
        style: 'vertical',
      };
    }
    case 'about': {
      const img = resolveStockImage({ query: `${industry} business team working`, sectionType: 'about', industry, alt: `${name} team`, seed: `about:${industryId}` });
      return {
        headline: `About ${name}`,
        subheadline: brand.tagline || `The ${industry} partner you can rely on.`,
        body: brand.description || `${name} helps ${audience.toLowerCase()} achieve ${(analysis.businessGoals[0] || 'their goals').toLowerCase()} with a focus on quality and care.`,
        image: img.src,
        stats: profile.stats.slice(0, 3).map((s, i) => ({ value: s.value, label: s.label, icon: statIconFor(industry, i) })),
        cta: { text: ctaLabel, url: '/contact', style: 'primary', size: 'md' },
        values: brand.values.slice(0, 3).map((v, i) => ({ title: v, description: valueDescriptionFor(v), icon: featureIconFor(industry, i) })),
      };
    }
    case 'mission': {
      const img = resolveStockImage({ query: `${industry} mission vision values`, sectionType: 'mission', industry, alt: `${name} mission`, seed: `mission:${industryId}` });
      return {
        headline: 'Our mission & vision',
        mission: brand.mission || `To help ${audience.toLowerCase()} achieve ${(analysis.businessGoals[0] || 'their goals').toLowerCase()} through ${services[0]?.toLowerCase() || 'exceptional service'}.`,
        vision: brand.vision || `To be the most trusted ${industry} partner for ${audience.toLowerCase()}.`,
        values: brand.values.length ? brand.values : ['Integrity', 'Excellence', 'Care'],
        image: img.src,
        style: 'split',
      };
    }
    case 'values': {
      const values = brand.values.length ? brand.values : profile.pages.length ? ['Integrity', 'Excellence', 'Customer Focus', 'Reliability'] : ['Quality', 'Service', 'Trust'];
      return {
        headline: 'What we stand for',
        subheadline: 'The values that guide every decision we make.',
        items: values.slice(0, 4).map((v, i) => ({
          title: v,
          description: valueDescriptionFor(v),
          icon: featureIconFor(industry, i),
        })),
        style: 'cards',
      };
    }
    case 'process': {
      const steps = PROCESS_BY_INDUSTRY[industryId] || PROCESS_BY_INDUSTRY.general || ['Listen', 'Plan', 'Deliver', 'Support'];
      return {
        headline: 'How it works',
        subheadline: `A clear path from first conversation to ${(analysis.businessGoals[0] || 'results').toLowerCase()}.`,
        steps: steps.slice(0, 4).map((step, i) => ({
          number: i + 1,
          title: step,
          description: stepDescriptionFor(industry, step, i),
          icon: featureIconFor(industry, i),
        })),
        style: 'numbered',
      };
    }
    case 'portfolio': {
      const cats = services.slice(0, 3);
      return {
        headline: 'Selected work',
        subheadline: `A few projects that show how ${name} delivers.`,
        items: cats.flatMap((c, ci) => {
          const q = portfolioQueryFor(industry, c);
          const img = resolveStockImage({ query: q, sectionType: 'portfolio', industry, alt: `${c} project`, seed: `portfolio:${industryId}:${ci}` });
          return [{ title: `${c} — featured project`, description: `A flagship ${industry.toLowerCase()} engagement delivered by ${name}.`, image: img.src, category: c, year: String(new Date().getFullYear() - (ci % 2)) }];
        }),
        columns: '3',
        style: 'grid',
        showFilters: true,
      };
    }
    case 'newsletter': {
      return {
        headline: 'Stay in the loop',
        subheadline: `Tips, updates, and offers from ${name} — straight to your inbox.`,
        body: `Join our newsletter for ${industry.toLowerCase()} insights you can actually use.`,
        placeholder: 'Enter your email',
        buttonText: 'Subscribe',
        disclaimer: 'No spam. Unsubscribe anytime.',
        style: 'card',
      };
    }
    case 'video': {
      const poster = resolveStockImage({ query: `${industry} showcase`, sectionType: 'video', industry, alt: `${name} video poster`, seed: `video:${industryId}` });
      return {
        headline: `See ${name} in action`,
        subheadline: 'A quick look at what we do and why it matters.',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          poster: poster.src,
          autoplay: false,
          loop: false,
          muted: true,
          controls: true,
        },
        caption: `${name} — ${brand.tagline || 'quality you can see.'}`,
        style: 'embedded',
      };
    }
    case 'map': {
      const location = analysis.location || null;
      return {
        headline: 'Find us',
        subheadline: location ? `We\'re based in ${location}.` : 'Come visit us.',
        map: { address: location || name, zoom: 14, style: 'roadmap' },
        showInfo: true,
        infoTitle: name,
        infoAddress: location || `${name} — ${profile.audience}`,
        infoPhone: '',
        infoEmail: `hello@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
      };
    }
    case 'accordion': {
      const seeded = profile.faqs.slice(0, 5);
      return {
        headline: 'Common questions',
        items: seeded.slice(0, 5).map(f => ({ header: f.question, content: f.answer })),
        allowMultiple: false,
        defaultOpen: [],
      };
    }
    case 'tabs': {
      return {
        headline: `Explore ${name}`,
        items: services.slice(0, 3).map((s, i) => ({
          label: s,
          content: `${serviceDescriptionFor(industry, s, i)} At ${name}, we approach ${s.toLowerCase()} with a focus on ${audience.toLowerCase()} and measurable results.`,
          icon: featureIconFor(industry, i),
        })),
        style: 'underline',
      };
    }
    case 'divider': return { style: 'gradient', spacing: 'md' };
    case 'spacer': return { height: 'md' };
    case 'html': {
      return {
        html: `<div style="max-width:760px;margin:0 auto"><h3 style="margin:0 0 .5rem">Reach ${name}</h3><p style="margin:0;color:#64748b">Call or write today — we\'d love to help with your ${industry} needs.</p></div>`,
        sandboxed: true,
      };
    }
    case 'blog': {
      const topics = blogTopicsFor(industry);
      return {
        headline: 'From the blog',
        subheadline: `Practical ${industry.toLowerCase()} insights from the ${name} team.`,
        posts: topics.map((t, i) => ({
          title: t.title,
          excerpt: t.excerpt,
          slug: t.slug,
          category: t.category,
          date: dateOffset(TODAY, i),
          readTime: '4 min read',
          author: name,
        })),
        layout: 'grid',
        columns: '3',
        showExcerpt: true,
        showDate: true,
        showAuthor: true,
      };
    }
    case 'booking': {
      return {
        headline: `Book with ${name}`,
        subheadline: `Reserve your ${industry} session in under a minute.`,
        formType: industryId === 'restaurant' ? 'reservation' : industryId === 'medical' ? 'appointment' : 'booking',
        duration: '30 min',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableHours: { start: '09:00', end: '18:00' },
      };
    }
    case 'checkout': {
      return {
        headline: 'Secure checkout',
        supportedMethods: ['credit-card', 'paypal'],
        currency: 'USD',
        showOrderSummary: true,
      };
    }
    case 'coming-soon': {
      return {
        headline: `${name} is almost here`,
        subheadline: `Something great is in the works for ${audience.toLowerCase()}.`,
        body: brand.description || `We\'re preparing to launch ${name}.`,
        launchDate: dateOffset(TODAY, 30),
        cta: { text: 'Get notified', url: '/contact', style: 'primary', size: 'md' },
        showCountdown: true,
      };
    }
    case 'landing': {
      const plans = pricingPlansFor(ctx).slice(0, 3);
      const seeded = profile.testimonials.slice(0, 2);
      const fqs = profile.faqs.slice(0, 3);
      return {
        headline: brand.tagline || `${name} — ${industry} done right`,
        subheadline: brand.description || `The ${industry} partner for ${audience.toLowerCase()}.`,
        body: analysis.uniqueSellingPoint || '',
        cta: { text: ctaLabel, url: '/contact', style: 'primary', size: 'lg' },
        features: services.slice(0, 4).map((s, i) => ({ title: s, description: featureDescriptionFor(industry, s), icon: featureIconFor(industry, i) })),
        testimonials: seeded.map((t, i) => ({ name: t.name, role: t.role, company: name, content: t.content, rating: 5, featured: i === 0 })),
        pricing: plans,
        faq: fqs.map((f, i) => ({ question: f.question, answer: f.answer, order: i })),
        showCountdown: false,
      };
    }
    case 'sales': {
      const seeded = profile.testimonials.slice(0, 2);
      return {
        headline: `${services[0] || 'Our flagship service'} — done right`,
        subheadline: `Everything ${name} has learned, delivered in one focused package.`,
        body: brand.description || `${name} is trusted by ${audience.toLowerCase()} who demand results.`,
        cta: { text: ctaLabel, url: '/contact', style: 'primary', size: 'lg' },
        price: pricingPlansFor(ctx)[1]?.price ? `$${pricingPlansFor(ctx)[1]!.price}` : undefined,
        originalPrice: pricingPlansFor(ctx)[1]?.price ? `$${Math.round(pricingPlansFor(ctx)[1]!.price * 1.25)}` : undefined,
        features: services.slice(0, 5).map((s, i) => ({ title: s, description: featureDescriptionFor(industry, s), icon: featureIconFor(industry, i) })),
        testimonials: seeded.map(t => ({ name: t.name, role: t.role, company: name, content: t.content, rating: 5, featured: false })),
        guarantee: 'Satisfaction guaranteed — or we make it right.',
        urgencyText: 'Limited spots available this month.',
      };
    }
    case 'terms': {
      return {
        headline: 'Terms of Service',
        lastUpdated: TODAY,
        sections: legalSections('terms', name),
      };
    }
    case 'privacy': {
      return {
        headline: 'Privacy Policy',
        lastUpdated: TODAY,
        sections: legalSections('privacy', name),
      };
    }
    case '404': {
      return {
        headline: '404',
        message: 'The page you\'re looking for doesn\'t exist.',
        cta: { text: 'Back to home', url: '/', style: 'primary', size: 'md' },
      };
    }
    default: {
      return {
        headline: `About ${name}`,
        subheadline: brand.tagline || 'Welcome.',
        body: brand.description || `${name} serves ${audience.toLowerCase()}.`,
      };
    }
  }
}

function heroContent(ctx: SectionBuildContext, page: PlannedPage, index: number): Record<string, unknown> {
  const { analysis, brand, request, profile } = ctx;
  const industryId = analysis.industryId || profile.id;
  const name = brand.name || analysis.businessName;
  const headline = HERO_HEADLINES[industryId] || `Exceptional ${request.industry} services for ${(analysis.targetAudience || profile.audience).toLowerCase()}`;
  const img = resolveStockImage({ query: `${request.industry} hero ${page.isHome ? 'showcase' : 'feature'}`, sectionType: 'hero', industry: request.industry, alt: headline, seed: `hero:${industryId}:${index}` });
  return {
    headline,
    subheadline: brand.tagline || `${name} — ${analysis.primaryCta || profile.primaryCta} today.`,
    body: brand.description || `${name} is the ${request.industry} partner that ${(analysis.audiencePainPoints[0] || 'cares about the details').toLowerCase()} — carefully crafted for those who expect more.`,
    cta: { text: analysis.primaryCta || profile.primaryCta, url: '/contact', style: 'primary', size: 'lg' },
    secondaryCta: { text: 'Learn more', url: '/about', style: 'ghost', size: 'md' },
    badge: `${request.industry} • ${analysis.location || 'Local & trusted'}`,
    backgroundImage: img.src,
  };
}

function pricingContent(ctx: SectionBuildContext): Record<string, unknown> {
  const { analysis, brand, request, profile } = ctx;
  const industryId = analysis.industryId || profile.id;
  const plans = pricingPlansFor(ctx);
  return {
    headline: 'Simple, transparent pricing',
    subheadline: `Fair pricing for ${(analysis.targetAudience || profile.audience).toLowerCase()} — no surprises.`,
    plans: plans.slice(0, 3).map((p, i) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      period: p.period as 'monthly' | 'yearly' | 'one-time',
      features: pricingFeaturesFor(industryId, i).map(f => ({ text: f, included: true })),
      highlighted: !!p.highlighted,
      cta: 'Get Started',
      badge: p.highlighted ? 'Most popular' : undefined,
    })),
    annualDiscount: 'Save 20% with annual billing',
    badge: 'No hidden fees',
  };
}

function pricingPlansFor(ctx: SectionBuildContext): Array<{ name: string; price: number; period: string; description: string; highlighted?: boolean }> {
  const { analysis, profile } = ctx;
  const industryId = analysis.industryId || profile.id;
  const seeded = PRICING_BY_INDUSTRY[industryId];
  if (seeded) return seeded;
  const svc = analysis.services[0] || 'Core Service';
  return [
    { name: 'Starter', price: 49, period: 'monthly', description: `Entry into ${svc}.` },
    { name: 'Professional', price: 99, period: 'monthly', description: `The complete ${svc} experience.`, highlighted: true },
    { name: 'Premium', price: 199, period: 'monthly', description: 'Priority support and extras.' },
  ];
}

// ─── Helpers ────────────────────────────────────────────────────────────

function featureIconFor(industry: string, i: number): string {
  const pools: Record<string, string[]> = {
    restaurant: ['Utensils', 'Wine', 'Leaf', 'Sparkles', 'Clock', 'Heart'],
    law: ['Gavel', 'Scale', 'Shield', 'FileText', 'Users', 'Briefcase'],
    salon: ['Scissors', 'Sparkles', 'Heart', 'Flower2', 'Palette', 'Star'],
    saas: ['Rocket', 'Layers', 'Zap', 'Shield', 'BarChart', 'Globe'],
    ecommerce: ['ShoppingBag', 'Truck', 'CreditCard', 'Gift', 'Search', 'Package'],
    education: ['BookOpen', 'GraduationCap', 'Pencil', 'Users', 'Award', 'Globe'],
    medical: ['Stethoscope', 'Heart', 'Activity', 'ShieldPlus', 'Clock', 'Users'],
    construction: ['HardHat', 'Building2', 'Hammer', 'Ruler', 'Truck', 'Shield'],
    consulting: ['TrendingUp', 'Target', 'Lightbulb', 'PieChart', 'Users', 'Rocket'],
    fitness: ['Dumbbell', 'Activity', 'Heart', 'Flame', 'Timer', 'Trophy'],
    finance: ['Landmark', 'PieChart', 'TrendingUp', 'Shield', 'Wallet', 'LineChart'],
    church: ['Heart', 'Hands', 'Users', 'BookOpen', 'Star', 'Globe'],
    'real-estate': ['Home', 'Key', 'MapPin', 'Building2', 'Search', 'Shield'],
    beauty: ['Sparkles', 'Flower2', 'Heart', 'Star', 'Palette', 'Gem'],
    automotive: ['Car', 'Settings', 'Wrench', 'Shield', 'Gauge', 'Fuel'],
    fashion: ['Shirt', 'Gem', 'Sparkles', 'Scissors', 'Star', 'Palette'],
    'hospitality-hotel': ['Bed', 'Wifi', 'Coffee', 'ConciergeBell', 'MapPin', 'Star'],
    creative: ['Palette', 'PenTool', 'Lightbulb', 'Layers', 'Sparkles', 'Figma'],
  };
  const pool = pools[industry] || ['Sparkles', 'Check', 'Star', 'Users', 'Zap', 'Heart'];
  return pool[i % pool.length];
}

function statIconFor(industry: string, i: number): string {
  const icons = ['TrendingUp', 'Users', 'Award', 'Star', 'Check', 'Heart'];
  const m: Record<string, number> = {
    restaurant: 0, law: 2, salon: 4, saas: 0, ecommerce: 5, education: 3,
    medical: 5, construction: 1, consulting: 0, fitness: 1,
  };
  return icons[(m[industry] ?? i) % icons.length];
}

const FEATURE_TEMPLATES: Record<string, string[]> = {
  restaurant: [
    'Made fresh daily with local, seasonal ingredients.',
    'A carefully curated menu built around the flavors you love.',
    'Warm, attentive service that makes every guest feel at home.',
    'A dining room designed for celebration, conversation, and comfort.',
  ],
  law: [
    'Clear, honest counsel — no jargon, no surprises.',
    'Aggressive advocacy backed by meticulous preparation.',
    'Transparent pricing and regular case updates.',
    'A track record of favorable outcomes, case after case.',
  ],
  salon: [
    'Styles crafted around your features and lifestyle.',
    'Premium products that keep your look fresh long after you leave.',
    'A relaxing space designed around your comfort.',
    'Color work that complements your natural tone.',
  ],
  saas: [
    'Setup in minutes, no code required.',
    'A workflow that fits the way your team already works.',
    'Enterprise-grade security baked into every layer.',
    'Real support from real people, when you need it.',
  ],
  consulting: [
    'Diagnosis grounded in data, not opinion.',
    'Plans built for execution, not PowerPoints.',
    'Hands-on implementation with measurable milestones.',
    'Partners who own outcomes alongside you.',
  ],
  medical: [
    'Care plans centered around you, not your chart.',
    'Modern diagnostics for confident decisions.',
    'Same-day appointments when you need them.',
    'A team that listens before it prescribes.',
  ],
  construction: [
    'Builds delivered on time and on budget.',
    'Licensed, insured, and rigorously vetted crews.',
    'Materials chosen for longevity, not just looks.',
    'Clear communication at every milestone.',
  ],
  education: [
    'Curriculum designed around how your child learns.',
    'Small class sizes with real teacher attention.',
    'Progress you can see, every term.',
    'A community that celebrates every milestone.',
  ],
  ecommerce: [
    'Quality checked twice before it ships.',
    'Fast, free shipping on every order.',
    'Hassle-free returns — no questions asked.',
    'New arrivals every week, curated by experts.',
  ],
};

function featureDescriptionFor(industry: string, service: string): string {
  const pool = FEATURE_TEMPLATES[industry];
  if (pool) return pool[Math.abs(hash(service)) % pool.length];
  return `Focused, expert ${service.toLowerCase()} delivered with care and consistency for clients who expect more.`;
}

function serviceDescriptionFor(industry: string, service: string, i: number): string {
  const openers = [
    `Our ${service.toLowerCase()} service is built around your goals.`,
    `We approach ${service.toLowerCase()} with precision and care.`,
    `From start to finish, ${service.toLowerCase()} is handled by specialists.`,
    `A complete ${service.toLowerCase()} experience — scoped, priced, and delivered clearly.`,
  ];
  const closer = 'Transparent process, clear communication, and a standard of quality you can rely on.';
  return `${openers[i % openers.length]} ${closer}`;
}

function stepDescriptionFor(industry: string, step: string, i: number): string {
  const followUps = [
    'We take time to understand exactly what you need.',
    'We build a plan around your goals and timeline.',
    'We deliver with care, precision, and attention to detail.',
    'We follow up and refine until it\'s right.',
  ];
  return `The "${step}" phase — ${followUps[i % followUps.length]} ${step} done the ${industry} way.`;
}

function valueDescriptionFor(value: string): string {
  const base: Record<string, string> = {
    Integrity: 'We do what we say, even when no one is watching.',
    Excellence: 'Good enough never is — every detail earns its place.',
    'Customer Focus': 'Your goals come first, always.',
    Innovation: 'We\'re always finding a better way.',
    Reliability: 'We show up, on time, every time.',
    Care: 'People before transactions, always.',
    Quality: 'Built to last, finished to impress.',
    Service: 'Anticipating needs before they\'re spoken.',
    Trust: 'Earned daily through honest, consistent work.',
  };
  return base[value] || `${value} is at the heart of everything we do for our clients.`;
}

function teamNameFor(industry: string, business: string, i: number): string {
  const first = ['Jordan', 'Alex', 'Morgan', 'Casey', 'Taylor', 'Riley', 'Avery', 'Quinn', 'Sam', 'Reese'];
  const lastBase = business.replace(/[^a-zA-Z ]/g, '').split(' ').filter(Boolean);
  const last = lastBase.length > 1 ? lastBase[1] : (lastBase[0]?.slice(0, 8) || 'Lee');
  const surname = last.replace(/[^a-zA-Z]/g, '') || 'Lee';
  return `${first[(hash(industry) + i) % first.length]} ${surname}`;
}

function galleryQueriesFor(industry: string, services: string[]): string[] {
  const generic = [
    `${industry} highlight`,
    `${services[0] || 'core'} in action`,
    `${services[1] || 'behind the scenes'}`,
    `team at work ${industry}`,
    `${industry} detail shot`,
    `happy clients ${industry}`,
  ];
  return generic;
}

function portfolioQueryFor(industry: string, service: string): string {
  return `${service} project showcase ${industry}`;
}

function blogTopicsFor(industry: string): Array<{ title: string; excerpt: string; slug: string; category: string }> {
  const map: Record<string, Array<{ title: string; excerpt: string; slug: string; category: string }>> = {
    restaurant: [
      { title: 'Behind the menu: how we source ingredients', excerpt: 'A peek into the farms and purveyors behind your favorite dishes.', slug: 'behind-the-menu', category: 'Kitchen' },
      { title: 'Wine pairings that elevate every course', excerpt: 'Simple pairings that make a good meal unforgettable.', slug: 'wine-pairings', category: 'Wine' },
      { title: 'Why seasonal menus are better for everyone', excerpt: 'Taste, sustainability, and value — seasonal cooking wins.', slug: 'seasonal-menus', category: 'Food' },
    ],
    law: [
      { title: 'What to bring to your first consultation', excerpt: 'A practical checklist to make your first meeting count.', slug: 'first-consultation', category: 'Advice' },
      { title: 'Understanding your legal options, clearly', excerpt: 'Demystifying common legal paths so you can decide with confidence.', slug: 'legal-options', category: 'Guide' },
      { title: 'How we keep client communications honest', excerpt: 'Transparency is a practice, not a promise.', slug: 'honest-communication', category: 'Firm' },
    ],
    saas: [
      { title: '5 workflows you can automate this week', excerpt: 'Practical automations that save your team hours every week.', slug: 'automate-this-week', category: 'Productivity' },
      { title: 'A secure-by-default checklist for your stack', excerpt: 'The security basics every growing team should have in place.', slug: 'security-checklist', category: 'Security' },
      { title: 'From trial to renewal: onboarding that works', excerpt: 'How great onboarding turns first logins into long-term customers.', slug: 'onboarding', category: 'Growth' },
    ],
    consulting: [
      { title: 'Diagnose before you prescribe', excerpt: 'Why great consulting starts with listening, not answering.', slug: 'diagnose-first', category: 'Strategy' },
      { title: 'Making change stick after the engagement', excerpt: 'How to keep momentum once the consultants leave.', slug: 'change-sticks', category: 'Change' },
      { title: 'Measuring what actually matters', excerpt: 'KPIs that reflect outcomes, not activity.', slug: 'measuring-outcomes', category: 'Analytics' },
    ],
  };
  const seeded = map[industry];
  if (seeded) return seeded;
  return [
    { title: `5 reasons to choose a local ${industry} partner`, excerpt: `Why working with ${industry} specialists close to home pays off.`, slug: 'local-partner', category: 'Guides' },
    { title: `How we deliver ${industry} results that last`, excerpt: 'Our process, explained in plain language.', slug: 'our-process', category: 'Process' },
    { title: `What to look for in ${industry} services`, excerpt: `A practical checklist for choosing the right ${industry} provider.`, slug: 'what-to-look-for', category: 'Advice' },
  ];
}

function pricingFeaturesFor(industry: string, planIndex: number): string[] {
  const common: Record<string, string[]> = {
    restaurant: ['Table reservation', 'Custom menu consultation', 'Seasonal tasting flight'],
    law: ['Initial consultation', 'Document preparation', 'Ongoing counsel'],
    salon: ['Signature styling', 'Premium product finish', 'Aftercare consultation'],
    saas: ['Core platform access', 'Up to 10 seats', 'Email support'],
    ecommerce: ['Free shipping', 'Extended returns', 'Membership perks'],
    education: ['Full curriculum access', 'Progress reporting', 'Teacher office hours'],
    consulting: ['Discovery workshop', 'Strategy roadmap', 'Executive review'],
    medical: ['Priority scheduling', 'Extended consultation', 'Care plan follow-up'],
    construction: ['Detailed estimate', 'Project management', 'Warranty coverage'],
    fitness: ['Group classes', 'Training plan', 'Nutrition guidance'],
    finance: ['Portfolio review', 'Quarterly planning', 'Direct advisor access'],
  };
  const base = common[industry] || ['Core service', 'Priority support', 'Regular updates'];
  const byPlan = [
    base,
    [...base, 'Everything in the tier below, plus premium support'],
    [...base.slice(0, 2), 'Everything included, dedicated attention'],
  ];
  return byPlan[planIndex] || base;
}

function legalSections(kind: 'terms' | 'privacy', name: string): Array<{ title: string; content: string }> {
  if (kind === 'terms') {
    return [
      { title: '1. Acceptance of Terms', content: `By using ${name}'s website and services, you agree to these terms. If you do not agree, please do not use our services.` },
      { title: '2. Services', content: `${name} provides ${name.toLowerCase()} services as described on this website. Service details, pricing, and availability are subject to change with notice.` },
      { title: '3. User Responsibilities', content: 'You agree to provide accurate information, use our services lawfully, and not disrupt the experience of other users.' },
      { title: '4. Intellectual Property', content: `All content on this site, including text, graphics, and branding, is the property of ${name} and protected by applicable law.` },
      { title: '5. Limitation of Liability', content: `${name} is not liable for indirect, incidental, or consequential damages arising from use of our services, to the fullest extent permitted by law.` },
      { title: '6. Changes to These Terms', content: 'We may update these terms from time to time. Material changes will be reflected on this page with an updated date.' },
      { title: '7. Contact', content: `Questions about these terms? Reach out to ${name} through the contact page on this website.` },
    ];
  }
  return [
    { title: '1. Information We Collect', content: `${name} collects information you provide directly — such as your name, email, and inquiry details — plus limited usage data to improve our website.` },
    { title: '2. How We Use Information', content: 'We use your information to respond to inquiries, deliver services, send relevant updates (with consent), and improve our offerings.' },
    { title: '3. Data Sharing', content: 'We do not sell your personal information. Data is shared only with trusted service providers who help us operate, under confidentiality obligations.' },
    { title: '4. Cookies', content: 'We use essential cookies to keep the site working and optional analytics to understand usage. You can control cookies through your browser settings.' },
    { title: '5. Data Security', content: 'We apply industry-standard safeguards to protect your information, including encryption in transit and access controls.' },
    { title: '6. Your Rights', content: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us.' },
    { title: '7. Contact', content: `Privacy questions? Reach out to ${name} through the contact page on this website.` },
  ];
}

function dateOffset(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function defaultLayoutFor(type: string): string {
  return getSectionConfig(type)?.defaultLayout || 'default';
}

// ─── Section images ─────────────────────────────────────────────────────

export function buildSectionImages(type: string, content: Record<string, unknown>, ctx: SectionBuildContext, index: number): Array<Record<string, unknown>> {
  const { analysis, request, profile } = ctx;
  const industry = request.industry;
  const industryId = analysis.industryId || profile.id;
  const opts = (q: string, st: string, alt: string, seed: string): StockImageOptions =>
    ({ query: q, sectionType: st, industry, alt, seed });

  switch (type) {
    case 'hero': {
      const headline = (content.headline as string) || `${industry} hero`;
      return [resolveStockImage(opts(`${industry} hero banner`, 'hero', headline, `hero:${industryId}:${index}`))];
    }
    case 'gallery': {
      const items = (content.items as Array<Record<string, unknown>>) || [];
      return items.map((it, i) => resolveStockImage(opts(`${industry} gallery ${it.alt || i}`, 'gallery', String(it.alt || 'gallery image'), `gal:${industryId}:${index}:${i}`)));
    }
    case 'portfolio': {
      const items = (content.items as Array<Record<string, unknown>>) || [];
      return items.map((it, i) => resolveStockImage(opts(`${industry} portfolio project`, 'portfolio', String(it.title || 'project'), `pf:${industryId}:${index}:${i}`)));
    }
    case 'team': {
      const members = (content.members as Array<Record<string, unknown>>) || [];
      return members.map((m, i) => resolveStockImage(opts(String(m.avatarQuery || `${industry} team member`), 'team', String(m.name || 'team member'), `team:${industryId}:${index}:${i}`)));
    }
    case 'about':
    case 'mission': {
      const headline = (content.headline as string) || 'About';
      return [resolveStockImage(opts(`${industry} ${type}`, type, headline, `${type}:${industryId}:${index}`))];
    }
    case 'blog': {
      const posts = (content.posts as Array<Record<string, unknown>>) || [];
      return posts.map((p, i) => resolveStockImage(opts(`${industry} blog ${p.title}`, 'blog', String(p.title || 'post'), `blog:${industryId}:${index}:${i}`)));
    }
    default: {
      const headline = (content.headline as string) || type;
      return [resolveStockImage(opts(`${industry} ${headline}`, type, headline, `sec:${industryId}:${index}`))];
    }
  }
}

// ─── Page-level builder ─────────────────────────────────────────────────

export function buildDefaultSections(page: PlannedPage, ctx: SectionBuildContext): SectionDraft[] {
  return (page.sectionPlan || []).map((type, i) => {
    const content = buildSectionContent(type, ctx, page, i);
    const images = buildSectionImages(type, content, ctx, i);
    return { type, layout: defaultLayoutFor(type), content, images };
  });
}

// ─── LLM refinement stage ───────────────────────────────────────────────

const sectionRefinementSchema = z.object({
  sections: z.array(z.object({ type: z.string().optional().default(''), content: z.record(z.unknown()).optional().default({}) })).optional().default([]),
});

const SECTIONS_SYSTEM_PROMPT = `You are an expert web copywriter and UI content designer. Given a business, a page, and its required section types, write original, specific, persuasive content for each section.

Rules:
- Write for THIS business — never lorem ipsum, generic filler, or placeholder text.
- Match each section type's expected fields exactly (hero: headline/subheadline/body/cta; features/services: items[] each with title+description; testimonials: items[] each with name/role/content; faq: items[] each with question/answer; pricing: plans[] each with name/price/features[]; team: members[] each with name/role/bio; stats: items[] each with value+label; contact: email/phone/address; etc.)
- Use the business's tone and the copy provided as a base — refine, don't discard.
- Strong headlines, benefit-driven subheadlines, concrete details.

Return ONLY valid JSON:
{
  "sections": [
    { "type": "section type from the plan", "content": { /* fields for that type */ } }
  ]
}`;

export function buildSectionsRefinementPrompt(
  page: PlannedPage,
  ctx: SectionBuildContext,
  drafts: SectionDraft[]
): string {
  const { analysis, brand, request } = ctx;
  const name = brand.name || analysis.businessName;
  const plan = page.sectionPlan.join(', ');
  const summary = drafts.map(d => `- ${d.type}: ${safePreview(d.content)}`).join('\n');
  return [
    `Business: ${name}`,
    `Industry: ${request.industry}`,
    `Tone: ${brand.tone || analysis.tone || 'professional'}`,
    `Page: ${page.title} (slug: ${page.slug})`,
    `Required section types: ${plan}`,
    `Current content to refine:`,
    summary,
    `Rewrite each section with sharper, more specific copy. Keep the same field names.`,
  ].join('\n');
}

export function mergeProposedSections(base: SectionDraft[], proposed: unknown): SectionDraft[] {
  const out = [...base];
  const list = Array.isArray(proposed) ? proposed : (proposed as { sections?: unknown })?.sections;
  if (!Array.isArray(list)) return out;
  for (const rec of list) {
    if (!rec || typeof rec !== 'object') continue;
    const r = rec as { type?: string; content?: Record<string, unknown> };
    const idx = out.findIndex(s => s.type === r.type);
    if (idx < 0) continue;
    const merged = { ...out[idx].content, ...(r.content && typeof r.content === 'object' ? r.content : {}) };
    const v = safeValidateSectionContent(out[idx].type, merged);
    if (v.success) out[idx] = { ...out[idx], content: v.data as Record<string, unknown> };
  }
  return out;
}

/** Run the section content stage for one page (deterministic base + LLM refinement). */
export async function runSectionContentGeneration(
  page: PlannedPage,
  ctx: SectionBuildContext,
  mm: ModelManager = getModelManager(),
  context: AIErrorContext = {},
  emit?: (p: GenerationProgress) => void
): Promise<SectionDraft[]> {
  const base = buildDefaultSections(page, ctx);
  try {
    const r = await mm.executeWithFallback<string>({
      system: SECTIONS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildSectionsRefinementPrompt(page, ctx, base) }],
      stage: `sections:${page.slug}`,
    }, { ...context, stage: `sections:${page.slug}` });
    if (!r.data) throw new Error('Empty response');
    const rr = repairAndParse(r.data);
    if (!rr.success) throw new Error(`JSON repair failed: ${rr.error}`);
    const vr = safeValidate(sectionRefinementSchema, rr.data, { defaultBasePath: 'sections', verbose: false });
    if (!vr.success) throw new Error(`Validation failed: ${vr.error}`);
    const refined = mergeProposedSections(base, (vr.data as { sections: unknown[] }).sections);
    return refined.length > 0 ? refined : base;
  } catch (err) {
    logStageFailed('sections', err instanceof Error ? err.message : String(err));
    logger.warn(`Section refinement fell back to deterministic content for ${page.slug}`, LOG);
    return base;
  }
}

function safePreview(content: Record<string, unknown>): string {
  const c = content as Record<string, unknown>;
  const parts: string[] = [];
  if (c.headline) parts.push(`headline="${String(c.headline).slice(0, 60)}"`);
  if (c.subheadline) parts.push(`subheadline="${String(c.subheadline).slice(0, 60)}"`);
  if (Array.isArray(c.items)) parts.push(`${c.items.length} items`);
  if (Array.isArray(c.plans)) parts.push(`${c.plans.length} plans`);
  if (Array.isArray(c.members)) parts.push(`${c.members.length} members`);
  if (Array.isArray(c.steps)) parts.push(`${c.steps.length} steps`);
  return parts.join(', ') || JSON.stringify(c).slice(0, 120);
}

export function logStageCompleteSections(page: PlannedPage, r: { latencyMs: number; model?: string; provider?: string }, repairsApplied: number): void {
  logStageComplete('sections', { durationMs: r.latencyMs, model: r.model, provider: r.provider, repairsApplied, validationPassed: true });
}
