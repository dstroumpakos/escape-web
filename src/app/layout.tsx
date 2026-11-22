import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { jsonLd as safeJsonLd } from '@/lib/jsonLd';
import { SafeConvex } from '@/components/SafeConvex';

// Force all pages to be dynamically rendered (SSR on-demand)
// This prevents Convex hooks from failing during build-time pre-rendering
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#080505',
};

export const metadata: Metadata = {
  title: 'Discover Escape Rooms & Collect Stamps | UNLOCKED',
  description:
    'Discover the best escape rooms near you, join the community of players and collect a stamp with every escape. Browse by theme, difficulty & location on UNLOCKED.',
  keywords: [
    'escape room',
    'book escape room',
    'escape rooms worldwide',
    'escape game',
    'team building activities',
    'puzzle rooms',
    'adventure games',
    'escape room near me',
    'player reviews',
  ],
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Discover Escape Rooms & Collect Stamps | UNLOCKED',
    description:
      'Discover the best escape rooms near you, join the community and collect a stamp with every escape.',
    type: 'website',
    url: 'https://unlocked.gr',
    siteName: 'UNLOCKED',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Escape Rooms & Collect Stamps | UNLOCKED',
    description:
      'Discover the best escape rooms near you and collect a stamp with every escape on UNLOCKED.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'UNLOCKED',
    url: 'https://unlocked.gr',
    description:
      'Discover escape rooms around the world, join the community of players and collect a stamp with every escape.',
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free for players',
    },
    creator: {
      '@type': 'Organization',
      name: 'UNLOCKED',
      url: 'https://unlocked.gr',
      logo: 'https://unlocked.gr/icon-512',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['English', 'Greek'],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Athens',
        addressCountry: 'GR',
      },
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Serif+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Nosifer&family=Special+Elite&family=Cousine:wght@400;700&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ConvexClientProvider>
          <I18nProvider>
            <AuthProvider>
              <LayoutShell>{children}</LayoutShell>
            </AuthProvider>
          </I18nProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
