import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Κατάταξη παικτών | UNLOCKED',
  description: 'Οι παίκτες με τους περισσότερους πόντους στην κοινότητα του UNLOCKED.',
  alternates: { canonical: 'https://unlocked.gr/leaderboard' },
  openGraph: { title: 'Κατάταξη παικτών | UNLOCKED', description: 'Οι παίκτες με τους περισσότερους πόντους στην κοινότητα του UNLOCKED.', url: 'https://unlocked.gr/leaderboard', siteName: 'UNLOCKED' },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
