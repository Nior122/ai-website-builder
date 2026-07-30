import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ─── Output ───────────────────────────────────────────────────────────
  output: 'standalone',

  // ─── Fix workspace root warning (multiple lockfiles) ───────────────────
  outputFileTracingRoot: path.join(__dirname),

  // ─── React Configuration ───────────────────────────────────────────────
  reactStrictMode: true,

  // ─── Experimental Features ─────────────────────────────────────────────
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize CSS
    optimizeCss: true,
  },

  // ─── Image Optimization ────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // ─── Security Headers ──────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.blob.core.windows.net https://*.amazonaws.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://img.clerk.com https://*.clerk.accounts.dev",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com wss://*.clerk.com wss://*.clerk.accounts.dev",
              "frame-src 'self' https://js.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ─── Redirects ─────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/projects',
        permanent: false,
      },
    ];
  },

  // ─── Rewrites (for preview URLs) ──────────────────────────────────────
  async rewrites() {
    return [
      {
        source: '/preview/:projectId',
        destination: '/preview/:projectId',
      },
    ];
  },
};

export default nextConfig;
