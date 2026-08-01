// =============================================================================
// Design Generation Engine — Icon Intelligence
// =============================================================================
// Icons are chosen by niche — never random. Each industry maps to a coherent
// icon family (lucide-style names) that matches its vocabulary: medical icons
// for healthcare, food icons for restaurants, banking icons for finance,
// learning icons for education, and so on.
// =============================================================================

import type { IndustryProfile } from './types';

export interface IconSet {
  family: string;
  set: string[];
}

export const ICON_SETS: Record<string, IconSet> = {
  healthcare: { family: 'medical', set: ['stethoscope', 'heart-pulse', 'activity', 'shield-plus', 'syringe', 'pill', 'hospital', 'user-check'] },
  food: { family: 'food', set: ['utensils', 'chef-hat', 'coffee', 'wine', 'sandwich', 'salad', 'flame', 'star'] },
  finance: { family: 'banking', set: ['landmark', 'chart-line', 'wallet', 'banknote', 'percent', 'shield-check', 'trending-up', 'piggy-bank'] },
  education: { family: 'learning', set: ['graduation-cap', 'book-open', 'pen-tool', 'lightbulb', 'award', 'school', 'users', 'layers'] },
  legal: { family: 'legal', set: ['scale', 'gavel', 'file-text', 'shield', 'briefcase', 'check-square', 'book', 'users'] },
  fitness: { family: 'fitness', set: ['dumbbell', 'heart', 'flame', 'trophy', 'target', 'clock', 'activity', 'zap'] },
  realestate: { family: 'property', set: ['home', 'building-2', 'key', 'map-pin', 'area-chart', 'badge-check', 'sofa', 'landmark'] },
  travel: { family: 'travel', set: ['plane', 'map', 'compass', 'mountain', 'camera', 'sun', 'globe', 'ticket'] },
  automotive: { family: 'automotive', set: ['car', 'wrench', 'gauge', 'settings', 'shield-check', 'zap', 'steering', 'badge-check'] },
  technology: { family: 'technology', set: ['cpu', 'bot', 'database', 'cloud', 'code', 'rocket', 'zap', 'network'] },
  ecommerce: { family: 'commerce', set: ['shopping-bag', 'truck', 'credit-card', 'tag', 'package', 'refresh-cw', 'gift', 'star'] },
  construction: { family: 'construction', set: ['hammer', 'hard-hat', 'ruler', 'drill', 'building', 'shield', 'truck', 'check-circle'] },
  beauty: { family: 'beauty', set: ['sparkles', 'flower', 'droplet', 'scissors', 'heart', 'star', 'wand', 'gem'] },
  grooming: { family: 'grooming', set: ['scissors', 'razor', 'droplet', 'star', 'clock', 'user', 'sparkles', 'shield'] },
  creative: { family: 'creative', set: ['palette', 'pen-tool', 'camera', 'layout', 'wand', 'image', 'type', 'mouse-pointer'] },
  music: { family: 'music', set: ['music', 'disc', 'mic', 'headphones', 'radio', 'volume-2', 'star', 'play'] },
  events: { family: 'events', set: ['calendar', 'camera', 'sparkles', 'heart', 'users', 'music', 'gift', 'clock'] },
  marketing: { family: 'marketing', set: ['megaphone', 'target', 'bar-chart', 'search', 'trending-up', 'share-2', 'globe', 'zap'] },
  community: { family: 'community', set: ['heart', 'users', 'hands', 'sun', 'flower', 'globe', 'sparkles', 'hand-heart'] },
  corporate: { family: 'corporate', set: ['briefcase', 'users', 'target', 'chart-line', 'shield', 'check-square', 'building', 'award'] },
  default: { family: 'interface', set: ['sparkles', 'check-circle', 'arrow-right', 'star', 'zap', 'shield', 'layers', 'target'] },
};

const INDUSTRY_ICON_NICHE: Record<string, string> = {
  restaurant: 'food',
  'law-firm': 'legal',
  hospital: 'healthcare',
  hotel: 'travel',
  school: 'education',
  church: 'community',
  'beauty-salon': 'beauty',
  barbershop: 'grooming',
  fashion: 'creative',
  gym: 'fitness',
  'real-estate': 'realestate',
  construction: 'construction',
  travel: 'travel',
  crypto: 'technology',
  saas: 'technology',
  portfolio: 'creative',
  agency: 'creative',
  photography: 'creative',
  architecture: 'construction',
  consulting: 'corporate',
  automotive: 'automotive',
  healthcare: 'healthcare',
  education: 'education',
  'non-profit': 'community',
  ecommerce: 'ecommerce',
  'financial-services': 'finance',
  'event-planning': 'events',
  wedding: 'events',
  music: 'music',
  creator: 'creative',
  'ai-startup': 'technology',
  technology: 'technology',
  marketing: 'marketing',
  dentist: 'healthcare',
  'interior-design': 'construction',
};

/** Pick the icon set for an industry; falls back to the interface set. */
export function buildIconSet(profile: IndustryProfile): IconSet {
  const niche = INDUSTRY_ICON_NICHE[profile.id] ?? profile.iconNiche ?? 'default';
  return ICON_SETS[niche] ?? ICON_SETS.default;
}

export function listIconNiches(): string[] {
  return Object.keys(ICON_SETS);
}
