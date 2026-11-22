'use client';

import { HorrorHeading } from '@/components/horror/HorrorHeading';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { RoomCard, toRoomCardData, type RoomCardData } from '@/components/rooms/RoomCard';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import { useMode, forMode } from '@/lib/mode';
import { shownRating } from '@/lib/roomMedia';

export function FeaturedRooms() {
  const { t } = useTranslation();
  const mode = useMode();
  const convexRooms = useSafeQuery<any[]>(api.rooms.list);

  // Map Convex rooms to our card format. No placeholder fallback: until there
  // are real (active) rooms, the whole section stays hidden.
  // EA partner rooms get priority (Featured Spotlight benefit)
  const rooms: RoomCardData[] = convexRooms
    ? forMode([...convexRooms], mode)
          .sort((a: any, b: any) => {
            // EA partner rooms first
            const aEA = a.isEarlyAccessPartner ? 1 : 0;
            const bEA = b.isEarlyAccessPartner ? 1 : 0;
            if (aEA !== bEA) return bEA - aEA;
            return (shownRating(b)?.rating ?? 0) - (shownRating(a)?.rating ?? 0);
          })
          .slice(0, 6)
          .map(toRoomCardData)
    : [];

  if (rooms.length === 0) return null;

  return (
    <section id="rooms" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <HorrorHeading
          kicker={t('horror.featured_tag')}
          title={t('featured.title')}
          highlight={t('featured.title_highlight')}
          subtitle={t('featured.subtitle')}
        />

        {/* Grid */}
        {/* Flex, not grid: a last row that isn't full sits centred instead of leaving a hole */}
        <StaggerContainer stagger={0.1} className="flex flex-wrap justify-center gap-6 md:gap-8">
          {rooms.map((room, i) => (
            <StaggerItem
              key={room.id ?? i}
              animation="fadeUp"
              className="w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(50%-1rem)] lg:w-[calc((100%-4rem)/3)]"
            >
              <RoomCard room={room} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CTA */}
        <AnimateIn animation="fadeUp" delay={0.4} className="text-center mt-12">
          <Link href="/discover" className="btn-outline inline-block">{t('featured.view_all')}</Link>
        </AnimateIn>
      </div>
    </section>
  );
}
