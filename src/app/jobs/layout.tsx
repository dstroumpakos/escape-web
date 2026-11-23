import type { Metadata } from 'next';

const title = 'Αγγελίες εργασίας σε escape rooms | UNLOCKED';
const description = 'Escape rooms που ψάχνουν game masters, ηθοποιούς και προσωπικό υποδοχής. Δες τις ανοιχτές θέσεις και επικοινώνησε απευθείας.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://unlocked.gr/jobs' },
  openGraph: { title, description, url: 'https://unlocked.gr/jobs', siteName: 'UNLOCKED' },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
