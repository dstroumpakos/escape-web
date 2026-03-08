'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CompanyPhotosPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to the Photos app for the new room-based flow
    window.location.href = 'https://photos.unlocked.gr';
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-brand-text-muted">Redirecting to Photos Tool...</p>
    </div>
  );
}
