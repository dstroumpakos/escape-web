import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Escape Room Merch Shop | UNLOCKED',
  description:
    'T-shirts, puzzles and keepsakes from UNLOCKED and the escape rooms you play. Pick merch up at your game or get it shipped.',
  alternates: { canonical: 'https://unlocked.gr/shop' },
  openGraph: {
    title: 'Escape Room Merch Shop | UNLOCKED',
    description: 'Merch from UNLOCKED and the escape rooms you love. Pick it up at your game or get it shipped.',
    url: 'https://unlocked.gr/shop',
    type: 'website',
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
