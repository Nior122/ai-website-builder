// =============================================================================
// FAQ Section Component
// =============================================================================
// Accordion FAQ with question/answer pairs. Uses native <details> for
// zero-dependency accordion (avoids Radix SSR complexity in preview).
// Supports accordion, tabs, and grid layouts.
// =============================================================================

'use client';

import type { SectionProps } from '../components/section-renderer';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--color-border-light)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-[var(--color-text)] pr-4">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const faqs = (content.faqs as Array<{
    id: string;
    question: string;
    answer: string;
    category?: string;
    order: number;
  }>) || [];

  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  const sortedFaqs = [...faqs].sort((a, b) => a.order - b.order);
  const isGrid = section.layout === 'grid-2' || section.layout === 'grid-3';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      {(headline || subheadline) && (
        <div className="text-center mb-16">
          {headline && (
            <h2 className="text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
              {headline}
            </h2>
          )}
          {subheadline && (
            <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              {subheadline}
            </p>
          )}
        </div>
      )}

      {/* FAQ List */}
      {sortedFaqs.length > 0 && (
        <div className={`mx-auto max-w-3xl ${isGrid ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : ''}`}>
          {sortedFaqs.map((faq) => (
            <FAQItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
