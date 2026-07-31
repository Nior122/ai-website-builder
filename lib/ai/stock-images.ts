// =============================================================================
// Free Stock Image Resolver — Unsplash CDN + picsum fallback
// =============================================================================
// Resolves section image needs to stable, hotlinkable free stock photos.
// No API key required: images are served from the images.unsplash.com CDN,
// so generation never has to pay for (or wait on) an image model.
//
// Selection is deterministic: the same query/seed always yields the same
// photo, so re-runs and re-renders stay consistent.
// =============================================================================

export interface StockImageOptions {
  query?: string;
  sectionType?: string;
  industry?: string;
  alt?: string;
  seed?: string;
  width?: number;
  height?: number;
}

// Type alias (not interface) so it stays assignable to Record<string, unknown> —
// interfaces don't get the implicit index signature type aliases do.
export type StockImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading: 'lazy' | 'eager';
};

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

// ─── Curated Unsplash photo library (stable IDs, hotlink-friendly) ──────

type Category = string;

const LIBRARY: Record<Category, string[]> = {
  hero: [
    'photo-1497366216548-37526070297c', // bright office
    'photo-1497366754035-f200968a6e72', // laptop on desk
    'photo-1504384308090-c894fdcc538d', // workspace
    'photo-1499951360447-b19be8fe80f5', // dark workspace
    'photo-1460925895917-afdab827c52f', // analytics laptop
  ],
  team: [
    'photo-1522071820081-009f0129c71c',
    'photo-1521737711867-e3b97375f902',
    'photo-1552664730-d307ca884978',
    'photo-1521737604893-d14cc237f11d',
    'photo-1556761175-5973dc0f32e7',
  ],
  portrait: [
    'photo-1544005313-94ddf0286df2',
    'photo-1507003211169-0a1dd7228f2d',
    'photo-1494790108377-be9c29b29330',
    'photo-1438761681033-6461ffad8d80',
  ],
  office: [
    'photo-1497366216548-37526070297c',
    'photo-1497366754035-f200968a6e72',
    'photo-1504384308090-c894fdcc538d',
    'photo-1526406915894-7bcd65f60845',
    'photo-1497215728101-856f4ea42174',
  ],
  tech: [
    'photo-1461749280684-dccba630e2f6', // code on screen
    'photo-1518770660439-4636190af475', // circuit board
    'photo-1531297484001-80022131f5a1', // laptop, dark
    'photo-1517180102446-f3ece451e9d8', // keyboard close-up
    'photo-1519389950473-47ba0277781c', // team at laptops
  ],
  product: [
    'photo-1523275335684-37898b6baf30', // watch
    'photo-1505740420928-5e560c06d30e', // headphones
    'photo-1526170375885-4d8ecf77b99f', // camera
    'photo-1542291026-7eec264c27ff', // red shoe
    'photo-1560343090-f0409e92791a', // white sneaker
  ],
  food: [
    'photo-1504674900247-0877df9cc836',
    'photo-1546069901-ba9599a7e63c',
    'photo-1565299624946-b28f40a0ae38',
    'photo-1512621776951-a57141f2eefd',
  ],
  travel: [
    'photo-1502920917128-1aa500764cbd', // aerial beach
    'photo-1476514525535-07fb3b4ae5f1', // canoe
    'photo-1506905925346-21bda4d32df4', // mountain
    'photo-1488646953014-85cb44e25828', // travel flat lay
  ],
  home: [
    'photo-1568605114967-8130f3a36994',
    'photo-1512917774080-9991f1c4c750',
    'photo-1600596542815-ffad4c1539a9',
    'photo-1600607687939-ce8a6c25118c',
  ],
  nature: [
    'photo-1470071459604-3b5ec3a7fe05',
    'photo-1441974231531-c6227db76b6e',
    'photo-1506744038136-46273834b3fb',
  ],
  fashion: [
    'photo-1445205170230-053b83016050',
    'photo-1483985988355-763728e1935b',
    'photo-1490481651871-ab68de25d43d',
    'photo-1487222477894-8943e31ef7b2',
  ],
  fitness: [
    'photo-1517836357463-d25dfeac3438',
    'photo-1571019613454-1cb2f99b2d8b',
    'photo-1534438327276-14e5300c3a48',
  ],
  education: [
    'photo-1523050854058-8df90110c9f1',
    'photo-1503676260728-1c00da094a0b',
    'photo-1427504494785-3a9ca7044f45',
    'photo-1580894732444-8ecded7900cd',
  ],
  health: [
    'photo-1505751172876-fa1923c5c528',
    'photo-1579684385127-1ef15d508118',
    'photo-1550831107-1553da8c8464',
  ],
  finance: [
    'photo-1554224155-6726b3ff858f', // calculator
    'photo-1565514020179-026b92b84bb6', // analytics
    'photo-1551288049-bebda4e38f71', // charts
    'photo-1454165804606-c3d57bc86b40', // strategy
  ],
  construction: [
    'photo-1504307651254-35680f356dfd',
    'photo-1541888946425-d81bb19240f5',
    'photo-1531834685032-c34bf0d84c77',
  ],
  cta: [
    'photo-1517245386807-bb43f82c33c4',
    'photo-1499951360447-b19be8fe80f5',
    'photo-1460925895917-afdab827c52f',
  ],
  abstract: [
    'photo-1557683316-973673baf926',
    'photo-1558591710-4b4a1ae0f04d',
    'photo-1620121692029-d088224ddc74',
    'photo-1541701494587-cb58502866ab',
  ],
};

