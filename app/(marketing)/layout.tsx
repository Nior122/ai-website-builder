// =============================================================================
// Marketing Layout
// =============================================================================
// Shared layout for all public marketing pages. Wraps children with the
// marketing nav + footer so individual pages don't duplicate chrome.
// Server component — no client state.
// =============================================================================

import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
