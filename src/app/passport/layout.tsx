import { redirect } from 'next/navigation';
import { PASSPORT_ENABLED } from '@/lib/features';

// The passport and QR stamps are hidden for now (src/lib/features.ts): no passport page.
export default function Layout({ children }: { children: React.ReactNode }) {
  if (!PASSPORT_ENABLED) redirect('/');
  return children;
}
