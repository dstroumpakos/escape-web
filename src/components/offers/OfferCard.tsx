'use client';

import Link from 'next/link';
import { Flame, MapPin, Clock, Users, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export type Offer = {
  roomId: string;
  title: string;
  image: string;
  location: string;
  rating: number;
  players: string;
  duration: number;
  price: number;
  companyName: string;
  date: string;
  time: string;
  percent: number;
};

/** Greek "today" (times before 06:00 still count as the previous day). */
export function athensToday(): string {
  const now = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(now);
}

export function OfferCard({ offer }: { offer: Offer }) {
  const { t } = useTranslation();
  const day = offer.date === athensToday() ? t('offers.today') : t('offers.tomorrow');
  const perPerson = Math.round(offer.price * (100 - offer.percent)) / 100;
  return (
    <Link
      href={`/rooms/${offer.roomId}/book?date=${offer.date}&time=${encodeURIComponent(offer.time)}`}
      className="group block panel overflow-hidden hover:border-brand-red/50 transition-all"
    >
      <div className="relative aspect-[16/9] bg-black/40">
        {offer.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <span className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-brand-red px-2.5 py-1 text-sm font-black text-white shadow-[0_0_18px_rgba(var(--glow),0.6)]">
          <Flame className="w-4 h-4" /> -{offer.percent}%
        </span>
        <span className="absolute bottom-3 left-3 rounded-md bg-black/70 border border-brand-gold/40 px-2.5 py-1 text-sm font-semibold text-brand-gold tabular-nums">
          {day} · {offer.time}
        </span>
      </div>
      <div className="p-4">
        <p className="font-display font-bold text-brand-bone truncate">{offer.title}</p>
        <p className="text-xs text-brand-text-muted truncate mb-3">{offer.companyName}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-text-secondary mb-3">
          {offer.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{offer.location}</span>
          )}
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{offer.players}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{offer.duration}′</span>
          {offer.rating > 0 && (
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-brand-gold" />{offer.rating.toFixed(1)}</span>
          )}
        </div>
        <p className="text-sm">
          <span className="line-through text-brand-text-muted mr-2 tabular-nums">€{offer.price}</span>
          <span className="font-bold text-brand-bone tabular-nums">€{perPerson}</span>
          <span className="text-brand-text-muted"> {t('offers.per_person')}</span>
        </p>
      </div>
    </Link>
  );
}
