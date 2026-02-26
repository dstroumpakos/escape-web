import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedRooms } from '@/components/home/FeaturedRooms';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ThemesSection } from '@/components/home/ThemesSection';
import { StatsBar } from '@/components/home/StatsBar';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { ForBusinesses } from '@/components/home/ForBusinesses';
import { SafeConvex } from '@/components/SafeConvex';

export default function Home() {
  return (
    <>
      <SafeConvex><HeroSection /></SafeConvex>
      <SafeConvex><StatsBar /></SafeConvex>
      <SafeConvex><FeaturedRooms /></SafeConvex>
      <ThemesSection />
      <HowItWorks />
      <TestimonialsSection />
      <ForBusinesses />
    </>
  );
}
