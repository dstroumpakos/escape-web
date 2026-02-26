'use client';

import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
    </div>
  ),
});

export default function MapPage() {
  const { t } = useTranslation();

  return (
    <div className="pt-16 md:pt-20 h-screen w-full flex flex-col">
      <div className="flex-1 w-full relative z-0">
        <MapView />
      </div>
    </div>
  );
}
