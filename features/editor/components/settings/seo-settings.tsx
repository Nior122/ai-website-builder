// =============================================================================
// SEO Settings Panel
// =============================================================================
// Project-level SEO configuration: meta title, description, keywords, OG image,
// Twitter card settings, canonical URL, noIndex/noFollow. All fields are backed
// by the `seo` JSON column on the Prisma `Project` model.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { useSettings } from '../../hooks/use-settings';
import { ImageUploader } from '../image-uploader';
import type { SEOConfig } from '@/types';
import { Search, ExternalLink } from 'lucide-react';

// ─── Default SEO Values ────────────────────────────────────────────────────

const DEFAULT_SEO: SEOConfig = {
  metaTitle: '',
  metaDescription: '',
  keywords: [],
  canonicalUrl: null,
  ogImage: null,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterSite: null,
  twitterCreator: null,
  noIndex: false,
  noFollow: false,
  jsonLd: [],
  sitemap: true,
  robotsTxt: '',
};

// ─── Component ─────────────────────────────────────────────────────────────

export function SeoSettings() {
  const project = useEditorStore((s) => s.project);
  const { updateSeo } = useSettings();

  if (!project) return null;

  const seo: SEOConfig = { ...DEFAULT_SEO, ...(project.seo as Partial<SEOConfig>) };

  return (
    <div className="flex flex-col gap-5 p-3">
      {/* Meta Title */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Meta Title
        </label>
        <input
          type="text"
          value={seo.metaTitle}
          onChange={(e) => updateSeo({ metaTitle: e.target.value })}
          placeholder={project.name}
          maxLength={60}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <p className="mt-1 text-[10px] text-neutral-400">
          {seo.metaTitle.length}/60 characters. Shows as the page title in search
          results and browser tabs.
        </p>
      </section>

      {/* Meta Description */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Meta Description
        </label>
        <textarea
          value={seo.metaDescription}
          onChange={(e) => updateSeo({ metaDescription: e.target.value })}
          placeholder="Brief description of your site for search engines"
          rows={3}
          maxLength={160}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
        />
        <p className="mt-1 text-[10px] text-neutral-400">
          {seo.metaDescription.length}/160 characters. Shows as the snippet below
          your title in search results.
        </p>
      </section>

      {/* Keywords */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Keywords
        </label>
        <input
          type="text"
          value={seo.keywords.join(', ')}
          onChange={(e) => {
            const keywords = e.target.value
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean);
            updateSeo({ keywords });
          }}
          placeholder="website, portfolio, business"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <p className="mt-1 text-[10px] text-neutral-400">
          Comma-separated keywords. Helps search engines understand your content.
        </p>
      </section>

      {/* Canonical URL */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Canonical URL
        </label>
        <input
          type="url"
          value={seo.canonicalUrl ?? ''}
          onChange={(e) =>
            updateSeo({ canonicalUrl: e.target.value || null })
          }
          placeholder="https://example.com"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <p className="mt-1 text-[10px] text-neutral-400">
          Leave empty to use the published URL as canonical.
        </p>
      </section>

      <div className="h-px bg-neutral-200" />

      {/* OG Image */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Social Share Image (OG Image)
        </label>
        <p className="mb-2 text-[10px] text-neutral-400">
          The image shown when your site is shared on social media (1200×630
          recommended).
        </p>
        <ImageUploader
          value={seo.ogImage}
          onChange={(url) => updateSeo({ ogImage: url })}
          projectId={project.id}
          label=""
          aspectRatio="1200/630"
          type="uploads"
        />
      </section>

      {/* OG Type */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          OG Type
        </label>
        <select
          value={seo.ogType}
          onChange={(e) =>
            updateSeo({ ogType: e.target.value as SEOConfig['ogType'] })
          }
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="website">Website</option>
          <option value="article">Article</option>
          <option value="product">Product</option>
        </select>
      </section>

      <div className="h-px bg-neutral-200" />

      {/* Twitter Card */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Twitter Card Type
        </label>
        <select
          value={seo.twitterCard}
          onChange={(e) =>
            updateSeo({
              twitterCard: e.target.value as SEOConfig['twitterCard'],
            })
          }
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="summary">Summary (small image)</option>
          <option value="summary_large_image">
            Summary Large Image
          </option>
        </select>
      </section>

      {/* Twitter Site */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Twitter Site Handle
        </label>
        <input
          type="text"
          value={seo.twitterSite ?? ''}
          onChange={(e) =>
            updateSeo({ twitterSite: e.target.value || null })
          }
          placeholder="@yourhandle"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </section>

      <div className="h-px bg-neutral-200" />

      {/* noIndex / noFollow */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            No Index (hide from search)
          </span>
          <button
            onClick={() => updateSeo({ noIndex: !seo.noIndex })}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              seo.noIndex ? 'bg-blue-600' : 'bg-neutral-300'
            }`}
            role="switch"
            aria-checked={seo.noIndex}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                seo.noIndex ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            No Follow (don't follow links)
          </span>
          <button
            onClick={() => updateSeo({ noFollow: !seo.noFollow })}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              seo.noFollow ? 'bg-blue-600' : 'bg-neutral-300'
            }`}
            role="switch"
            aria-checked={seo.noFollow}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                seo.noFollow ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Sitemap */}
      <section>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Include in Sitemap
          </span>
          <button
            onClick={() => updateSeo({ sitemap: !seo.sitemap })}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              seo.sitemap ? 'bg-blue-600' : 'bg-neutral-300'
            }`}
            role="switch"
            aria-checked={seo.sitemap}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                seo.sitemap ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
