// =============================================================================
// Terms of Service
// =============================================================================
// PLACEHOLDER terms. This is a template, not legal advice — replace with
// reviewed terms before accepting real billing or user data. Resolves the
// /terms link in the auth layout.
// =============================================================================

import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_NAME}`,
  description: 'The terms that govern your use of the platform.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      {/* Banner: this is placeholder content */}
      <div className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        ⚠️ These are <strong>placeholder terms</strong> included for completeness.
        They are not legal advice and have not been reviewed by counsel. Replace
        with terms drafted for your jurisdiction before going to production.
      </div>

      <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900">
        Terms of Service
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Last updated: July 19, 2026
      </p>

      <div className="prose-blog">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account or using {APP_NAME} (&ldquo;the Service&rdquo;),
          you agree to be bound by these Terms of Service. If you do not agree,
          you may not access or use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          The Service provides tools to generate, edit, and deploy websites
          using artificial intelligence. We offer free and paid plans with
          varying limits, as described on our pricing page.
        </p>

        <h2>3. Your Account</h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity that occurs under your
          account. You must be at least 13 years old (or the age of digital
          consent in your jurisdiction) to use the Service.
        </p>

        <h2>4. Your Content</h2>
        <p>
          You retain ownership of content you create using the Service. You
          grant us a limited license to host, store, and display that content as
          necessary to operate the Service. You represent that your content does
          not infringe the rights of any third party.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable law or regulation.</li>
          <li>Infringe intellectual property or privacy rights.</li>
          <li>Distribute malware or attempt to disrupt the Service.</li>
          <li>Scrape, resell, or reverse-engineer the Service beyond its intended use.</li>
        </ul>

        <h2>6. Billing</h2>
        <p>
          Paid plans are billed in advance on a recurring basis. Fees are
          non-refundable except where required by law. We may change pricing with
          reasonable advance notice; existing subscriptions are not affected
          until renewal.
        </p>

        <h2>7. Termination</h2>
        <p>
          You may cancel your account at any time. We may suspend or terminate
          access for violation of these Terms. Upon termination, your content
          may be deleted after a reasonable grace period.
        </p>

        <h2>8. Disclaimer</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any
          kind. Generated content may be inaccurate or unsuitable; you are
          responsible for reviewing it before publishing.
        </p>

        <h2>9. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be
          communicated in the Service. Continued use after changes take effect
          constitutes acceptance of the revised Terms.
        </p>
      </div>
    </div>
  );
}
