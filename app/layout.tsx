// =============================================================================
// Root Layout
// =============================================================================
// The top-level layout wrapping all routes. Provides Clerk authentication
// context, global styles, font loading, and metadata.
// =============================================================================

import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// The root layout wraps ClerkProvider, which validates the publishable key at
// render. Skip prerendering so the build doesn't exercise Clerk key validation
// with a placeholder / absent key. Individual route groups (e.g. marketing)
// can opt into ISR by exporting their own revalidate/dynamic config.
export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AI Website Builder Studio',
    template: '%s | AI Website Builder Studio',
  },
  description:
    'Transform your business idea into a professional website in minutes. AI-powered website builder with drag-and-drop editing, theme customization, and one-click deployment.',
  keywords: ['website builder', 'AI', 'web design', 'no code', 'landing page', 'business website'],
  authors: [{ name: 'AI Website Builder Studio' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Website Builder Studio',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased" suppressHydrationWarning>
        <ClerkProvider
          appearance={{
            elements: {
              rootBox: 'w-full',
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
