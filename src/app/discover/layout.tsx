import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Όλα τα Escape Rooms: θέματα, δυσκολία, κριτικές | UNLOCKED',
  description: 'Βρες escape rooms ανά θέμα, δυσκολία και πόλη. Φωτογραφίες και κριτικές παικτών για κάθε δωμάτιο.',
  alternates: { canonical: 'https://unlocked.gr/discover' },
  openGraph: { title: 'Όλα τα Escape Rooms: θέματα, δυσκολία, κριτικές | UNLOCKED', description: 'Βρες escape rooms ανά θέμα, δυσκολία και πόλη. Φωτογραφίες και κριτικές παικτών για κάθε δωμάτιο.', url: 'https://unlocked.gr/discover', siteName: 'UNLOCKED' },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
