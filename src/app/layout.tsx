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
  title: 'Escape Room Booking & Management Platform | UNLOCKED',
  description:
    'Discover and book the best escape rooms near you, or manage your escape room business with our all-in-one platform. Instant bookings, real-time analytics & more.',
  keywords: [
    'escape room',
    'escape room booking',
    'escape room platform',
    'escape room management software',
    'escape room booking system',
    'book escape room online',
    'escape game',
    'team building',
    'puzzle',
    'adventure',
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
    title: 'Escape Room Booking & Management Platform | UNLOCKED',
    description:
      'Discover and book the best escape rooms near you, or manage your escape room business with our all-in-one platform.',
    type: 'website',
    url: 'https://unlocked.gr',
    siteName: 'UNLOCKED',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Escape Room Booking & Management Platform | UNLOCKED',
    description:
      'Discover and book the best escape rooms. Manage your escape room business with UNLOCKED.',
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
      'All-in-one escape room booking and management platform. Discover, book and manage escape rooms with UNLOCKED.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free plan available for escape room businesses',
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
