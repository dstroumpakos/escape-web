'use client';

import Link from 'next/link';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { HorrorHeading } from '@/components/horror/HorrorHeading';
import { OfferCard, type Offer } from '@/components/offers/OfferCard';

/** Homepage strip of last-minute offers. Hidden when there are none. */
export function LastMinuteOffers() {
  const { t } = useTranslation();
  const offers = useSafeQuery<Offer[]>(api.slotOffers.listActive);
  if (!offers || offers.length === 0) return null;
  return (
    <section className="relative py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HorrorHeading kicker={t('offers.kicker')} title={t('offers.title')} subtitle={t('offers.subtitle')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.slice(0, 6).map((o) => (
            <OfferCard key={`${o.roomId}-${o.date}-${o.time}`} offer={o} />
          ))}
        </div>
        {offers.length > 6 && (
          <div className="text-center mt-10">
            <Link href="/offers" className="btn-outline inline-block">{t('offers.see_all')}</Link>
          </div>
        )}
      </div>
    </section>
  );
}
