// =============================================================================
// AI Prompt Templates — Enhanced
// =============================================================================
// Centralized prompt construction for the AI generation pipeline.
// Includes system prompts, section-specific prompts, refinement prompts,
// and image generation prompt builders.
// =============================================================================

import type { GenerateRequest } from '@/types';

// ─── System Prompts ─────────────────────────────────────────────────────

/**
 * Primary system prompt for website generation.
 * Instructs Claude to output structured JSON matching our schema.
 */
export const GENERATION_SYSTEM_PROMPT = `You are an expert web designer, content strategist, and SEO specialist. You generate professional websites as structured JSON.

## Core Rules
1. Output ONLY valid JSON — no markdown fences, no explanation, no preamble
2. All content must be real, compelling, and SEO-optimized — never use "Lorem ipsum" or placeholder text
3. Tailor tone, copy, and imagery to the specified industry
4. Every section needs a compelling headline, clear value proposition, and strong CTA
5. Use inclusive, accessible language (WCAG 2.1 AA compliant)
6. Mobile-first design principles
7. Image prompts should describe specific, photorealistic scenes relevant to the business
8. Color palette must have sufficient contrast ratios (4.5:1 for text)

## Section Content Requirements
Each section type has specific content fields. Generate ALL required fields for each section type.
- hero: headline, subheadline, ctaText, ctaLink, backgroundType
- features: headline, subheadline, items (icon, title, description) — 3 to 6 items
- testimonials: headline, items (quote, author, role, company, avatar query) — 3 to 5 items
- pricing: headline, subheadline, plans (name, price, period, features, highlighted, ctaText) — 2 to 4 plans
- faq: headline, subheadline, items (question, answer) — 5 to 8 items
- contact: headline, subheadline, fields (name, email, phone, message, submitText)
- gallery: headline, subheadline, layout (grid|masonry|carousel), images (query, alt) — 6 to 12 images
- team: headline, subheadline, members (name, role, bio, avatar query) — 3 to 8 members
- stats: headline, items (value, label, suffix) — 3 to 6 items
- cta: headline, subheadline, ctaText, ctaLink, style (banner|card|split)
- newsletter: headline, subheadline, placeholder, buttonText, disclaimer
- footer: columns (title, links), socialLinks, copyright
- navbar: brand, links (label, href, children), ctaText
- blog: headline, subheadline, postCount
- video: headline, subheadline, videoQuery, overlayText
- logoCloud: headline, subheadline, logos (name, query)
- map: headline, subheadline, address, phone, email, hours
- heroWithProduct: headline, subheadline, ctaText, productQuery, features (icon, text)
- comparisonTable: headline, subheadline, features (name, plans), plans (name, highlighted)
- countdown: headline, subheadline, targetDate, ctaText
- socialProof: headline, items (platform, metric, label)
- logoTicker: logos (name, query)
- splitSection: headline, body, ctaText, ctaLink, imageQuery, alignment (left|right)
- timeline: headline, subheadline, items (year, title, description)
- portfolio: headline, subheadline, items (title, description, imageQuery, category)
- testimonialCarousel: headline, items (quote, author, role, company, rating)
- accordion: headline, items (trigger, content)
- beforeAfter: headline, subheadline, beforeQuery, afterQuery, beforeLabel, afterLabel
- tabs: headline, tabs (label, icon, content { headline, body, imageQuery })
- videoBackground: headline, subheadline, ctaText, videoQuery, overlayOpacity`;

/**
 * System prompt for section refinement.
 */
export const REFINE_SYSTEM_PROMPT = `You are an expert web designer. You refine website section content based on user instructions.

Rules:
1. Output ONLY valid JSON matching the original section structure
2. Preserve the section type and layout — only modify content
3. Apply the user's instructions precisely
4. Maintain professional quality and SEO best practices
5. Keep the same number of items (features, testimonials, etc.) unless told otherwise`;

/**
 * System prompt for image prompt generation.
 */
export const IMAGE_SYSTEM_PROMPT = `You are an expert at writing DALL-E prompts. Generate detailed, specific image prompts for website sections.

Rules:
1. Be specific about composition, lighting, mood, and style
2. Avoid text in images (DALL-E renders text poorly)
3. Match the business industry and brand tone
4. Output prompts that produce photorealistic or styled results
5. Include camera angle and lighting details`;

// ─── Prompt Builders ────────────────────────────────────────────────────

/**
 * Build the user prompt for full website generation.
 */
