// =============================================================================
// Design Generation Engine — Industry-Based Design Intelligence
// =============================================================================
// Every industry receives appropriate layout, typography, colors, iconography,
// animation style, image style, and section order. Classification is done by
// keyword matching on the business description, so the engine never has to ask
// the user for their industry.
// =============================================================================

import type { IndustryProfile } from './types';

export const INDUSTRY_PROFILES: IndustryProfile[] = [
  { id: 'restaurant', label: 'Restaurant', layoutPatterns: ['editorial', 'luxury', 'split-hero'], typographyStyle: 'elegant', seed: '#b3541e', mode: 'light', iconNiche: 'food', animationStyle: 'warm', imageStyle: 'editorial-food', sectionArchetype: 'dining', description: 'Warm, appetite-driven design with editorial food photography.' },
  { id: 'law-firm', label: 'Law Firm', layoutPatterns: ['corporate', 'editorial', 'minimal'], typographyStyle: 'classic', seed: '#1f3a5f', mode: 'light', iconNiche: 'legal', animationStyle: 'calm', imageStyle: 'corporate-clean', sectionArchetype: 'legal', description: 'Trustworthy, restrained, authoritative.' },
  { id: 'hospital', label: 'Hospital', layoutPatterns: ['medical', 'corporate', 'card-grid'], typographyStyle: 'modern', seed: '#0e7c7b', mode: 'light', iconNiche: 'healthcare', animationStyle: 'calm', imageStyle: 'clean-clinical', sectionArchetype: 'medical', description: 'Calm, clinical clarity with strong trust signals.' },
  { id: 'hotel', label: 'Hotel', layoutPatterns: ['luxury', 'editorial', 'alternating'], typographyStyle: 'luxury', seed: '#8c6d46', mode: 'light', iconNiche: 'travel', animationStyle: 'warm', imageStyle: 'luxury-hospitality', sectionArchetype: 'travel', description: 'Inviting, high-end hospitality.' },
  { id: 'school', label: 'School', layoutPatterns: ['education', 'card-grid', 'centered-hero'], typographyStyle: 'friendly', seed: '#2f6f4f', mode: 'light', iconNiche: 'education', animationStyle: 'playful', imageStyle: 'bright-educational', sectionArchetype: 'education', description: 'Bright, approachable, optimistic.' },
  { id: 'church', label: 'Church', layoutPatterns: ['centered-hero', 'editorial', 'minimal'], typographyStyle: 'serif', seed: '#5c3d2e', mode: 'light', iconNiche: 'community', animationStyle: 'calm', imageStyle: 'warm-gathering', sectionArchetype: 'community', description: 'Warm, welcoming, communal.' },
  { id: 'beauty-salon', label: 'Beauty Salon', layoutPatterns: ['luxury', 'editorial', 'split-hero'], typographyStyle: 'elegant', seed: '#c2476d', mode: 'light', iconNiche: 'beauty', animationStyle: 'soft', imageStyle: 'beauty-studio', sectionArchetype: 'beauty', description: 'Elegant, feminine, polished.' },
  { id: 'barbershop', label: 'Barbershop', layoutPatterns: ['editorial', 'minimal', 'split-hero'], typographyStyle: 'energetic', seed: '#3d3a34', mode: 'dark', iconNiche: 'grooming', animationStyle: 'punchy', imageStyle: 'bold-studio', sectionArchetype: 'beauty', description: 'Bold, masculine, confident.' },
  { id: 'fashion', label: 'Fashion Brand', layoutPatterns: ['editorial', 'masonry', 'magazine'], typographyStyle: 'editorial', seed: '#212121', mode: 'light', iconNiche: 'fashion', animationStyle: 'soft', imageStyle: 'high-fashion', sectionArchetype: 'creative', description: 'Runway-clean editorial minimalism.' },
  { id: 'gym', label: 'Gym', layoutPatterns: ['punchy', 'card-grid', 'split-hero'], typographyStyle: 'energetic', seed: '#c0392b', mode: 'dark', iconNiche: 'fitness', animationStyle: 'punchy', imageStyle: 'dynamic-athletic', sectionArchetype: 'fitness', description: 'High-energy, motivational intensity.' },
  { id: 'real-estate', label: 'Real Estate', layoutPatterns: ['luxury', 'editorial', 'alternating'], typographyStyle: 'elegant', seed: '#9c7b4d', mode: 'light', iconNiche: 'realestate', animationStyle: 'warm', imageStyle: 'property-architectural', sectionArchetype: 'realestate', description: 'Premium property presentation.' },
  { id: 'construction', label: 'Construction', layoutPatterns: ['corporate', 'alternating', 'card-grid'], typographyStyle: 'modern', seed: '#b7791f', mode: 'light', iconNiche: 'construction', animationStyle: 'calm', imageStyle: 'industrial-clean', sectionArchetype: 'corporate', description: 'Solid, dependable, built-to-last.' },
  { id: 'travel', label: 'Travel', layoutPatterns: ['travel', 'masonry', 'card-grid'], typographyStyle: 'friendly', seed: '#0f7fa3', mode: 'light', iconNiche: 'travel', animationStyle: 'playful', imageStyle: 'travel-adventure', sectionArchetype: 'travel', description: 'Adventure-driven wanderlust.' },
  { id: 'crypto', label: 'Crypto', layoutPatterns: ['glass', 'gradient', 'modern-startup'], typographyStyle: 'geometric', seed: '#6d28d9', mode: 'dark', iconNiche: 'technology', animationStyle: 'tech', imageStyle: 'futuristic-abstract', sectionArchetype: 'saas', description: 'Bold, futuristic, tech-forward.' },
  { id: 'saas', label: 'SaaS', layoutPatterns: ['modern-startup', 'premium-saas', 'bento-grid'], typographyStyle: 'modern', seed: '#2563eb', mode: 'light', iconNiche: 'technology', animationStyle: 'tech', imageStyle: 'product-clean', sectionArchetype: 'saas', description: 'Premium product-led conversion design.' },
  { id: 'portfolio', label: 'Portfolio', layoutPatterns: ['minimal', 'editorial', 'split-hero'], typographyStyle: 'minimalist', seed: '#171717', mode: 'light', iconNiche: 'creative', animationStyle: 'soft', imageStyle: 'personal-editorial', sectionArchetype: 'creative', description: 'Personal brand as a clean canvas.' },
  { id: 'agency', label: 'Agency', layoutPatterns: ['creative-agency', 'bento-grid', 'editorial'], typographyStyle: 'creative', seed: '#ff4d00', mode: 'light', iconNiche: 'creative', animationStyle: 'playful', imageStyle: 'agency-studio', sectionArchetype: 'agency', description: 'Show-stopping creative proof.' },
  { id: 'photography', label: 'Photography', layoutPatterns: ['minimal', 'masonry', 'editorial'], typographyStyle: 'minimalist', seed: '#1a1a1a', mode: 'dark', iconNiche: 'creative', animationStyle: 'soft', imageStyle: 'photography-gallery', sectionArchetype: 'creative', description: 'The work speaks; design stays out of the way.' },
  { id: 'architecture', label: 'Architecture', layoutPatterns: ['architecture', 'editorial', 'alternating'], typographyStyle: 'minimalist', seed: '#4a4a4a', mode: 'light', iconNiche: 'construction', animationStyle: 'calm', imageStyle: 'architecture-studio', sectionArchetype: 'corporate', description: 'Precise, geometric, sculptural.' },
  { id: 'consulting', label: 'Consulting', layoutPatterns: ['corporate', 'editorial', 'alternating'], typographyStyle: 'classic', seed: '#33415c', mode: 'light', iconNiche: 'corporate', animationStyle: 'calm', imageStyle: 'corporate-clean', sectionArchetype: 'corporate', description: 'Senior, analytical, credible.' },
  { id: 'automotive', label: 'Automotive', layoutPatterns: ['punchy', 'split-hero', 'card-grid'], typographyStyle: 'energetic', seed: '#b02a2a', mode: 'dark', iconNiche: 'automotive', animationStyle: 'punchy', imageStyle: 'automotive-dynamic', sectionArchetype: 'corporate', description: 'Speed, power, precision.' },
  { id: 'healthcare', label: 'Healthcare', layoutPatterns: ['medical', 'card-grid', 'centered-hero'], typographyStyle: 'modern', seed: '#0e7490', mode: 'light', iconNiche: 'healthcare', animationStyle: 'calm', imageStyle: 'clean-clinical', sectionArchetype: 'medical', description: 'Empathetic, clear, clinical.' },
  { id: 'education', label: 'Education', layoutPatterns: ['education', 'card-grid', 'alternating'], typographyStyle: 'friendly', seed: '#3b82c4', mode: 'light', iconNiche: 'education', animationStyle: 'playful', imageStyle: 'bright-educational', sectionArchetype: 'education', description: 'Inspirational learning environments.' },
  { id: 'non-profit', label: 'Non-Profit', layoutPatterns: ['centered-hero', 'card-grid', 'editorial'], typographyStyle: 'friendly', seed: '#3a7d5c', mode: 'light', iconNiche: 'community', animationStyle: 'warm', imageStyle: 'humanitarian-clean', sectionArchetype: 'community', description: 'Human-centered storytelling that moves.' },
  { id: 'ecommerce', label: 'E-commerce', layoutPatterns: ['store', 'card-grid', 'bento-grid'], typographyStyle: 'modern', seed: '#d97706', mode: 'light', iconNiche: 'ecommerce', animationStyle: 'warm', imageStyle: 'product-clean', sectionArchetype: 'ecommerce', description: 'Shoppable, scannable, persuasive.' },
  { id: 'financial-services', label: 'Financial Services', layoutPatterns: ['corporate', 'finance', 'editorial'], typographyStyle: 'classic', seed: '#0f4c81', mode: 'light', iconNiche: 'finance', animationStyle: 'calm', imageStyle: 'corporate-clean', sectionArchetype: 'finance', description: 'Stability, precision, trust.' },
  { id: 'event-planning', label: 'Event Planning', layoutPatterns: ['luxury', 'editorial', 'centered-hero'], typographyStyle: 'elegant', seed: '#b03a5b', mode: 'light', iconNiche: 'events', animationStyle: 'soft', imageStyle: 'event-elegant', sectionArchetype: 'events', description: 'Celebratory, elegant, memorable.' },
  { id: 'wedding', label: 'Wedding', layoutPatterns: ['luxury', 'editorial', 'centered-hero'], typographyStyle: 'elegant', seed: '#c98a9b', mode: 'light', iconNiche: 'events', animationStyle: 'soft', imageStyle: 'wedding-romantic', sectionArchetype: 'events', description: 'Romantic, timeless, refined.' },
  { id: 'music', label: 'Music', layoutPatterns: ['creative-agency', 'gradient', 'masonry'], typographyStyle: 'creative', seed: '#9333ea', mode: 'dark', iconNiche: 'music', animationStyle: 'playful', imageStyle: 'music-live', sectionArchetype: 'creative', description: 'Rhythm, energy, stage presence.' },
  { id: 'creator', label: 'Creator', layoutPatterns: ['creative-agency', 'bento-grid', 'minimal'], typographyStyle: 'creative', seed: '#e11d48', mode: 'light', iconNiche: 'creative', animationStyle: 'playful', imageStyle: 'creator-candid', sectionArchetype: 'creative', description: 'Personal brand with maximal presence.' },
  { id: 'ai-startup', label: 'AI Startup', layoutPatterns: ['glass', 'gradient', 'modern-startup'], typographyStyle: 'geometric', seed: '#7c3aed', mode: 'dark', iconNiche: 'technology', animationStyle: 'tech', imageStyle: 'futuristic-abstract', sectionArchetype: 'saas', description: 'Cutting-edge, intelligent, premium-tech.' },
  { id: 'technology', label: 'Technology', layoutPatterns: ['modern-startup', 'bento-grid', 'glass'], typographyStyle: 'geometric', seed: '#0ea5e9', mode: 'light', iconNiche: 'technology', animationStyle: 'tech', imageStyle: 'product-clean', sectionArchetype: 'saas', description: 'Forward-thinking, clean, precise.' },
  { id: 'marketing', label: 'Marketing', layoutPatterns: ['creative-agency', 'bento-grid', 'editorial'], typographyStyle: 'creative', seed: '#f97316', mode: 'light', iconNiche: 'marketing', animationStyle: 'playful', imageStyle: 'agency-studio', sectionArchetype: 'agency', description: 'Persuasive, energetic, results-driven.' },
  { id: 'dentist', label: 'Dentist', layoutPatterns: ['medical', 'centered-hero', 'card-grid'], typographyStyle: 'friendly', seed: '#2a9d8f', mode: 'light', iconNiche: 'healthcare', animationStyle: 'calm', imageStyle: 'clean-clinical', sectionArchetype: 'medical', description: 'Gentle, clean, reassuring.' },
  { id: 'interior-design', label: 'Interior Design', layoutPatterns: ['architecture', 'editorial', 'masonry'], typographyStyle: 'elegant', seed: '#8a7a5c', mode: 'light', iconNiche: 'construction', animationStyle: 'soft', imageStyle: 'interior-styling', sectionArchetype: 'corporate', description: 'Curated spaces, layered textures.' },
];

