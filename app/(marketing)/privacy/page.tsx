// =============================================================================
// Privacy Policy
// =============================================================================
// PLACEHOLDER privacy policy. Template, not legal advice — replace with
// reviewed language before going to production. Resolves the /privacy link
// in the auth layout.
// =============================================================================

import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description: 'How we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      {/* Banner: this is placeholder content */}
      <div className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        ⚠️ This is a <strong>placeholder privacy policy</strong>. It is not legal
        advice and has not been reviewed by counsel. Replace with a policy
        drafted for your jurisdiction and the data you actually process before
        going to production.
      </div>

      <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Last updated: July 19, 2026
      </p>

      <div className="prose-blog">
        <h2>1. Information We Collect</h2>
        <p>
          When you use {APP_NAME}, we may collect:
        </p>
        <ul>
          <li>
            <strong>Account information</strong> &mdash; email address and
            authentication details.
          </li>
          <li>
            <strong>Content you create</strong> &mdash; descriptions you submit
            and the websites the Service generates.
          </li>
          <li>
            <strong>Usage data</strong> &mdash; pages visited, features used,
            and device/browser information.
          </li>
          <li>
            <strong>Billing information</strong> &mdash; processed by our
            payment provider; we do not store full card numbers.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Process payments and manage your subscription.</li>
          <li>Communicate with you about your account.</li>
          <li>Detect, prevent, and address fraud or abuse.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>3. Sharing of Information</h2>
        <p>
          We do not sell your personal information. We share data only with
          service providers who help us operate the Service (hosting, payments,
          analytics), under contracts that require them to protect it, and as
          required by law.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          We retain your content and account data for as long as your account is
          active. After account deletion, we remove content within a reasonable
          period, except where retention is required by law or to resolve
          disputes.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access,
          correct, export, or delete your personal information. To exercise
          these rights, contact the email listed below.
        </p>

        <h2>6. Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect
          your information, but no system is perfectly secure. We cannot
          guarantee absolute security of data transmitted to or stored by the
          Service.
        </p>

        <h2>7. Children&rsquo;s Privacy</h2>
        <p>
          The Service is not directed to children under 13 (or the applicable
          age of digital consent). We do not knowingly collect personal
          information from children. If you believe a child has provided us
          information, please contact us so we can delete it.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be communicated in the Service. Continued use after changes take
          effect constitutes acceptance of the revised policy.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about this policy can be directed to the contact details
          provided in your account settings.
        </p>
      </div>
    </div>
  );
}
