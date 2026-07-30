// =============================================================================
// PromptBuilder Component
// =============================================================================
// Multi-step form for configuring AI website generation.
// Step 1: Business description (required)
// Step 2: Industry & tone selection
// Step 3: Pages & features selection
// Step 4: Review & generate
// =============================================================================

'use client';

import { useState, useMemo } from 'react';
import { INDUSTRIES, BRAND_TONES, PAGE_TYPES } from '@/lib/constants';
import type { BrandTone } from '@/lib/constants';
import type { GenerateRequest } from '@/types';

interface PromptBuilderProps {
  onGenerate: (request: GenerateRequest) => void;
  isGenerating: boolean;
}

type Step = 1 | 2 | 3 | 4;

const FEATURE_SUGGESTIONS: Record<string, string[]> = {
  restaurant: ['Online Reservations', 'Menu Display', 'Order Online', 'Event Calendar'],
  hotel: ['Room Booking', 'Virtual Tour', 'Concierge', 'Restaurant Menu'],
  gym: ['Class Schedule', 'Trainer Profiles', 'Membership Plans', 'Progress Tracker'],
  bakery: ['Online Orders', 'Custom Cakes', 'Delivery', 'Catering'],
  'real-estate': ['Property Listings', 'Virtual Tours', 'Mortgage Calculator', 'Agent Profiles'],
  'law-firm': ['Case Studies', 'Attorney Profiles', 'Practice Areas', 'Client Portal'],
  hospital: ['Services List', 'Doctor Profiles', 'Patient Portal', 'Insurance Info'],
  software: ['SaaS Pricing', 'API Docs', 'Changelog', 'Integrations'],
  logistics: ['Shipment Tracking', 'Fleet Management', 'Rate Calculator', 'Warehousing'],
  church: ['Event Calendar', 'Sermon Archive', 'Donations', 'Small Groups'],
  school: ['Course Catalog', 'Student Portal', 'Faculty Profiles', 'Campus Tour'],
  agency: ['Case Studies', 'Service Packages', 'Team Profiles', 'Client Results'],
  construction: ['Project Gallery', 'Services', 'Quote Request', 'Safety Records'],
  photography: ['Portfolio Gallery', 'Booking', 'Pricing Packages', 'Blog'],
  consulting: ['Service Packages', 'Case Studies', 'ROI Calculator', 'Book a Call'],
  startup: ['Product Demo', 'Pricing', 'API Documentation', 'Changelog'],
  ecommerce: ['Product Catalog', 'Shopping Cart', 'Reviews', 'Wishlist'],
  portfolio: ['Project Showcase', 'Process', 'Client Testimonials', 'Contact'],
  fitness: ['Class Schedule', 'Trainer Profiles', 'Membership Plans', 'Progress Tracker'],
  beauty: ['Service Menu', 'Booking', 'Before/After Gallery', 'Products'],
  automotive: ['Inventory', 'Service Booking', 'Vehicle Configurator', 'Financing'],
  finance: ['Calculator Tools', 'Market Data', 'Advisor Profiles', 'Client Portal'],
  healthcare: ['Services List', 'Doctor Profiles', 'Patient Portal', 'Insurance Info'],
  education: ['Course Catalog', 'Student Portal', 'Faculty Profiles', 'Campus Tour'],
  nonprofit: ['Impact Stories', 'Donate', 'Volunteer Signup', 'Events'],
  general: ['Newsletter Signup', 'Social Proof', 'FAQ', 'Live Chat'],
};

export function PromptBuilder({ onGenerate, isGenerating }: PromptBuilderProps) {
  const [step, setStep] = useState<Step>(1);
  const [description, setDescription] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [tone, setTone] = useState<BrandTone>('professional');
  const [selectedPages, setSelectedPages] = useState<string[]>(
    PAGE_TYPES.filter((p) => p.default).map((p) => p.id)
  );
  const [features, setFeatures] = useState<string[]>([]);

  const suggestions = useMemo(
    () => FEATURE_SUGGESTIONS[industry] || FEATURE_SUGGESTIONS.general,
    [industry]
  );

  const canProceed = () => {
    switch (step) {
      case 1: return description.trim().length >= 10;
      case 2: return industry.length > 0;
      case 3: return selectedPages.length > 0;
      case 4: return true;
    }
  };

  const handleGenerate = () => {
    onGenerate({
      description,
      businessName: businessName || undefined,
      industry: industry || 'general',
      businessType: industry || 'general',
      tone,
      pages: selectedPages,
      features,
    });
  };

  const togglePage = (pageId: string) => {
    setSelectedPages((prev) =>
      prev.includes(pageId)
        ? prev.filter((p) => p !== pageId)
        : [...prev, pageId]
    );
  };

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                s === step
                  ? 'bg-neutral-900 text-white'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 4 && (
              <div className={`h-px w-8 ${s < step ? 'bg-green-500' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {/* Step 1: Description */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">
              Tell us about your business
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              The more detail you provide, the better the AI can tailor your website.
            </p>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Business Name <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Brew & Bean Coffee"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your business does, who you serve, what makes you unique, and what kind of website you want..."
                rows={6}
                className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                {description.length}/5000 characters · Minimum 10 characters
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Industry & Tone */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">
              Industry & Brand Tone
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              Help the AI understand your market and desired aesthetic.
            </p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Industry <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => setIndustry(ind.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      industry === ind.value
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{ind.icon}</span>
                    <span className="truncate">{ind.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Brand Tone
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BRAND_TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm capitalize transition-colors ${
                      tone === t
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pages & Features */}
        {step === 3 && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">
              Pages & Features
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              Choose which pages to include and features to highlight.
            </p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Pages to Generate
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PAGE_TYPES.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => togglePage(page.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedPages.includes(page.id)
                        ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <span>{page.icon}</span>
                    {page.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Key Features <span className="text-neutral-400">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((feature) => (
                  <button
                    key={feature}
                    onClick={() => toggleFeature(feature)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      features.includes(feature)
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Generate */}
        {step === 4 && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">
              Review & Generate
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              Review your configuration before generating.
            </p>

            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-50 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Business
                </h3>
                {businessName && (
                  <p className="text-sm font-medium text-neutral-900">{businessName}</p>
                )}
                <p className="text-sm text-neutral-600">{description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Industry
                  </h3>
                  <p className="text-sm text-neutral-900">
                    {INDUSTRIES.find((i) => i.value === industry)?.icon}{' '}
                    {INDUSTRIES.find((i) => i.value === industry)?.label || industry || 'General'}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Tone
                  </h3>
                  <p className="text-sm capitalize text-neutral-900">{tone}</p>
                </div>
              </div>

              <div className="rounded-lg bg-neutral-50 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Pages ({selectedPages.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPages.map((p) => {
                    const page = PAGE_TYPES.find((opt) => opt.id === p);
                    return (
                      <span key={p} className="rounded-md bg-white px-2 py-1 text-xs text-neutral-700 border border-neutral-200">
                        {page?.icon} {page?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {features.length > 0 && (
                <div className="rounded-lg bg-neutral-50 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Features ({features.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f) => (
                      <span key={f} className="rounded-md bg-white px-2 py-1 text-xs text-neutral-700 border border-neutral-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as Step)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canProceed()}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {isGenerating ? 'Generating...' : 'Generate Website'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
