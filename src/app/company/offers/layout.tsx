import { redirect } from 'next/navigation';
import { BOOKING_ENABLED } from '@/lib/features';

// Last-minute offers need UNLOCKED's own booking (src/lib/features.ts).
export default function Layout({ children }: { children: React.ReactNode }) {
  if (!BOOKING_ENABLED) redirect('/company');
  return children;
}
