'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { HorrorHeading } from '@/components/horror/HorrorHeading';
import { OfferCard, type Offer } from '@/components/offers/OfferCard';

export default function OffersPage() {
  const { t } = useTranslation();
  const offers = useSafeQuery<Offer[]>(api.slotOffers.listActive);
  return (
    <section className="relative pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HorrorHeading kicker={t('offers.kicker')} title={t('offers.title')} subtitle={t('offers.subtitle')} />
        {offers === undefined ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 panel animate-pulse" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="panel max-w-lg mx-auto text-center p-10">
            <Flame className="w-10 h-10 mx-auto mb-3 text-brand-red-light/60" />
            <p className="text-brand-bone font-semibold mb-1">{t('offers.empty_title')}</p>
            <p className="text-sm text-brand-text-secondary mb-6">{t('offers.empty_desc')}</p>
            <Link href="/discover" className="btn-outline inline-block">{t('nav.discover')}</Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <OfferCard key={`${o.roomId}-${o.date}-${o.time}`} offer={o} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
