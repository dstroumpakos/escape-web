'use client';

import { useParams } from 'next/navigation';
import { ProfileView } from '@/components/profile/ProfileView';

/** A player's public profile (convex/social.ts). */
export default function PlayerProfilePage() {
  const params = useParams();
  return <ProfileView userId={params.id as string} />;
}
