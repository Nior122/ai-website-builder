// =============================================================================
// Copywriting
// =============================================================================
// Professional marketing copy generation. Produces benefit-driven headlines,
// subheadlines, features, benefits, FAQs, testimonials, CTAs, mission, vision,
// values, contact copy, and footer copy. Never generic AI filler.
//
// Two paths:
//   1. `buildCopyBlocks` — deterministic, tone-aware copy (works offline)
//   2. `buildCopyPrompt` — AI-ready prompt that applies the copy-editing skill
// =============================================================================

import type { BrandDesign, CopyBlock, DesignBrief } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────

// ─── Tone-aware micro-templates ─────────────────────────────────────────

const HEADLINE_PATTERNS: Record<string, (b: DesignBrief, brand: BrandDesign) => string> = {
  professional: (b, brand) => `Results-driven ${b.industry} services for growing teams`,
  casual: (b, brand) => `The friendly way to handle your ${b.industry} needs`,
  luxury: (b, brand) => `Refined ${b.industry} experiences, crafted for you`,
  creative: (b, brand) => `We make ${b.industry} look effortless (and feel it too)`,
  corporate: (b, brand) => `Strategic ${b.industry} solutions that move the business forward`,
  playful: (b, brand) => `Big ${b.industry} wins, zero boring meetings`,
  authoritative: (b, brand) => `The standard in ${b.industry} — set by ${brand.name}`,
  friendly: (b, brand) => `Helping you love your ${b.industry} again`,
  minimal: (b, brand) => `Clear ${b.industry}. Real results.`,
  bold: (b, brand) => `Stop settling. Start leading in ${b.industry}.`,
};

const SUBHEADLINE_PATTERNS: Record<string, (b: DesignBrief, brand: BrandDesign) => string> = {
  professional: (b, brand) => `${brand.name} combines strategy, craft, and accountability to deliver ${b.businessType} outcomes you can measure.`,
  casual: (b, brand) => `We handle the details so you can focus on the work that matters. No jargon, no runaround.`,
  luxury: (b, brand) => `Meticulous attention to every detail — because you deserve more than the ordinary.`,
  creative: (b, brand) => `A ${b.businessType} partner that treats your brand like a living, breathing story.`,
  corporate: (b, brand) => `Aligned with your objectives, disciplined in execution, and transparent in reporting.`,
  playful: (b, brand) => `We do the heavy lifting, you get the credit. Simple as that.`,
  authoritative: (b, brand) => `Backed by results, referenced by clients, and built on decades of ${b.industry} expertise.`,
  friendly: (b, brand) => `Real people, real expertise, real care for what you’re building.`,
  minimal: (b, brand) => `${b.businessType} services stripped of noise — only what moves the needle.`,
  bold: (b, brand) => `While others play it safe, we build the future of ${b.industry}.`,
};

const CTA_PATTERNS: Record<string, string[]> = {
  professional: ['Get a Free Consultation', 'Request a Proposal', 'Talk to Our Team'],
  casual: ['Let’s Chat', 'Get Started Today', 'See What We Can Do'],
  luxury: ['Book a Private Consultation', 'Request an Invitation', 'Discover the Difference'],
  creative: ['Start Your Project', 'Make Something Great', 'Tell Us Your Idea'],
  corporate: ['Schedule a Meeting', 'Download the Overview', 'Contact Sales'],
  playful: ['Let’s Do This', 'Get the Good Stuff', 'Start the Fun'],
  authoritative: ['Speak With an Expert', 'Request a Demo', 'Get the Blueprint'],
  friendly: ['Say Hello', 'Get in Touch', 'We’re Here to Help'],
  minimal: ['Start', 'Get Started', 'Contact'],
  bold: ['Get Started Now', 'Claim Your Edge', 'Build It Better'],
};

// ─── Block Builder ──────────────────────────────────────────────────────

/**
 * Build the full professional copy set for a business.
 */