export function buildGenerationPrompt(request: GenerateRequest): string {
  const parts: string[] = [
    `Generate a complete professional website as structured JSON.\n`,
    `## Business Information`,
    `- **Description:** ${request.description}`,
    `- **Industry:** ${request.industry}`,
    `- **Business Type:** ${request.businessType}`,
  ];

  if (request.businessName) {
    parts.push(`- **Business Name:** ${request.businessName}`);
  }
  if (request.tone) {
    parts.push(`- **Brand Tone:** ${request.tone}`);
  }
  if (request.features?.length) {
    parts.push(`- **Key Features:** ${request.features.join(', ')}`);
  }
  if (request.pages?.length) {
    parts.push(`- **Pages to Generate:** ${request.pages.join(', ')}`);
  }
  if (request.language && request.language !== 'en') {
    parts.push(`- **Language:** ${request.language}`);
  }

  parts.push(
    `\n## Output Schema`,
    `Return a JSON object with: brand, pages, seo, settings.`,
    `Each page must have: slug, title, metaTitle, metaDescription, isHome, sections.`,
    `Each section must have: type, layout, content (type-specific fields), animations, images.`,
    `\n## Content Guidelines`,
    `- Generate real, specific content about THIS business — no generic filler`,
    `- Each section needs a compelling headline and clear CTA where applicable`,
    `- Image queries should describe specific scenes (e.g., "artisan coffee being poured into a ceramic cup, warm morning light, shallow depth of field")`,
    `- Use the exact section types from the schema: hero, features, testimonials, pricing, faq, contact, gallery, team, stats, cta, newsletter, footer, navbar`,
  );

  return parts.join('\n');
}

/**
 * Build prompt for refining a single section.
 */
export function buildRefinePrompt(params: {
  currentContent: Record<string, unknown>;
  sectionType: string;
  instructions: string;
}): string {
  return [
    `## Task: Refine Section`,
    `Section type: ${params.sectionType}`,
    `\n## Current Content`,
    `\`\`\`json`,
    JSON.stringify(params.currentContent, null, 2),
    `\`\`\``,
    `\n## Instructions`,
    params.instructions,
    `\n## Output`,
    `Return the refined section as JSON with the same structure. Only modify what the instructions specify.`,
  ].join('\n');
}

/**
 * Build prompt for generating image prompts for multiple sections.
 */
export function buildImagePromptBatch(params: {
  businessType: string;
  industry: string;
  sections: { type: string; content: Record<string, unknown> }[];
  style: string;
}): string {
  const sectionDescriptions = params.sections
    .map((s, i) => `Section ${i + 1} (${s.type}): ${JSON.stringify(s.content).slice(0, 300)}`)
    .join('\n');

  return [
    `## Task: Generate Image Prompts`,
    `Business: ${params.businessType} (${params.industry})`,
    `Style: ${params.style}`,
    `\n## Sections Needing Images`,
    sectionDescriptions,
    `\n## Output`,
    `Return a JSON array of objects, one per section, each with:`,
    `- sectionIndex: number`,
    `- images: array of { query: string (DALL-E prompt), alt: string (accessibility text) }`,
    `Generate 1-3 images per section depending on the section type.`,
  ].join('\n');
}

/**
 * Build prompt for blog post generation.
 */
export function buildBlogPrompt(params: {
  topic: string;
  tone: string;
  wordCount: number;
  keywords: string[];
  businessType: string;
}): string {
  return [
    `## Task: Write Blog Post`,
    `Topic: ${params.topic}`,
    `Business: ${params.businessType}`,
    `Tone: ${params.tone}`,
    `Target word count: ${params.wordCount}`,
    `SEO keywords to include: ${params.keywords.join(', ')}`,
    `\n## Output`,
    `Return JSON with: title, slug, excerpt, content (markdown), author, publishedAt, tags, metaTitle, metaDescription, readingTime.`,
  ].join('\n');
}

/**
 * Build prompt for a single image generation request.
 */
export function buildSingleImagePrompt(params: {
  sectionType: string;
  businessType: string;
  industry: string;
  style: string;
  context: Record<string, unknown>;
}): string {
  return [
    `Generate a DALL-E prompt for a ${params.sectionType} section image.`,
    `Business: ${params.businessType} (${params.industry})`,
    `Style: ${params.style}`,
    `Section context: ${JSON.stringify(params.context).slice(0, 500)}`,
    `\nReturn JSON with: prompt (detailed DALL-E prompt, 100-200 words), alt (accessibility text), negativePrompt (what to avoid)`,
  ].join('\n');
}

// ─── Section Content Schemas ────────────────────────────────────────────

/**
 * Describes the expected content fields for each section type.
 * Used in prompts to ensure Claude generates complete, valid content.
 */
