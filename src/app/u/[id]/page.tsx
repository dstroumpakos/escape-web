'use client';

import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useParams , useRouter } from 'next/navigation';
import { ProfileView } from '@/components/profile/ProfileView';

/** A player's public profile (convex/social.ts). */
export default function PlayerProfilePage() {

  // The community is for logged-in players only.
  const { isAuthenticated: loggedIn, isLoading: authLoading } = useAuth();
  const routerForGuard = useRouter();
  useEffect(() => {
    if (!authLoading && !loggedIn) routerForGuard.replace('/login');
  }, [authLoading, loggedIn, routerForGuard]);
  const params = useParams();
  return <ProfileView userId={params.id as string} />;
}
