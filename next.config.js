/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Security headers (checklist item 17).
//
// The full Content-Security-Policy is sent as REPORT-ONLY for now: the browser
// logs what it would block (DevTools console) but blocks nothing. Once the
// console stays clean on every page, rename the header to
// "Content-Security-Policy" to enforce it.
const cspReportOnly = [
  "default-src 'self'",
  // Next.js inlines small scripts; dev mode also needs eval for hot reload.
  // Google Identity Services + Sign in with Apple JS (login/signup buttons).
  `script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client https://appleid.cdn-apple.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://accounts.google.com/gsi/style",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Room images and photos come from Convex storage and company sites.
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  // Convex (HTTP + websocket), map search, translations.
  `connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://nominatim.openstreetmap.org https://api.mymemory.translated.net https://accounts.google.com/gsi/${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
  "worker-src 'self' blob:",
  // The Google button is an iframe from accounts.google.com; room trailers are YouTube/Vimeo.
  "frame-src 'self' https://accounts.google.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

// Enforced today: these can't break the site.
const cspEnforced = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"].join('; ');

const securityHeaders = [
  // Browsers remember to use HTTPS only (2 years). Not sent in dev (http://localhost).
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
  // No one may show the site inside an iframe (clickjacking). The booking
  // widget is a <script> on the company's own site, not an iframe of ours.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: cspEnforced },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Location for the map; nothing else.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)' },
];

const nextConfig = {
  // The image optimizer (/_next/image) only fetches from our own Convex
  // storage. With "**" it would fetch and resize images from any site
  // (checklist item 22). next/image isn't used today; add hosts here if it is.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
        pathname: '/api/storage/**',
      },
    ],
  },
  experimental: {
    // Set by the Next.js security upgrade agent (16.4.0 -> 16.4.5)
    agentUpgrade: 'security',
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