export const SECTION_CONTENT_SCHEMAS: Record<string, string> = {
  hero: `{
    "headline": "string — main headline",
    "subheadline": "string — supporting text",
    "ctaText": "string — button text",
    "ctaLink": "string — button URL",
    "backgroundType": "gradient | image | video | solid"
  }`,
  features: `{
    "headline": "string",
    "subheadline": "string",
    "items": [{ "icon": "emoji or icon name", "title": "string", "description": "string 1-2 sentences" }]
    // 3 to 6 items
  }`,
  testimonials: `{
    "headline": "string",
    "items": [{ "quote": "string", "author": "string", "role": "string", "company": "string", "avatarQuery": "string" }]
    // 3 to 5 items
  }`,
  pricing: `{
    "headline": "string",
    "subheadline": "string",
    "plans": [{
      "name": "string", "price": "string", "period": "month | year",
      "features": ["string"], "highlighted": boolean, "ctaText": "string", "ctaLink": "string"
    }]
    // 2 to 4 plans
  }`,
  faq: `{
    "headline": "string",
    "subheadline": "string",
    "items": [{ "question": "string", "answer": "string 2-3 sentences" }]
    // 5 to 8 items
  }`,
  contact: `{
    "headline": "string",
    "subheadline": "string",
    "fields": [{ "name": "string", "type": "text | email | phone | textarea", "required": boolean, "placeholder": "string" }],
    "submitText": "string"
  }`,
  gallery: `{
    "headline": "string",
    "subheadline": "string",
    "layout": "grid | masonry | carousel",
    "images": [{ "query": "DALL-E prompt", "alt": "accessibility text" }]
    // 6 to 12 images
  }`,
  team: `{
    "headline": "string",
    "subheadline": "string",
    "members": [{ "name": "string", "role": "string", "bio": "string 1-2 sentences", "avatarQuery": "string" }]
    // 3 to 8 members
  }`,
  stats: `{
    "headline": "string",
    "items": [{ "value": "string like 500 or 10K", "label": "string", "suffix": "string like + or %" }]
    // 3 to 6 items
  }`,
  cta: `{
    "headline": "string",
    "subheadline": "string",
    "ctaText": "string",
    "ctaLink": "string",
    "style": "banner | card | split"
  }`,
  newsletter: `{
    "headline": "string",
    "subheadline": "string",
    "placeholder": "string",
    "buttonText": "string",
    "disclaimer": "string"
  }`,
  footer: `{
    "columns": [{ "title": "string", "links": [{ "label": "string", "href": "string" }] }],
    "socialLinks": { "twitter": "string", "linkedin": "string", "instagram": "string" },
    "copyright": "string"
  }`,
  navbar: `{
    "brand": "string — business name",
    "links": [{ "label": "string", "href": "string", "children": [{ "label": "string", "href": "string" }] }],
    "ctaText": "string"
  }`,
  splitSection: `{
    "headline": "string",
    "body": "string — 2-3 paragraphs",
    "ctaText": "string",
    "ctaLink": "string",
    "imageQuery": "DALL-E prompt",
    "alignment": "left | right"
  }`,
  teamCarousel: `{
    "headline": "string",
    "subheadline": "string",
    "members": [{ "name": "string", "role": "string", "bio": "string", "avatarQuery": "string", "socialLinks": { "linkedin": "string" } }]
  }`,
  logoCloud: `{
    "headline": "string",
    "subheadline": "string",
    "logos": [{ "name": "string", "query": "image search query" }]
  }`,
  video: `{
    "headline": "string",
    "subheadline": "string",
    "videoQuery": "string — search term for stock video",
    "overlayText": "string"
  }`,
  map: `{
    "headline": "string",
    "subheadline": "string",
    "address": "string",
    "phone": "string",
    "email": "string",
    "hours": "string"
  }`,
  comparisonTable: `{
    "headline": "string",
    "subheadline": "string",
    "features": [{ "name": "string", "plans": { "planName": "boolean | string" } }],
    "plans": [{ "name": "string", "highlighted": boolean }]
  }`,
  countdown: `{
    "headline": "string",
    "subheadline": "string",
    "targetDate": "ISO 8601 date string",
    "ctaText": "string"
  }`,
  socialProof: `{
    "headline": "string",
    "items": [{ "platform": "string", "metric": "string", "label": "string" }]
  }`,
  logoTicker: `{
    "logos": [{ "name": "string", "query": "image search query" }]
  }`,
  timeline: `{
    "headline": "string",
    "subheadline": "string",
    "items": [{ "year": "string", "title": "string", "description": "string" }]
  }`,
  portfolio: `{
    "headline": "string",
    "subheadline": "string",
    "items": [{ "title": "string", "description": "string", "imageQuery": "string", "category": "string" }]
  }`,
  accordion: `{
    "headline": "string",
    "items": [{ "trigger": "string — question or heading", "content": "string — answer or content" }]
  }`,
  tabs: `{
    "headline": "string",
    "tabs": [{ "label": "string", "icon": "emoji", "content": { "headline": "string", "body": "string", "imageQuery": "string" } }]
  }`,
};
