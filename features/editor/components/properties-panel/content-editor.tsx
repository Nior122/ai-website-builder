// =============================================================================
// Content Editor
// =============================================================================
// Dynamic form fields for editing section content.
// Renders different field types based on section type.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import type { Section } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────

interface ContentEditorProps {
  section: Section;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ContentEditor({ section }: ContentEditorProps) {
  const updateSectionContent = useEditorStore((s) => s.updateSectionContent);
  const content = section.content as Record<string, any>;

  const update = (key: string, value: any) => {
    updateSectionContent(section.id, { [key]: value });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Headline */}
      {hasField(section.type, 'headline') && (
        <Field label="Headline">
          <input
            type="text"
            value={content.headline || ''}
            onChange={(e) => update('headline', e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Enter headline…"
          />
        </Field>
      )}

      {/* Subheadline */}
      {hasField(section.type, 'subheadline') && (
        <Field label="Subheadline">
          <input
            type="text"
            value={content.subheadline || ''}
            onChange={(e) => update('subheadline', e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Enter subheadline…"
          />
        </Field>
      )}

      {/* Body */}
      {hasField(section.type, 'body') && (
        <Field label="Body">
          <textarea
            value={content.body || ''}
            onChange={(e) => update('body', e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
            placeholder="Enter body text…"
          />
        </Field>
      )}

      {/* CTA Button */}
      {hasField(section.type, 'cta') && (
        <Field label="Call to Action">
          <div className="space-y-2">
            <input
              type="text"
              value={content.cta?.text || ''}
              onChange={(e) => update('cta', { ...content.cta, text: e.target.value })}
              className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Button text…"
            />
            <input
              type="text"
              value={content.cta?.url || ''}
              onChange={(e) => update('cta', { ...content.cta, url: e.target.value })}
              className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Button URL…"
            />
            <select
              value={content.cta?.style || 'primary'}
              onChange={(e) => update('cta', { ...content.cta, style: e.target.value })}
              className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>
        </Field>
      )}

      {/* Items Array (Features, Services, Values, etc.) */}
      {hasField(section.type, 'items') && (
        <Field label="Items">
          <ItemsEditor
            items={content.items || []}
            onUpdate={(items) => update('items', items)}
          />
        </Field>
      )}

      {/* Testimonials Array */}
      {section.type === 'testimonials' && (
        <Field label="Testimonials">
          <TestimonialsEditor
            items={content.testimonials || []}
            onUpdate={(testimonials) => update('testimonials', testimonials)}
          />
        </Field>
      )}

      {/* FAQ Array */}
      {section.type === 'faq' && (
        <Field label="FAQ Items">
          <FAQEditor
            items={content.faqs || []}
            onUpdate={(faqs) => update('faqs', faqs)}
          />
        </Field>
      )}

      {/* Stats Array */}
      {section.type === 'stats' && (
        <Field label="Statistics">
          <StatsEditor
            items={content.stats || []}
            onUpdate={(stats) => update('stats', stats)}
          />
        </Field>
      )}

      {/* Team Array */}
      {section.type === 'team' && (
        <Field label="Team Members">
          <TeamEditor
            items={content.team || []}
            onUpdate={(team) => update('team', team)}
          />
        </Field>
      )}

      {/* Pricing Array */}
      {section.type === 'pricing' && (
        <Field label="Pricing Plans">
          <PricingEditor
            items={content.pricing || []}
            onUpdate={(pricing) => update('pricing', pricing)}
          />
        </Field>
      )}

      {/* Badge */}
      {hasField(section.type, 'badge') && (
        <Field label="Badge">
          <input
            type="text"
            value={content.badge || ''}
            onChange={(e) => update('badge', e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Badge text…"
          />
        </Field>
      )}

      {/* Layout-specific fields */}
      {hasField(section.type, 'layout') && (
        <Field label="Layout">
          <select
            value={section.layout}
            onChange={(e) => {
              const { updateSectionLayout } = useEditorStore.getState();
              updateSectionLayout(section.id, e.target.value);
            }}
            className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="centered">Centered</option>
            <option value="split">Split</option>
            <option value="grid-2">Grid 2 Columns</option>
            <option value="grid-3">Grid 3 Columns</option>
            <option value="grid-4">Grid 4 Columns</option>
            <option value="full-width">Full Width</option>
            <option value="sidebar">Sidebar</option>
            <option value="cards">Cards</option>
            <option value="carousel">Carousel</option>
            <option value="image-left">Image Left</option>
            <option value="image-right">Image Right</option>
          </select>
        </Field>
      )}
    </div>
  );
}

// ─── Field Wrapper ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

// ─── Field Detection ───────────────────────────────────────────────────────

function hasField(type: string, field: string): boolean {
  const fieldMap: Record<string, string[]> = {
    hero: ['headline', 'subheadline', 'cta', 'badge', 'layout', 'body'],
    features: ['headline', 'subheadline', 'items', 'layout'],
    services: ['headline', 'subheadline', 'items', 'layout'],
    testimonials: ['headline', 'subheadline', 'testimonials', 'layout'],
    pricing: ['headline', 'subheadline', 'pricing', 'layout'],
    faq: ['headline', 'subheadline', 'faqs', 'layout'],
    contact: ['headline', 'subheadline', 'body', 'layout'],
    cta: ['headline', 'subheadline', 'cta', 'body', 'layout'],
    stats: ['headline', 'subheadline', 'stats', 'layout'],
    team: ['headline', 'subheadline', 'team', 'layout'],
    newsletter: ['headline', 'subheadline', 'cta', 'layout'],
    about: ['headline', 'subheadline', 'body', 'badge', 'layout', 'items'],
    mission: ['headline', 'subheadline', 'body', 'layout'],
    values: ['headline', 'subheadline', 'items', 'layout'],
    process: ['headline', 'subheadline', 'items', 'layout'],
    timeline: ['headline', 'subheadline', 'items', 'layout'],
    portfolio: ['headline', 'subheadline', 'items', 'layout'],
    gallery: ['headline', 'subheadline', 'layout'],
    blog: ['headline', 'subheadline', 'layout'],
    video: ['headline', 'subheadline', 'layout'],
    footer: ['headline', 'body', 'items', 'layout'],
  };
  return fieldMap[type]?.includes(field) ?? false;
}

// ─── Items Editor ──────────────────────────────────────────────────────────

function ItemsEditor({
  items,
  onUpdate,
}: {
  items: Array<{ title?: string; description?: string; icon?: string }>;
  onUpdate: (items: any[]) => void;
}) {
  const addItem = () => {
    onUpdate([...items, { title: 'New Item', description: '', icon: '' }]);
  };

  const removeItem = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onUpdate(updated);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-md border border-neutral-200 p-2 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400">#{index + 1}</span>
            <button
              onClick={() => removeItem(index)}
              className="rounded p-0.5 text-neutral-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={item.title || ''}
            onChange={(e) => updateItem(index, 'title', e.target.value)}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Title…"
          />
          <input
            type="text"
            value={item.description || ''}
            onChange={(e) => updateItem(index, 'description', e.target.value)}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Description…"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-1.5 text-xs text-neutral-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3 w-3" />
        Add Item
      </button>
    </div>
  );
}

// ─── Testimonials Editor ───────────────────────────────────────────────────

function TestimonialsEditor({
  items,
  onUpdate,
}: {
  items: any[];
  onUpdate: (items: any[]) => void;
}) {
  const addItem = () => {
    onUpdate([
      ...items,
      { quote: '', author: { name: '', role: '', company: '' }, rating: 5 },
    ]);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-neutral-200 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400">#{index + 1}</span>
            <button
              onClick={() => onUpdate(items.filter((_, i) => i !== index))}
              className="rounded p-0.5 text-neutral-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <textarea
            value={item.quote || ''}
            onChange={(e) => {
              const updated = items.map((t, i) =>
                i === index ? { ...t, quote: e.target.value } : t
              );
              onUpdate(updated);
            }}
            rows={2}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none resize-none"
            placeholder="Quote…"
          />
          <input
            type="text"
            value={item.author?.name || ''}
            onChange={(e) => {
              const updated = items.map((t, i) =>
                i === index
                  ? { ...t, author: { ...t.author, name: e.target.value } }
                  : t
              );
              onUpdate(updated);
            }}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Author name…"
          />
          <input
            type="text"
            value={item.author?.role || ''}
            onChange={(e) => {
              const updated = items.map((t, i) =>
                i === index
                  ? { ...t, author: { ...t.author, role: e.target.value } }
                  : t
              );
              onUpdate(updated);
            }}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Role / Company…"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-1.5 text-xs text-neutral-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3 w-3" />
        Add Testimonial
      </button>
    </div>
  );
}

// ─── FAQ Editor ────────────────────────────────────────────────────────────

function FAQEditor({
  items,
  onUpdate,
}: {
  items: Array<{ question: string; answer: string }>;
  onUpdate: (items: any[]) => void;
}) {
  const addItem = () => {
    onUpdate([...items, { question: '', answer: '' }]);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-neutral-200 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400">#{index + 1}</span>
            <button
              onClick={() => onUpdate(items.filter((_, i) => i !== index))}
              className="rounded p-0.5 text-neutral-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={item.question || ''}
            onChange={(e) => {
              const updated = items.map((q, i) =>
                i === index ? { ...q, question: e.target.value } : q
              );
              onUpdate(updated);
            }}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Question…"
          />
          <textarea
            value={item.answer || ''}
            onChange={(e) => {
              const updated = items.map((q, i) =>
                i === index ? { ...q, answer: e.target.value } : q
              );
              onUpdate(updated);
            }}
            rows={2}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none resize-none"
            placeholder="Answer…"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-1.5 text-xs text-neutral-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3 w-3" />
        Add FAQ
      </button>
    </div>
  );
}

// ─── Stats Editor ──────────────────────────────────────────────────────────

function StatsEditor({
  items,
  onUpdate,
}: {
  items: Array<{ value: string; label: string; suffix?: string }>;
  onUpdate: (items: any[]) => void;
}) {
  const addItem = () => {
    onUpdate([...items, { value: '0', label: 'New Stat', suffix: '' }]);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-neutral-200 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400">#{index + 1}</span>
            <button
              onClick={() => onUpdate(items.filter((_, i) => i !== index))}
              className="rounded p-0.5 text-neutral-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={item.value || ''}
              onChange={(e) => {
                const updated = items.map((s, i) =>
                  i === index ? { ...s, value: e.target.value } : s
                );
                onUpdate(updated);
              }}
              className="w-1/3 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
              placeholder="Value…"
            />
            <input
              type="text"
              value={item.label || ''}
              onChange={(e) => {
                const updated = items.map((s, i) =>
                  i === index ? { ...s, label: e.target.value } : s
                );
                onUpdate(updated);
              }}
              className="flex-1 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
              placeholder="Label…"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-1.5 text-xs text-neutral-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3 w-3" />
        Add Stat
      </button>
    </div>
  );
}

// ─── Team Editor ───────────────────────────────────────────────────────────

function TeamEditor({
  items,
  onUpdate,
}: {
  items: any[];
  onUpdate: (items: any[]) => void;
}) {
  const addItem = () => {
    onUpdate([
      ...items,
      { name: 'New Member', role: '', bio: '', image: '', social: {} },
    ]);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-neutral-200 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400">#{index + 1}</span>
            <button
              onClick={() => onUpdate(items.filter((_, i) => i !== index))}
              className="rounded p-0.5 text-neutral-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={item.name || ''}
            onChange={(e) => {
              const updated = items.map((m, i) =>
                i === index ? { ...m, name: e.target.value } : m
              );
              onUpdate(updated);
            }}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Name…"
          />
          <input
            type="text"
            value={item.role || ''}
            onChange={(e) => {
              const updated = items.map((m, i) =>
                i === index ? { ...m, role: e.target.value } : m
              );
              onUpdate(updated);
            }}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Role…"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-1.5 text-xs text-neutral-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3 w-3" />
        Add Team Member
      </button>
    </div>
  );
}

// ─── Pricing Editor ────────────────────────────────────────────────────────

function PricingEditor({
  items,
  onUpdate,
}: {
  items: any[];
  onUpdate: (items: any[]) => void;
}) {
  const addItem = () => {
    onUpdate([
      ...items,
      {
        name: 'New Plan',
        price: { monthly: 0, yearly: 0 },
        description: '',
        features: [],
        highlighted: false,
      },
    ]);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-neutral-200 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400">
              #{index + 1} {item.highlighted ? '⭐' : ''}
            </span>
            <button
              onClick={() => onUpdate(items.filter((_, i) => i !== index))}
              className="rounded p-0.5 text-neutral-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={item.name || ''}
            onChange={(e) => {
              const updated = items.map((p, i) =>
                i === index ? { ...p, name: e.target.value } : p
              );
              onUpdate(updated);
            }}
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
            placeholder="Plan name…"
          />
          <div className="flex gap-1.5">
            <input
              type="number"
              value={item.price?.monthly || 0}
              onChange={(e) => {
                const updated = items.map((p, i) =>
                  i === index
                    ? { ...p, price: { ...p.price, monthly: Number(e.target.value) } }
                    : p
                );
                onUpdate(updated);
              }}
              className="w-1/2 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
              placeholder="Monthly $"
            />
            <input
              type="number"
              value={item.price?.yearly || 0}
              onChange={(e) => {
                const updated = items.map((p, i) =>
                  i === index
                    ? { ...p, price: { ...p.price, yearly: Number(e.target.value) } }
                    : p
                );
                onUpdate(updated);
              }}
              className="w-1/2 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none"
              placeholder="Yearly $"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-1.5 text-xs text-neutral-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3 w-3" />
        Add Plan
      </button>
    </div>
  );
}
