import { redirect } from 'next/navigation';
import { BOOKING_ENABLED } from '@/lib/features';

// UNLOCKED takes no room bookings or payments while its own booking is off
// (src/lib/features.ts), so there is nothing to confirm here. (viva-return
// stays open: merch orders paid with Viva come back through it.)
export default function Layout({ children }: { children: React.ReactNode }) {
  if (!BOOKING_ENABLED) redirect('/');
  return children;
}
