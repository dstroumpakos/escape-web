import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedRooms } from '@/components/home/FeaturedRooms';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ThemesSection } from '@/components/home/ThemesSection';
import { StatsBar } from '@/components/home/StatsBar';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { DownloadCTA } from '@/components/home/DownloadCTA';
import { ForBusinesses } from '@/components/home/ForBusinesses';

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturedRooms />
      <ThemesSection />
      <HowItWorks />
      <TestimonialsSection />
      <ForBusinesses />
      <DownloadCTA />
    </>
  );
}
