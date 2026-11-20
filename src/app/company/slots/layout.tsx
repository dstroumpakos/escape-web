import { redirect } from 'next/navigation';
import { BOOKING_ENABLED } from '@/lib/features';

// UNLOCKED's own booking is off (src/lib/features.ts): no slots page for companies.
export default function Layout({ children }: { children: React.ReactNode }) {
  if (!BOOKING_ENABLED) redirect('/company');
  return children;
}