export function buildCopyBlocks(brief: DesignBrief, brand: BrandDesign): CopyBlock[] {
  const tone = brand.tone;
  const headline = (HEADLINE_PATTERNS[tone] ?? HEADLINE_PATTERNS.professional!)(brief, brand);
  const subheadline = (SUBHEADLINE_PATTERNS[tone] ?? SUBHEADLINE_PATTERNS.professional!)(brief, brand);
  const ctaPool = CTA_PATTERNS[tone] ?? CTA_PATTERNS.professional!;

  const blocks: CopyBlock[] = [
    { key: 'hero.headline', text: headline },
    { key: 'hero.subheadline', text: subheadline },
    { key: 'hero.ctaPrimary', text: ctaPool[0] },
    { key: 'hero.ctaSecondary', text: ctaPool[1] },
    { key: 'mission', text: brand.mission },
    { key: 'vision', text: brand.vision },
    { key: 'values', text: brand.values.join(' · ') },
    { key: 'features', text: buildFeatures(brief, brand).join(' | ') },
    { key: 'benefits', text: buildBenefits(brief, brand).join(' | ') },
    { key: 'faqs', text: buildFaqs(brief, brand).join(' ||| ') },
    { key: 'testimonials', text: buildTestimonials(brief, brand).join(' ||| ') },
    { key: 'contact.headline', text: `Let’s talk about your ${brief.industry} goals` },
    { key: 'contact.body', text: `Tell us where you are and where you want to be. ${brand.name} will map the fastest, surest route.` },
    { key: 'footer.tagline', text: `${brand.name} — ${brand.tagline}` },
  ];
  return blocks;
}

// ─── Content builders ───────────────────────────────────────────────────

function buildFeatures(brief: DesignBrief, brand: BrandDesign): string[] {
  return [
    `Industry-specialized ${brief.businessType} expertise`,
    `Transparent process with measurable milestones`,
    `Dedicated support from a team that knows ${brief.industry}`,
  ];
}

function buildBenefits(brief: DesignBrief, brand: BrandDesign): string[] {
  return [
    `Launch faster with a partner who already knows ${brief.industry}`,
    'Cut costly rework with clear scopes and honest timelines',
    'Grow with systems that scale beyond your first win',
  ];
}

function buildFaqs(brief: DesignBrief, brand: BrandDesign): string[] {
  return [
    `What makes ${brand.name} different?|We specialize in ${brief.industry}, so we bring ready-made best practices instead of learning on your budget.`,
    'How fast can we start?|Most engagements kick off within one week of an agreed scope.',
    'How do you keep costs predictable?|Fixed-scope phases with transparent milestones — no surprise invoices.',
  ];
}

function buildTestimonials(brief: DesignBrief, brand: BrandDesign): string[] {
  return [
    `“${brand.name} understood our ${brief.industry} challenges from day one and delivered ahead of schedule.”`,
    `“The clearest partner we’ve worked with — every milestone landed exactly as promised.”`,
  ];
}

// ─── AI Prompt Path ─────────────────────────────────────────────────────

/**
 * Build an AI-ready copy prompt that applies the copy-editing skill
 * principles (benefit-driven, plain English, CTA optimization).
 */
export function buildCopyPrompt(brief: DesignBrief, brand: BrandDesign): string {
  return [
    'You are a senior marketing copywriter applying the copy-editing skill.',
    '',
    'Rules:',
    ...brand.voiceRules.map((rule) => `- ${rule}`),
    '- Never use "Lorem ipsum", "world-class", "cutting-edge", or generic AI filler.',
    '- Every headline states a concrete benefit; every CTA names the next action.',
    '- Plain English. Active voice. Specific numbers where possible.',
    '',
    'Business:',
    `- Name: ${brand.name}`,
    `- Industry: ${brief.industry}`,
    `- Type: ${brief.businessType}`,
    `- Tone: ${brand.tone}`,
    `- Description: ${brief.description}`,
    '',
    'Output ONLY JSON:',
    '{"heroHeadline":"...","heroSubheadline":"...","ctas":["...","..."],"features":["..."],"benefits":["..."],"faqs":[{"q":"...","a":"..."}],"testimonials":["..."],"mission":"...","vision":"...","values":["..."],"footerTagline":"..."}',
  ].join('\n');
}
