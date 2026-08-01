// =============================================================================
// Design Generation Engine — Image Direction Engine
// =============================================================================
// Every section gets a full image specification: purpose, composition, camera
// angle, lighting, mood, color grading, style, a reusable prompt, and aspect
// ratio. When image generation is added later, these prompts drop straight in.
// =============================================================================

import type { ImageSpec, IndustryProfile } from './types';

export interface ImageStyleProfile {
  style: string;
  colorGrading: string;
  mood: string;
  lighting: string;
}

export const IMAGE_STYLE_PROFILES: Record<string, ImageStyleProfile> = {
  'editorial-food': { style: 'editorial food photography, shallow depth of field', colorGrading: 'warm amber tones, rich shadows', mood: 'appetizing, cozy', lighting: 'soft window light with dramatic falloff' },
  'corporate-clean': { style: 'corporate photography, clean minimal environment', colorGrading: 'cool neutral tones, high clarity', mood: 'professional, confident', lighting: 'soft studio light, even exposure' },
  'clean-clinical': { style: 'clinical photography, bright modern facility', colorGrading: 'clean whites and cool blues', mood: 'calm, trustworthy', lighting: 'bright ambient with soft highlights' },
  'luxury-hospitality': { style: 'luxury hospitality photography', colorGrading: 'warm golds, deep neutrals', mood: 'indulgent, serene', lighting: 'golden hour with soft ambient' },
  'bright-educational': { style: 'bright lifestyle photography of learning', colorGrading: 'vivid, cheerful palette', mood: 'optimistic, engaging', lighting: 'natural daylight, high key' },
  'warm-gathering': { style: 'documentary photography of community gatherings', colorGrading: 'warm, natural tones', mood: 'welcoming, heartfelt', lighting: 'natural light, candid' },
  'beauty-studio': { style: 'beauty studio photography', colorGrading: 'soft rose and champagne tones', mood: 'elegant, refined', lighting: 'soft diffused beauty light' },
  'bold-studio': { style: 'bold studio portrait photography', colorGrading: 'high-contrast monochrome with warm accents', mood: 'confident, edgy', lighting: 'dramatic directional light' },
  'high-fashion': { style: 'high-fashion editorial photography', colorGrading: 'muted, desaturated luxury tones', mood: 'aspirational, avant-garde', lighting: 'controlled studio lighting, sculpted' },
  'dynamic-athletic': { style: 'dynamic athletic photography, motion energy', colorGrading: 'vibrant saturated tones', mood: 'intense, motivating', lighting: 'dramatic rim light, high contrast' },
  'property-architectural': { style: 'architectural real-estate photography', colorGrading: 'natural warm light, true-to-life tones', mood: 'premium, aspirational', lighting: 'golden hour exterior, soft interior' },
  'industrial-clean': { style: 'industrial photography with clean composition', colorGrading: 'earthy tones with blue sky accents', mood: 'solid, reliable', lighting: 'natural daylight, crisp' },
  'travel-adventure': { style: 'travel photography, epic landscapes', colorGrading: 'vivid, cinematic color', mood: 'adventurous, free', lighting: 'golden hour and dramatic skies' },
  'futuristic-abstract': { style: 'futuristic abstract 3D renders', colorGrading: 'neon gradients on deep dark', mood: 'innovative, visionary', lighting: 'glowing volumetric light' },
  'product-clean': { style: 'clean product photography on minimal backgrounds', colorGrading: 'bright, airy, soft shadows', mood: 'precise, premium', lighting: 'softbox lighting, white space' },
  'personal-editorial': { style: 'personal editorial photography', colorGrading: 'film-like, warm neutral', mood: 'authentic, personal', lighting: 'mixed natural light, candid' },
  'agency-studio': { style: 'creative agency campaign photography', colorGrading: 'bold color-blocked grading', mood: 'bold, clever', lighting: 'studio lighting with graphic shadows' },
  'photography-gallery': { style: 'fine-art photography presentation', colorGrading: 'curated per series', mood: 'artistic, contemplative', lighting: 'gallery-quality lighting' },
  'architecture-studio': { style: 'architectural photography, geometric precision', colorGrading: 'clean, monochromatic with sky', mood: 'precise, timeless', lighting: 'structured daylight and shadows' },
  'automotive-dynamic': { style: 'automotive photography, dynamic angles', colorGrading: 'high-contrast with metallic highlights', mood: 'powerful, sleek', lighting: 'studio strip lighting, reflections' },
  'humanitarian-clean': { style: 'humanitarian photography, honest and warm', colorGrading: 'natural, hopeful tones', mood: 'empathetic, inspiring', lighting: 'natural light, candid moments' },
  'event-elegant': { style: 'elegant event photography', colorGrading: 'soft warm tones, bokeh', mood: 'celebratory, refined', lighting: 'ambient event lighting with warm accents' },
  'wedding-romantic': { style: 'romantic wedding photography', colorGrading: 'soft pastel, dreamy haze', mood: 'romantic, timeless', lighting: 'golden hour, soft backlight' },
  'music-live': { style: 'live music photography, stage energy', colorGrading: 'vivid stage lighting, deep blacks', mood: 'electric, alive', lighting: 'colored stage lights, motion blur' },
  'creator-candid': { style: 'candid creator lifestyle photography', colorGrading: 'vibrant, authentic', mood: 'relatable, energetic', lighting: 'natural light, everyday settings' },
  'interior-styling': { style: 'interior design photography, styled spaces', colorGrading: 'warm neutrals, texture-forward', mood: 'curated, inviting', lighting: 'soft daylight with layered accents' },
};

