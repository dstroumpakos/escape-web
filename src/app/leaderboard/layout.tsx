import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Κατάταξη παικτών | UNLOCKED',
  description: 'Οι παίκτες με τις περισσότερες σφραγίδες και αποδράσεις στο UNLOCKED.',
  alternates: { canonical: 'https://unlocked.gr/leaderboard' },
  openGraph: { title: 'Κατάταξη παικτών | UNLOCKED', description: 'Οι παίκτες με τις περισσότερες σφραγίδες και αποδράσεις στο UNLOCKED.', url: 'https://unlocked.gr/leaderboard', siteName: 'UNLOCKED' },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
