import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Για Escape Rooms: προβολή και σφραγίδες | UNLOCKED',
  description: 'Βάλε το escape room σου στο UNLOCKED: δωρεάν προβολή, παίκτες προς το site σου, σφραγίδες και στατιστικά.',
  alternates: { canonical: 'https://unlocked.gr/for-escape-rooms' },
  openGraph: { title: 'Για Escape Rooms: προβολή και σφραγίδες | UNLOCKED', description: 'Βάλε το escape room σου στο UNLOCKED: δωρεάν προβολή, παίκτες προς το site σου, σφραγίδες και στατιστικά.', url: 'https://unlocked.gr/for-escape-rooms', siteName: 'UNLOCKED' },
};

export default function ForEscapeRoomsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