const SECTION_IMAGE_PURPOSE: Record<string, { purpose: string; composition: string; angle: string; ratio: string }> = {
  hero: { purpose: 'Emotional opener that sets the brand atmosphere', composition: 'Subject anchored to one side with negative space for copy', angle: 'eye-level or slight low angle', ratio: '16/9' },
  gallery: { purpose: 'Portfolio of work, spaces, or moments', composition: 'Mixed compositions in a grid', angle: 'varied angles for rhythm', ratio: '4/3' },
  portfolio: { purpose: 'Showcase of completed work', composition: 'Hero shot per project', angle: 'front-facing, centered', ratio: '4/3' },
  menu: { purpose: 'Signature dishes that trigger appetite', composition: 'Overhead or 45° plating shot', angle: '45° or top-down', ratio: '1/1' },
  chef: { purpose: 'Humanizes the craft behind the food', composition: 'Chef mid-action in kitchen', angle: 'candid three-quarter', ratio: '3/4' },
  reservation: { purpose: 'Inviting dining room atmosphere', composition: 'Room perspective, tables set', angle: 'wide eye-level', ratio: '16/9' },
  services: { purpose: 'The service in action', composition: 'One strong example per service', angle: 'eye-level', ratio: '4/3' },
  'why-us': { purpose: 'Facility or team proof point', composition: 'Team or facility environment', angle: 'eye-level', ratio: '4/3' },
  team: { purpose: 'Faces that build trust', composition: 'Individual portraits', angle: 'eye-level portrait', ratio: '3/4' },
  trainers: { purpose: 'Coaches mid-session', composition: 'Action portrait', angle: 'low angle dynamic', ratio: '3/4' },
  faculty: { purpose: 'Educators and mentors', composition: 'Professional portraits', angle: 'eye-level portrait', ratio: '3/4' },
  agents: { purpose: 'Agents who sell the properties', composition: 'Professional portraits', angle: 'eye-level portrait', ratio: '3/4' },
  featured: { purpose: 'Flagship property or product', composition: 'Front elevation, clean sky', angle: 'wide architectural', ratio: '16/9' },
  destinations: { purpose: 'Destinations that inspire booking', composition: 'Landscape with foreground interest', angle: 'wide angle', ratio: '16/9' },
  experiences: { purpose: 'Activities guests can book', composition: 'Candid activity shots', angle: 'action eye-level', ratio: '4/3' },
  programs: { purpose: 'Programs and courses offered', composition: 'Classroom or activity scenes', angle: 'eye-level', ratio: '4/3' },
  about: { purpose: 'The people behind the brand', composition: 'Group or founder shot', angle: 'eye-level', ratio: '4/3' },
  work: { purpose: 'Case studies and client results', composition: 'Project hero per case', angle: 'front-facing', ratio: '16/9' },
  products: { purpose: 'Products shoppers can buy', composition: 'Clean product shot', angle: 'three-quarter', ratio: '1/1' },
  categories: { purpose: 'Product categories as entry points', composition: 'Styled flat-lay per category', angle: 'top-down', ratio: '4/3' },
  cta: { purpose: 'Emotional closer that drives action', composition: 'Atmospheric wide shot', angle: 'wide', ratio: '21/9' },
  contact: { purpose: 'Location and human touch', composition: 'Storefront or team', angle: 'eye-level', ratio: '16/9' },
};

function titleCase(text: string): string {
  return text.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Build the image direction for every section in the order. Prompts are
 * assembled from the business name, section purpose, style profile, and
 * composition — directly reusable by any future image generator.
 */
export function buildImageDirection(sectionOrder: string[], profile: IndustryProfile, businessName: string): ImageSpec[] {
  const styleProfile = IMAGE_STYLE_PROFILES[profile.imageStyle] ?? IMAGE_STYLE_PROFILES['product-clean'];
  return sectionOrder.map((sectionType) => {
    const plan = SECTION_IMAGE_PURPOSE[sectionType] ?? { purpose: `${titleCase(sectionType)} visual`, composition: 'Clean, intentional composition', angle: 'eye-level', ratio: '4/3' };
    return {
      sectionType,
      purpose: plan.purpose,
      composition: plan.composition,
      cameraAngle: plan.angle,
      lighting: styleProfile.lighting,
      mood: styleProfile.mood,
      colorGrading: styleProfile.colorGrading,
      style: styleProfile.style,
      prompt: `${businessName} — ${plan.purpose.toLowerCase()}. ${plan.composition}. ${plan.angle} camera. ${styleProfile.lighting}. ${styleProfile.mood} mood. ${styleProfile.colorGrading}. ${styleProfile.style}.`,
      aspectRatio: plan.ratio,
    };
  });
}
