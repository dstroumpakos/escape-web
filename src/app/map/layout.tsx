import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Χάρτης Escape Rooms | UNLOCKED',
  description: 'Δες στον χάρτη τα escape rooms κοντά σου και βρες την επόμενη απόδρασή σου.',
  alternates: { canonical: 'https://unlocked.gr/map' },
  openGraph: { title: 'Χάρτης Escape Rooms | UNLOCKED', description: 'Δες στον χάρτη τα escape rooms κοντά σου και βρες την επόμενη απόδρασή σου.', url: 'https://unlocked.gr/map', siteName: 'UNLOCKED' },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
