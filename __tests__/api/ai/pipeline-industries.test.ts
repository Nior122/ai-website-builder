// =============================================================================
// 10-Industry Generation Pipeline Tests — v2 (PHASE 1)
// =============================================================================
// Runs the full staged pipeline across 10 industries with a THROWING model
// manager. Every stage's LLM refinement fails → the deterministic, curated
// industry profiles build the entire site. This proves:
//   1. Free-model resilience — the pipeline never hard-stops on model failure.
//   2. Business-specific output — unique branding / layouts / copy per industry.
//   3. Content quality — no lorem ipsum / placeholders / "Coming Soon".
//   4. Valid output — passes aiProjectOutputSchema + per-section validation.
//   5. Accurate progress — reaches 100%.
// =============================================================================

import { describe, it, expect, vi } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// A model manager whose executeWithFallback ALWAYS throws — simulates a total
// provider outage (or a free model returning unusable JSON after all retries).
// Forces every pipeline stage onto its deterministic fallback.
const mm = vi.hoisted(() => ({
  executeWithFallback: async () => { throw new Error('All models failed (mocked outage)'); },
  getActiveModelInfo: () => ({ provider: 'mock', model: 'mock/none' }),
  getPrimaryConfig: () => ({ model: 'mock/none' }),
  getAllConfigs: () => [],
  isModelAvailable: async () => false,
}));

vi.mock('@/lib/ai/model-manager', () => ({
  getModelManager: () => mm,
  resetModelManager: () => {},
  ModelManager: class {},
}));

// ─── Imports (after mocks) ─────────────────────────────────────────────

import { runGenerationPipeline } from '@/lib/ai/generation-pipeline';
import { validateGeneratedOutput } from '@/lib/ai/final-validator';
import { SUPPORTED_SECTION_TYPES } from '@/lib/ai/industry-profiles';
import type { GenerateRequest } from '@/types';
import type { AIProjectOutput } from '@/features/ai-engine/types';

// ─── Industry cases ────────────────────────────────────────────────────

interface IndustryCase {
  id: string;
  industry: string;
  businessType: string;
  businessName: string;
  tone: GenerateRequest['tone'];
  description: string;
}

const INDUSTRIES: IndustryCase[] = [
  { id: 'restaurant', industry: 'restaurant', businessType: 'restaurant', businessName: 'Trattoria Bellini', tone: 'friendly', description: 'A family-owned Italian restaurant in the city center serving handmade pasta, wood-fired pizza and regional wines since 1998.' },
  { id: 'law', industry: 'law', businessType: 'law firm', businessName: 'Hartley & Vance LLP', tone: 'authoritative', description: 'A boutique law firm specializing in family law, estate planning and commercial litigation with 25 years of practice.' },
  { id: 'salon', industry: 'salon', businessType: 'beauty salon', businessName: 'Lumina Beauty Studio', tone: 'creative', description: 'A modern beauty studio offering haircuts, balayage, keratin treatments, nails and esthetics with certified stylists.' },
  { id: 'saas', industry: 'saas', businessType: 'saas company', businessName: 'StockPilot', tone: 'corporate', description: 'A B2B SaaS platform for real-time inventory management, demand forecasting and multi-channel order sync.' },
  { id: 'ecommerce', industry: 'ecommerce', businessType: 'online store', businessName: 'Heritage Leather Co.', tone: 'creative', description: 'An online store selling handcrafted leather goods — bags, wallets and belts made from vegetable-tanned hides.' },
  { id: 'education', industry: 'education', businessType: 'school', businessName: 'Brightwood Academy', tone: 'professional', description: 'A private K-12 academy offering college-preparatory academics, arts and athletics with a 12:1 student-teacher ratio.' },
  { id: 'medical', industry: 'medical', businessType: 'hospital', businessName: 'Cedar Springs Medical Center', tone: 'professional', description: 'A regional hospital providing 24/7 emergency care, outpatient surgery, cardiology and maternity services.' },
  { id: 'church', industry: 'church', businessType: 'church', businessName: 'Grace Community Church', tone: 'friendly', description: 'A welcoming community church with Sunday services, youth groups, outreach programs and family ministries.' },
  { id: 'construction', industry: 'construction', businessType: 'construction company', businessName: 'Summit Builders Group', tone: 'authoritative', description: 'A commercial construction company delivering office, retail and industrial projects with OSHA-certified crews.' },
  { id: 'consulting', industry: 'consulting', businessType: 'consulting firm', businessName: 'Northbridge Strategy', tone: 'corporate', description: 'A management consulting firm helping mid-market companies with operations, growth strategy and digital transformation.' },
];

