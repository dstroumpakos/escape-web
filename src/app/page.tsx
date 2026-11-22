import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedRooms } from '@/components/home/FeaturedRooms';
import { HowItWorks } from '@/components/home/HowItWorks';
import { LabyrinthSection } from '@/components/home/LabyrinthSection';
import { ThemesSection } from '@/components/home/ThemesSection';
import { DownloadCTA } from '@/components/home/DownloadCTA';
import { SEOContent } from '@/components/home/SEOContent';
import { SafeConvex } from '@/components/SafeConvex';
import { LastMinuteOffers } from '@/components/home/LastMinuteOffers';
import type { Metadata } from 'next';
import { BOOKING_ENABLED } from '@/lib/features';

export const metadata: Metadata = { alternates: { canonical: 'https://unlocked.gr' } };

export default function Home() {
  return (
    <>
      <SafeConvex><HeroSection /></SafeConvex>
      {BOOKING_ENABLED && <SafeConvex><LastMinuteOffers /></SafeConvex>}
      <SafeConvex><FeaturedRooms /></SafeConvex>
      <LabyrinthSection />
      <ThemesSection />
      <HowItWorks />
      <DownloadCTA />
      {/* Long-form copy for search engines sits last, in small type */}
      <SEOContent />
    </>
  );
}
