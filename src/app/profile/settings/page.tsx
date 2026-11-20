'use client';

import { ProfileOrSettings } from '@/components/profile/ProfileOrSettings';

/** Account settings: name, phone, password, badges, saved rooms, sign out. */
export default function ProfileSettingsPage() {
  return <ProfileOrSettings mode="settings" />;
}
