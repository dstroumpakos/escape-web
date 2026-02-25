import type { Metadata } from 'next';
import './globals.css';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { AuthProvider } from '@/lib/auth';

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
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