// ─── Assertion helpers ─────────────────────────────────────────────────

// Flags placeholder *copy* only. A `placeholder` key is a legitimate form-field
// attribute (newsletter section), so it's not treated as filler content.
const PLACEHOLDER_RE = /\b(lorem ipsum|coming soon)\b|\[your|\[insert|\[business|\[name|\[company|your business|your company|your name|\bTBD\b|\bTODO\b|\bsample text\b/i;

function flattenSections(data: AIProjectOutput): Array<{ slug: string; type: string; content: string }> {
  const flat: Array<{ slug: string; type: string; content: string }> = [];
  for (const page of data.pages) {
    for (const s of page.sections) {
      flat.push({ slug: page.slug, type: s.type, content: JSON.stringify(s.content) });
    }
  }
  return flat;
}

function runCase(c: IndustryCase) {
  return async () => {
    const request: GenerateRequest = {
      description: c.description,
      industry: c.industry,
      businessType: c.businessType,
      businessName: c.businessName,
      tone: c.tone,
      language: 'en',
    };
    const progress: number[] = [];
    const result = await runGenerationPipeline(request, {
      clerkUserId: 'user_test',
      dbUserId: 'user_test',
      onProgress: (p) => { progress.push(p.progress); },
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return; // keep TS happy after expect

    const data = result.data;

    // 1. Progress reporting reaches 100%.
    expect(Math.max(...progress)).toBe(100);

    // 2. Brand is business-specific.
    expect(data.brand.name).toBe(c.businessName);
    expect(data.brand.tagline).toBeTruthy();
    expect(data.brand.description).toBeTruthy();

    // 3. Page structure: >= 5 pages, a real homepage, every page has sections.
    expect(data.pages.length).toBeGreaterThanOrEqual(5);
    expect(data.pages.some(p => p.isHome)).toBe(true);
    for (const page of data.pages) {
      expect(page.sections.length).toBeGreaterThanOrEqual(1);
    }

    // 4. Every section type is a known registry type.
    const known = new Set(SUPPORTED_SECTION_TYPES);
    for (const s of flattenSections(data)) {
      expect(known.has(s.type)).toBe(true);
    }

    // 5. No placeholder copy anywhere.
    const all = flattenSections(data);
    for (const s of all) {
      expect(PLACEHOLDER_RE.test(s.content)).toBe(false);
    }

    // 6. Full validation gate: master schema + per-section content schemas.
    const validation = validateGeneratedOutput(data);
    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual([]);

    // 7. SEO is populated.
    expect(data.seo?.metaTitle).toBeTruthy();
    expect(Array.isArray(data.seo?.jsonLd)).toBe(true);
    expect((data.seo?.jsonLd || []).length).toBeGreaterThanOrEqual(1);
  };
}

describe('AI Generation Pipeline — 10 industries (deterministic, zero model calls)', () => {
  for (const c of INDUSTRIES) {
    it(`generates a valid, business-specific site for ${c.id}`, runCase(c));
  }

  it('produces unique branding per industry', async () => {
    const names = new Set<string>();
    const primaries = new Set<string>();
    for (const c of INDUSTRIES) {
      const result = await runGenerationPipeline(
        { description: c.description, industry: c.industry, businessType: c.businessType, businessName: c.businessName, tone: c.tone, language: 'en' },
        { clerkUserId: 'user_test', dbUserId: 'user_test' }
      );
      expect(result.success).toBe(true);
      if (!result.success || !result.data) continue;
      names.add(result.data.brand.name);
      primaries.add((result.data.brand.colors as { primary?: string })?.primary || '');
    }
    expect(names.size).toBe(INDUSTRIES.length);                 // every business keeps its own name
    expect(primaries.size).toBeGreaterThanOrEqual(3);           // industry palettes actually differ
  });

  it('selects different home layouts per industry', async () => {
    const sequences = new Set<string>();
    for (const c of INDUSTRIES) {
      const result = await runGenerationPipeline(
        { description: c.description, industry: c.industry, businessType: c.businessType, businessName: c.businessName, tone: c.tone, language: 'en' },
        { clerkUserId: 'user_test', dbUserId: 'user_test' }
      );
      expect(result.success).toBe(true);
      if (!result.success || !result.data) continue;
      const home = result.data.pages.find(p => p.isHome);
      if (home) sequences.add(home.sections.map(s => s.type).join('→'));
    }
    expect(sequences.size).toBeGreaterThanOrEqual(5);           // section selection is industry-aware
  });
});
