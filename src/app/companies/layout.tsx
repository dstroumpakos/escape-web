import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Εταιρείες Escape Room | UNLOCKED',
  description: 'Όλες οι εταιρείες escape room στο UNLOCKED: τα δωμάτιά τους, κριτικές και πού βρίσκονται.',
  alternates: { canonical: 'https://unlocked.gr/companies' },
  openGraph: { title: 'Εταιρείες Escape Room | UNLOCKED', description: 'Όλες οι εταιρείες escape room στο UNLOCKED: τα δωμάτιά τους, κριτικές και πού βρίσκονται.', url: 'https://unlocked.gr/companies', siteName: 'UNLOCKED' },
};

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
