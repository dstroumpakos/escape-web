import { redirect } from 'next/navigation';
import { BOOKING_ENABLED } from '@/lib/features';

// UNLOCKED's own booking is off (src/lib/features.ts): back to the room.
export default async function BookLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  if (!BOOKING_ENABLED) redirect(`/rooms/${(await params).id}`);
  return children;
}
