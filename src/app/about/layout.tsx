import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Σχετικά με το UNLOCKED',
  description: 'Το UNLOCKED είναι ο οδηγός και η κοινότητα για escape rooms, με κριτικές και φωτογραφίες από τους παίκτες.',
  alternates: { canonical: 'https://unlocked.gr/about' },
  openGraph: { title: 'Σχετικά με το UNLOCKED', description: 'Το UNLOCKED είναι ο οδηγός και η κοινότητα για escape rooms, με κριτικές και φωτογραφίες από τους παίκτες.', url: 'https://unlocked.gr/about', siteName: 'UNLOCKED' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
