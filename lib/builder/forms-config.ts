// =============================================================================
// Website Builder — Forms Configuration
// =============================================================================
// Form system: contact, newsletter, booking, appointment, quote, consultation,
// and lead-capture templates — each with fields, validation rules, spam
// protection (honeypot), and success states.
// =============================================================================

import { nanoid } from 'nanoid';
import type { BuilderProject, FormConfig, FormField, FormKind } from './types';

function field(label: string, type: FormField['type'], required: boolean, options?: string[]): FormField {
  // Stable id derived from the label so submissions can match fields by name.
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return { id, label, type, required, options };
}

const FORM_TEMPLATES: Record<FormKind, Omit<FormConfig, 'id'>> = {
  contact: {
    kind: 'contact',
    title: 'Contact Us',
    fields: [
      field('Name', 'text', true),
      field('Email', 'email', true),
      field('Phone', 'tel', false),
      field('Message', 'textarea', true),
    ],
    validation: { required: true, minLength: 2, maxLength: 5000 },
    spamProtection: true,
    successMessage: 'Thanks — we will reply within one business day.',
  },
  newsletter: {
    kind: 'newsletter',
    title: 'Join the Newsletter',
    fields: [field('Email', 'email', true)],
    validation: { required: true },
    spamProtection: true,
    successMessage: 'You are subscribed. Welcome aboard!',
  },
  booking: {
    kind: 'booking',
    title: 'Book a Session',
    fields: [
      field('Name', 'text', true),
      field('Email', 'email', true),
      field('Service', 'select', true, ['Consultation', 'Standard', 'Premium']),
      field('Preferred Date', 'date', true),
    ],
    validation: { required: true },
    spamProtection: true,
    successMessage: 'Booking received — we will confirm availability shortly.',
  },
  appointment: {
    kind: 'appointment',
    title: 'Request an Appointment',
    fields: [
      field('Name', 'text', true),
      field('Email', 'email', true),
      field('Phone', 'tel', true),
      field('Preferred Time', 'select', false, ['Morning', 'Afternoon', 'Evening']),
    ],
    validation: { required: true },
    spamProtection: true,
    successMessage: 'Appointment request sent. We will confirm by email.',
  },
  quote: {
    kind: 'quote',
    title: 'Request a Quote',
    fields: [
      field('Company', 'text', false),
      field('Email', 'email', true),
      field('Project Details', 'textarea', true),
    ],
    validation: { required: true, maxLength: 5000 },
    spamProtection: true,
    successMessage: 'Quote request received — expect a response within 2 business days.',
  },
  consultation: {
    kind: 'consultation',
    title: 'Book a Free Consultation',
    fields: [
      field('Name', 'text', true),
      field('Email', 'email', true),
      field('Goal', 'textarea', false),
    ],
    validation: { required: true },
    spamProtection: true,
    successMessage: 'Consultation booked — a calendar invite is on its way.',
  },
  lead: {
    kind: 'lead',
    title: 'Get Started',
    fields: [field('Email', 'email', true)],
    validation: { required: true, pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' },
    spamProtection: true,
    successMessage: 'Lead captured — our team will reach out soon.',
  },
};

export function createForm(kind: FormKind): FormConfig {
  return { id: nanoid(), ...JSON.parse(JSON.stringify(FORM_TEMPLATES[kind])) as Omit<FormConfig, 'id'> };
}

export function addForm(project: BuilderProject, kind: FormKind): BuilderProject {
  return { ...project, forms: [...project.forms, createForm(kind)] };
}

export function removeForm(project: BuilderProject, formId: string): BuilderProject {
  return { ...project, forms: project.forms.filter((form) => form.id !== formId) };
}

export function updateForm(project: BuilderProject, formId: string, patch: Partial<FormConfig>): BuilderProject {
  return {
    ...project,
    forms: project.forms.map((form) => (form.id === formId ? { ...form, ...patch } : form)),
  };
}

export function addFormField(project: BuilderProject, formId: string, label: string, type: FormField['type']): BuilderProject {
  return updateForm(project, formId, {
    fields: [...getForm(project, formId)?.fields ?? [], field(label, type, false)],
  });
}

export function removeFormField(project: BuilderProject, formId: string, fieldId: string): BuilderProject {
  return updateForm(project, formId, {
    fields: (getForm(project, formId)?.fields ?? []).filter((f) => f.id !== fieldId),
  });
}

export function getForm(project: BuilderProject, formId: string): FormConfig | undefined {
  return project.forms.find((form) => form.id === formId);
}

export function defaultForms(): FormConfig[] {
  return [createForm('contact'), createForm('newsletter')];
}

// ─── Validation ─────────────────────────────────────────────────────────

export interface FormValidationResult {
  valid: boolean;
  errors: Array<{ fieldId: string; message: string }>;
  spamDetected: boolean;
}

/**
 * Validate a submission against a form config.
 * Honeypot field "company_website" filled → spam detected.
 */
export function validateFormSubmission(
  form: FormConfig,
  values: Record<string, unknown>
): FormValidationResult {
  const errors: Array<{ fieldId: string; message: string }> = [];

  if (form.spamProtection && typeof values['company_website'] === 'string' && values['company_website'].length > 0) {
    return { valid: false, errors: [], spamDetected: true };
  }

  for (const formField of form.fields) {
    const value = values[formField.id];
    const present = typeof value === 'string' && value.trim().length > 0;

    if (formField.required && !present) {
      errors.push({ fieldId: formField.id, message: `${formField.label} is required.` });
      continue;
    }

    if (present && formField.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value as string)) {
      errors.push({ fieldId: formField.id, message: `${formField.label} must be a valid email.` });
    }

    if (form.validation.minLength && present && (value as string).length < form.validation.minLength) {
      errors.push({ fieldId: formField.id, message: `${formField.label} must be at least ${form.validation.minLength} characters.` });
    }

    if (form.validation.maxLength && present && (value as string).length > form.validation.maxLength) {
      errors.push({ fieldId: formField.id, message: `${formField.label} must be under ${form.validation.maxLength} characters.` });
    }
  }

  return { valid: errors.length === 0, errors, spamDetected: false };
}
