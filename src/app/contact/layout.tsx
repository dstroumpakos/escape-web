import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Επικοινωνία | UNLOCKED',
  description: 'Επικοινώνησε με την ομάδα του UNLOCKED.',
  alternates: { canonical: 'https://unlocked.gr/contact' },
  openGraph: { title: 'Επικοινωνία | UNLOCKED', description: 'Επικοινώνησε με την ομάδα του UNLOCKED.', url: 'https://unlocked.gr/contact', siteName: 'UNLOCKED' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
