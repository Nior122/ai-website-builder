// =============================================================================
// Contact Section Component
// =============================================================================
// Contact form + business info. Split layout with form on one side, info on other.
// =============================================================================

'use client';

import type { SectionProps } from '../components/section-renderer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

function ContactForm({ form }: { form: NonNullable<SectionProps['content']['form']> }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In preview mode, just show success
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card padding="lg" className="text-center">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-16 w-16 rounded-full bg-[var(--color-success-50)] flex items-center justify-center">
            <Send className="h-8 w-8 text-[var(--color-success-500)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text)]">
            {form.successMessage || 'Thank you! Your message has been sent.'}
          </h3>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {form.title && (
          <h3 className="text-xl font-semibold text-[var(--color-text)]">
            {form.title}
          </h3>
        )}
        {form.description && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {form.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {form.fields
            .filter((f) => f.type !== 'hidden')
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <div
                key={field.id}
                className={field.width === 'full' ? 'sm:col-span-2' : ''}
              >
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                  {field.label}
                  {field.required && <span className="text-[var(--color-error-500)] ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent resize-none"
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                  >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'phone' ? 'tel' : field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                  />
                )}
              </div>
            ))}
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-2">
          {form.submitText || 'Send Message'}
        </Button>
      </form>
    </Card>
  );
}

export function ContactSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const form = content.form;
  const body = (content.body as string) || '';

  // Parse contact info from body (JSON string or plain text)
  let contactInfo: { email?: string; phone?: string; address?: string } = {};
  try {
    contactInfo = body ? JSON.parse(body) : {};
  } catch {
    contactInfo = {};
  }

  const isSplit = section.layout === 'split';

  const formArea = form ? <ContactForm form={form} /> : null;

  const infoArea = (
    <div className="flex flex-col gap-6">
      {contactInfo.email && (
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
            <Mail className="h-5 w-5 text-[var(--color-primary-500)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Email</p>
            <p className="text-[var(--color-text-secondary)]">{contactInfo.email}</p>
          </div>
        </div>
      )}
      {contactInfo.phone && (
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
            <Phone className="h-5 w-5 text-[var(--color-primary-500)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Phone</p>
            <p className="text-[var(--color-text-secondary)]">{contactInfo.phone}</p>
          </div>
        </div>
      )}
      {contactInfo.address && (
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
            <MapPin className="h-5 w-5 text-[var(--color-primary-500)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Address</p>
            <p className="text-[var(--color-text-secondary)]">{contactInfo.address}</p>
          </div>
        </div>
      )}
    </div>
  );

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

      {/* Content */}
      {isSplit ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {formArea}
          <div className="flex flex-col gap-8">
            {infoArea}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl flex flex-col gap-8">
          {infoArea}
          {formArea}
        </div>
      )}
    </div>
  );
}