// Keyword → category rules. Checked against query + section type + industry,
// in order (more specific first).
const KEYWORD_RULES: Array<[RegExp, string]> = [
  [/team|staff|employee|people|collaborat|together|meeting|group/i, 'team'],
  [/portrait|headshot|face|avatar|person|founder|ceo|client/i, 'portrait'],
  [/office|workspace|desk|cowork|corporate|interior|meeting room/i, 'office'],
  [/tech|software|code|developer|startup|app|digital|data|ai|robot|computer/i, 'tech'],
  [/product|watch|headphone|gadget|device|camera|shoe|fashion item/i, 'product'],
  [/food|restaurant|caf|meal|kitchen|bake|dinner|lunch|breakfast|cuisine|bar/i, 'food'],
  [/travel|hotel|beach|resort|vacation|tour|destination|flight|island/i, 'travel'],
  [/real ?estate|house|home|property|apartment|building|interior|renovation|architect/i, 'home'],
  [/garden|nature|forest|outdoor|park|landscape|mountain|sea|lake|plant/i, 'nature'],
  [/fashion|clothing|apparel|style|shop|boutique|outfit|wear|beauty/i, 'fashion'],
  [/fitness|gym|workout|sport|exercise|yoga|train|health club/i, 'fitness'],
  [/education|school|university|college|course|learning|academy|study|student/i, 'education'],
  [/health|medical|doctor|clinic|hospital|care|wellness|pharma/i, 'health'],
  [/finance|bank|accounting|invest|insurance|money|tax|payment/i, 'finance'],
  [/construction|building site|contractor|builder|industrial|manufactur/i, 'construction'],
  [/gradient|abstract|texture|pattern|color/i, 'abstract'],
];

// Section types that are always wide (hero/banner) or always square (grids).
const SECTION_SIZES: Record<string, { width: number; height: number }> = {
  hero: { width: 1600, height: 900 },
  heroWithProduct: { width: 1600, height: 900 },
  videoBackground: { width: 1600, height: 900 },
  splitSection: { width: 1200, height: 900 },
  cta: { width: 1600, height: 900 },
  gallery: { width: 800, height: 800 },
  portfolio: { width: 800, height: 800 },
  team: { width: 800, height: 800 },
  testimonial: { width: 800, height: 800 },
  beforeAfter: { width: 800, height: 800 },
};

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick(ids: string[], seed: string): string {
  return ids[hashSeed(seed) % ids.length];
}

function unsplashUrl(id: string, width: number, height: number): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

function detectCategory(opts: StockImageOptions): string {
  const text = [opts.query, opts.sectionType, opts.industry]
    .filter(Boolean)
    .join(' ')
    .trim();

  for (const [re, cat] of KEYWORD_RULES) {
    if (re.test(text)) return cat;
  }

  // Fall back to the section type itself (covers custom/unlisted types).
  const type = (opts.sectionType || '').toLowerCase();
  if (LIBRARY[type]) return type;

  return 'hero';
}

/**
 * Resolve a single free stock image for a section, deterministically.
 */
export function resolveStockImage(opts: StockImageOptions): StockImage {
  const size = SECTION_SIZES[(opts.sectionType || '').toLowerCase()] || {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  };
  const width = opts.width || size.width;
  const height = opts.height || size.height;

  const category = detectCategory(opts);
  const seedKey = opts.seed || `${category}:${opts.query || opts.sectionType || 'image'}`;
  const alt = opts.alt || opts.query || `${category} image`;

  const ids = LIBRARY[category];
  const src = ids && ids.length > 0
    ? unsplashUrl(pick(ids, seedKey), width, height)
    // Last-resort fallback: deterministic picsum placeholder (no key needed).
    : `https://picsum.photos/seed/${encodeURIComponent(seedKey)}/${width}/${height}`;

  return {
    src,
    alt,
    width,
    height,
    loading: (opts.sectionType || '').toLowerCase() === 'hero' ? 'eager' : 'lazy',
  };
}

/**
 * Build section-`images` records (the shape the editor/renderers expect)
 * for a single section, from one or more queries.
 */
export function buildStockImages(
  opts: StockImageOptions,
  count: number = 1
): Array<Record<string, unknown>> {
  const images: Array<Record<string, unknown>> = [];
  for (let i = 0; i < Math.max(1, count); i++) {
    const img = resolveStockImage({ ...opts, seed: opts.seed ? `${opts.seed}:${i}` : undefined });
    images.push({ ...img, alt: i === 0 ? img.alt : `${img.alt} ${i + 1}` });
  }
  return images;
}