const INDUSTRY_KEYWORDS: Array<{ id: string; keywords: string[] }> = [
  { id: 'restaurant', keywords: ['restaurant', 'cafe', 'café', 'bistro', 'diner', 'food', 'kitchen', 'dining', 'bakery', 'grill', 'pizzeria', 'bar and grill', 'catering'] },
  { id: 'law-firm', keywords: ['law', 'legal', 'attorney', 'lawyer', 'firm', 'solicitor', 'barrister', 'notary'] },
  { id: 'hospital', keywords: ['hospital', 'clinic', 'urgent care', 'medical center', 'health center'] },
  { id: 'hotel', keywords: ['hotel', 'resort', 'lodge', 'inn', 'guesthouse', 'bed and breakfast', 'suite'] },
  { id: 'school', keywords: ['school', 'academy', 'daycare', 'kindergarten', 'college', 'university', 'boarding', 'campus'] },
  { id: 'church', keywords: ['church', 'ministry', 'chapel', 'parish', 'worship', 'fellowship', 'mosque', 'temple'] },
  { id: 'beauty-salon', keywords: ['beauty', 'salon', 'spa', 'nails', 'nail salon', 'esthetics', 'skincare', 'lash', 'aesthetics'] },
  { id: 'barbershop', keywords: ['barber', 'barbershop', 'grooming', 'shave', 'haircut'] },
  { id: 'fashion', keywords: ['fashion', 'clothing', 'apparel', 'boutique', 'style', 'garment', 'attire', 'outfit'] },
  { id: 'gym', keywords: ['gym', 'fitness', 'crossfit', 'workout', 'training', 'personal training', 'bootcamp', 'bodybuilding', 'yoga studio', 'pilates'] },
  { id: 'real-estate', keywords: ['real estate', 'property', 'realtor', 'homes', 'housing', 'apartments', 'listings', 'estate agent', 'mortgage'] },
  { id: 'construction', keywords: ['construction', 'building', 'contractor', 'renovation', 'remodeling', 'roofing', 'excavation', 'masonry', 'electrical', 'plumbing'] },
  { id: 'travel', keywords: ['travel', 'tourism', 'tour', 'tours', 'vacation', 'holiday', 'adventure', 'excursion', 'safari', 'getaway', 'destination'] },
  { id: 'crypto', keywords: ['crypto', 'bitcoin', 'blockchain', 'web3', 'defi', 'token', 'nft', 'exchange', 'cryptocurrency'] },
  { id: 'saas', keywords: ['saas', 'software', 'platform', 'app', 'startup', 'b2b', 'cloud', 'subscription', 'automation', 'tool'] },
  { id: 'portfolio', keywords: ['portfolio', 'personal brand', 'freelancer', 'designer', 'developer', 'photographer portfolio'] },
  { id: 'agency', keywords: ['agency', 'creative agency', 'studio', 'marketing agency', 'digital agency', 'branding agency'] },
  { id: 'photography', keywords: ['photography', 'photographer', 'photo studio', 'videography', 'cinematography'] },
  { id: 'architecture', keywords: ['architecture', 'architect', 'interior design', 'urban design', 'landscape design'] },
  { id: 'consulting', keywords: ['consulting', 'consultant', 'advisory', 'strategy', 'business coaching', 'mentorship'] },
  { id: 'automotive', keywords: ['auto', 'automotive', 'car', 'cars', 'dealership', 'mechanic', 'garage', 'motors', 'vehicle', 'truck', 'repair'] },
  { id: 'healthcare', keywords: ['healthcare', 'health', 'medical', 'doctor', 'physician', 'pharmacy', 'therapy', 'wellness', 'dentist', 'dental'] },
  { id: 'education', keywords: ['education', 'learning', 'training', 'courses', 'tutoring', 'tutor', 'classes', 'workshop', 'seminar'] },
  { id: 'non-profit', keywords: ['non-profit', 'nonprofit', 'charity', 'foundation', 'ngo', 'community', 'relief', 'volunteer', 'donation'] },
  { id: 'ecommerce', keywords: ['ecommerce', 'e-commerce', 'online store', 'shop', 'store', 'retail', 'marketplace', 'products', 'shopify'] },
  { id: 'financial-services', keywords: ['finance', 'financial', 'bank', 'banking', 'investment', 'insurance', 'accounting', 'bookkeeping', 'tax', 'wealth', 'loan'] },
  { id: 'event-planning', keywords: ['event', 'events', 'event planning', 'conference', 'party', 'celebration', 'wedding planner', 'venue'] },
  { id: 'wedding', keywords: ['wedding', 'bridal', 'marriage', 'bride', 'groom'] },
  { id: 'music', keywords: ['music', 'band', 'artist', 'singer', 'dj', 'producer', 'record label', 'orchestra'] },
  { id: 'creator', keywords: ['creator', 'influencer', 'youtube', 'podcast', 'streamer', 'blogger', 'content'] },
  { id: 'ai-startup', keywords: ['ai', 'artificial intelligence', 'machine learning', 'llm', 'agent', 'gpt', 'intelligence', 'robotics'] },
  { id: 'technology', keywords: ['technology', 'tech', 'software development', 'it', 'cybersecurity', 'devops', 'data', 'engineering'] },
  { id: 'marketing', keywords: ['marketing', 'seo', 'social media', 'advertising', 'branding', 'digital marketing', 'growth'] },
  { id: 'dentist', keywords: ['dentist', 'dental', 'orthodontist', 'smile', 'teeth'] },
  { id: 'interior-design', keywords: ['interior', 'decor', 'decoration', 'furniture', 'staging', 'home styling'] },
];

