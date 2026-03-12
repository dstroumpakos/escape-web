import type { Metadata } from 'next';
import './globals.css';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { SafeConvex } from '@/components/SafeConvex';

// Force all pages to be dynamically rendered (SSR on-demand)
// This prevents Convex hooks from failing during build-time pre-rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Discover & Book Escape Rooms in Greece | UNLOCKED',
  description:
    'Find and book the best escape rooms near you. Browse by theme, difficulty & location. Instant online booking, player reviews & team leaderboards on UNLOCKED.',
  keywords: [
    'escape room',
    'book escape room',
    'escape room Greece',
    'escape game',
    'team building activities',
    'puzzle rooms',
    'adventure games',
    'escape room near me',
    'online booking',
    'player reviews',
  ],
  manifest: '/manifest.json',
  themeColor: '#FF1E1E',
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
  alternates: {
    canonical: 'https://unlocked.gr',
  },
  openGraph: {
    title: 'Discover & Book Escape Rooms in Greece | UNLOCKED',
    description:
      'Find and book the best escape rooms near you. Browse by theme, difficulty & location. Instant booking & player reviews.',
    type: 'website',
    url: 'https://unlocked.gr',
    siteName: 'UNLOCKED',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover & Book Escape Rooms in Greece | UNLOCKED',
    description:
      'Find and book the best escape rooms near you. Browse by theme, difficulty & location on UNLOCKED.',
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
      'Discover and book the best escape rooms in Greece. Browse rooms by theme, difficulty and location with instant online booking.',
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free to browse and book escape rooms',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
