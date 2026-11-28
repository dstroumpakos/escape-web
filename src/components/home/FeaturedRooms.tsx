'use client';

import { HorrorHeading } from '@/components/horror/HorrorHeading';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { RoomCard, toRoomCardData } from '@/components/rooms/RoomCard';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import { shownRating } from '@/lib/roomMedia';
import { sideOf, type Mode } from '@/lib/mode';
import { isPromoted } from './HeroPromo';
import { DualBackdrop, SidePanel } from './DualSides';

const PER_SIDE = 4;

/**
 * Featured rooms on the home page, both sides at once like the hero above
 * (DualSides.tsx): puzzle rooms on the left, horror rooms on the right.
 * Paid promotions are already in the hero (HeroPromo → SidePromo), so they
 * only fill a side that has fewer than four other rooms; EA partner rooms
 * first, then the best rated. No placeholder rooms: a side with none is left
 * out, and with none at all the section is hidden.
 */
export function FeaturedRooms() {
  const { t } = useTranslation();
  const convexRooms = useSafeQuery<any[]>(api.rooms.list);

  const now = Date.now();
  const sorted = [...(convexRooms ?? [])]
    .sort((a: any, b: any) => {
      const aEA = a.isEarlyAccessPartner ? 1 : 0;
      const bEA = b.isEarlyAccessPartner ? 1 : 0;
      if (aEA !== bEA) return bEA - aEA;
      return (shownRating(b)?.rating ?? 0) - (shownRating(a)?.rating ?? 0);
    });
  const sides = (['puzzle', 'horror'] as Mode[])
    .map((side) => {
      const ofSide = sorted.filter((r: any) => sideOf(r) === side);
      const picked = [...ofSide.filter((r: any) => !isPromoted(r, now)), ...ofSide.filter((r: any) => isPromoted(r, now))];
      return { side, rooms: picked.slice(0, PER_SIDE).map(toRoomCardData) };
    })
    .filter((s) => s.rooms.length > 0);

  if (sides.length === 0) return null;
  const both = sides.length === 2;

  return (
    <section id="rooms" className="relative py-24 md:py-32 overflow-hidden">
      <DualBackdrop />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HorrorHeading
          kicker={t('horror.featured_tag')}
          title={t('featured.title')}
          highlight={t('featured.title_highlight')}
          subtitle={t('featured.subtitle')}
        />

        <div className={`grid gap-6 lg:gap-8 ${both ? 'lg:grid-cols-2' : ''}`}>
          {sides.map(({ side, rooms }) => (
            <SidePanel key={side} side={side}>
              <StaggerContainer stagger={0.1} className={`grid gap-4 sm:gap-5 sm:grid-cols-2 ${both ? '' : 'lg:grid-cols-4'}`}>
                {rooms.map((room, i) => (
                  <StaggerItem key={room.id ?? i} animation="fadeUp">
                    <RoomCard room={room} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </SidePanel>
          ))}
        </div>

        <AnimateIn animation="fadeUp" delay={0.4} className="text-center mt-12">
          <Link href="/discover" className="btn-outline inline-block">{t('featured.view_all')}</Link>
        </AnimateIn>
      </div>
    </section>
  );
}