const KEYWORD_FALLBACKS: Record<string, string> = {
  restaurant: 'restaurant',
  'law-firm': 'law firm',
  hospital: 'hospital',
  hotel: 'hotel',
  school: 'school',
  church: 'church',
  'beauty-salon': 'beauty salon',
  barbershop: 'barbershop',
  fashion: 'fashion',
  gym: 'gym',
  'real-estate': 'real estate',
  construction: 'construction',
  travel: 'travel',
  crypto: 'crypto',
  saas: 'saas',
  portfolio: 'portfolio',
  agency: 'agency',
  photography: 'photography',
  architecture: 'architecture',
  consulting: 'consulting',
  automotive: 'automotive',
  healthcare: 'healthcare',
  education: 'education',
  'non-profit': 'non-profit',
  ecommerce: 'ecommerce',
  'financial-services': 'financial services',
  'event-planning': 'event planning',
  wedding: 'wedding',
  music: 'music',
  creator: 'creator',
  'ai-startup': 'ai startup',
  technology: 'technology',
  marketing: 'marketing',
  dentist: 'dentist',
  'interior-design': 'interior design',
};

const NOISE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'for', 'with', 'our', 'your', 'we', 'us', 'of', 'to', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'be', 'that', 'this', 'it', 'as', 'or', 'from', 'services', 'business', 'company', 'best', 'professional', 'quality', 'experience', 'team',
]);

