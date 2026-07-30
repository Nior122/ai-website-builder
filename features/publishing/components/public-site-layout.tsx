// =============================================================================
// Public Site Layout
// =============================================================================
// Delivery-time font injection for a published site. Its single responsibility
// is emitting the Google Fonts `<link>`s for the theme's `heading` / `body`
// font families, so a published site renders with the typefaces the owner
// picked (not just the Inter/JetBrains default the root layout ships). Only
// Google Fonts families are linked; system / generic families (serif,
// system-ui, Georgia, …) need no stylesheet.
//
// Why it does NOT wrap in `ThemeProvider`: `PageRenderer` already wraps its
// own `ThemeProvider` (it injects the CSS variables + the theme class div).
// Matching the editor and private-preview pages, the public route renders
// `<PublicSiteLayout>…<PageRenderer /></PublicSiteLayout>` and lets the
// renderer own the provider — no double-nested `<style>` blocks or wrapper
// divs. This component therefore contributes only the hoistable `<link>` tags.
//
// Composition: rendered inside the root `app/layout.tsx`, which already
// supplies `<html><body>`. We render the `<link>` tags directly (React 19 +
// Next 15 hoist `<link rel="stylesheet">` into `<head>` automatically); we do
// NOT re-emit `<html>`/`<body>`. A Server Component throughout — no client
// interactivity, fonts load via plain `<link>`s, and the CSP already permits
// the Google Fonts hosts (style-src fonts.googleapis.com, font-src
// fonts.gstatic.com).
// =============================================================================

import type { Theme } from '@/types';

/**
 * Font-family strings the app ships as Google fonts. Keys are the *leading
 * family name* (the part before the first comma in a CSS font-family stack,
 * stripped of quotes) so a stored stack like `'Playfair Display', serif`
 * matches. System / generic families are absent on purpose — they render with
 * no stylesheet.
 */
const GOOGLE_FONTS = new Set([
  'Inter',
  'Playfair Display',
  'Poppins',
  'Montserrat',
  'Lato',
  'Roboto',
  'Source Sans Pro',
  'Open Sans',
  'Merriweather',
  'Nunito',
  'Oswald',
  'Raleway',
  'Bebas Neue',
  'Cormorant',
]);

interface PublicSiteLayoutProps {
  theme: Theme;
  children: React.ReactNode;
}

/**
 * Extract the first font-family name from a CSS font-family stack. The stack
 * may be `'Playfair Display', Georgia, serif` or `Inter, system-ui, sans-serif`
 * — we take the first comma-separated token and strip surrounding quotes /
 * whitespace. Returns `null` if the stack is empty or malformed.
 */
function firstFamilyName(stack: string | undefined | null): string | null {
  if (!stack || typeof stack !== 'string') return null;
  const first = stack.split(',')[0]?.trim();
  if (!first) return null;
  return first.replace(/^['"]|['"]$/g, '');
}

/**
 * Build a Google Fonts `css2` `family=` param for a family name. Returns `null`
 * if the family isn't a known Google font (so no link is emitted for system
 * fonts). We request the 300–800 weight range; Google returns the intersection
 * with what the family actually supports.
 */
function googleFontsParam(family: string | null): string | null {
  if (!family || !GOOGLE_FONTS.has(family)) return null;
  return `family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`;
}

/**
 * Collect the distinct Google-font `family=` params for the theme's heading
 * and body families (deduped — if heading and body share a family, link once).
 */
function collectFontParams(theme: Theme): string[] {
  const names = [
    firstFamilyName(theme?.typography?.fontFamily?.heading),
    firstFamilyName(theme?.typography?.fontFamily?.body),
  ];
  const params: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const param = googleFontsParam(name);
    if (param && name && !seen.has(name)) {
      seen.add(name);
      params.push(param);
    }
  }
  return params;
}

export function PublicSiteLayout({ theme, children }: PublicSiteLayoutProps) {
  const fontParams = collectFontParams(theme);
  const href =
    fontParams.length > 0
      ? `https://fonts.googleapis.com/css2?${fontParams.join('&')}&display=swap`
      : null;

  return (
    <>
      {/* React 19 hoists these <link> tags into <head> automatically.
          Preconnect speeds the Google Fonts handshake; the stylesheet loads
          the heading + body families the theme requested. */}
      {href && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={href} />
        </>
      )}
      {children}
    </>
  );
}
