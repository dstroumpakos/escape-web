import dynamic from 'next/dynamic';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Map | UNLOCKED',
  description: 'Find escape rooms near you on the map.',
};

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="pt-16 md:pt-20 h-screen w-full flex flex-col">
      <div className="flex-1 w-full relative z-0">
        <MapView />
      </div>
    </div>
  );
}