/**
 * Classify a business description into an IndustryProfile.
 * Returns the profile with the most keyword hits; falls back to `saas` when
 * no signal exists, then to the default agency profile for creative ambiguity.
 */
export function classifyIndustry(description: string): IndustryProfile {
  const text = ` ${description.toLowerCase()} `;
  let best: { id: string; hits: number } = { id: 'saas', hits: 0 };
  for (const entry of INDUSTRY_KEYWORDS) {
    let hits = 0;
    for (const keyword of entry.keywords) {
      if (text.includes(keyword)) {
        // Weight full-word phrases higher than generic substrings (e.g. "car").
        hits += keyword.length > 4 ? 2 : 1;
      }
    }
    if (hits > best.hits) {
      best = { id: entry.id, hits };
    }
  }
  const profile = INDUSTRY_PROFILES.find((p) => p.id === best.id) ?? INDUSTRY_PROFILES[0];
  // Clear creative ambiguity: if the business looks like a one-person shop with
  // no other signal, lean toward a portfolio/agency treatment.
  const words = description.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !NOISE_WORDS.has(w));
  if (best.hits === 0 && words.length <= 2) {
    return INDUSTRY_PROFILES.find((p) => p.id === 'portfolio') ?? profile;
  }
  return profile;
}

/** Human-readable label for an industry id. */
export function industryLabel(id: string): string {
  return KEYWORD_FALLBACKS[id] ?? id;
}

export function findIndustry(id: string): IndustryProfile | undefined {
  return INDUSTRY_PROFILES.find((p) => p.id === id);
}

export function listIndustries(): string[] {
  return INDUSTRY_PROFILES.map((p) => p.id);
}
