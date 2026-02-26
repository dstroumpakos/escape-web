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
  title: 'UNLOCKED - Discover & Book Escape Rooms',
  description:
    'Find the best escape rooms near you. Book instantly, challenge your team, and unlock unforgettable experiences.',
  keywords: ['escape room', 'escape game', 'team building', 'puzzle', 'adventure', 'booking'],
  openGraph: {
    title: 'UNLOCKED - Discover & Book Escape Rooms',
    description: 'Find the best escape rooms near you. Book instantly, challenge your team.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
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
