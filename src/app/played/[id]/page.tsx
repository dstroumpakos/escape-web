'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Users, MapPin, Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { useMainSiteUrl } from '@/lib/companyAuth';

/**
 * "Claim your page": a room players logged that isn't on UNLOCKED yet
 * (convex/plays.ts communityRooms). Players share this link with the escape
 * room; the team uses it in outreach.
 */
export default function PlayedRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation();
  const valid = /^[a-z0-9]{20,40}$/.test(id);
  const room = useQuery(api.plays.communityRoom, valid ? { id: id as any } : 'skip');
  const registerUrl = useMainSiteUrl('/for-escape-rooms');

  if (valid && room === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>;
  }
  if (!valid || !room) {
    return (
      <section className="max-w-xl mx-auto px-4 pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold">{t('pl.claim.missing')}</h1>
        <Link href="/discover" className="btn-primary inline-flex mt-6">{t('pl.claim.browse')}</Link>
      </section>
    );
  }
  if (room.merged && room.roomId) {
    return (
      <section className="max-w-xl mx-auto px-4 pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold">{t('pl.claim.joined', { room: room.name })}</h1>
        <Link href={`/rooms/${room.roomId}`} className="btn-primary inline-flex items-center gap-2 mt-6">
          {t('pl.claim.open_room')} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-4 pt-28 pb-20">
      <p className="font-type text-xs tracking-[0.3em] text-brand-gold/80">UNLOCKED · PASSPORT</p>
      <h1 className="text-3xl sm:text-4xl font-display font-bold text-brand-bone mt-3">{room.name}</h1>
      <p className="text-brand-text-secondary mt-2 flex items-center gap-1.5">
        <MapPin className="w-4 h-4" /> {[room.companyName, room.city, room.country].filter(Boolean).join(' · ')}
      </p>

      <div className="mt-8 rounded-2xl border border-brand-border bg-[#1a0f0b] p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-red/15 flex items-center justify-center shrink-0">
          <Users className="w-8 h-8 text-brand-red-light" />
        </div>
        <div>
          <p className="text-3xl font-display font-bold tabular-nums">{room.players}</p>
          <p className="text-sm text-brand-text-secondary">{t('pl.claim.players', { n: String(room.players) })}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-brand-surface p-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><KeyRound className="w-5 h-5 text-brand-gold" /> {t('pl.claim.owner_title')}</h2>
        <p className="text-brand-text-secondary mt-2 text-sm">{t('pl.claim.owner_text')}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-brand-text-secondary list-disc pl-5">
          <li>{t('pl.claim.b1')}</li>
          <li>{t('pl.claim.b2')}</li>
          <li>{t('pl.claim.b3')}</li>
        </ul>
        <a href={registerUrl} className="btn-primary inline-flex items-center gap-2 mt-6">
          {t('pl.claim.cta')} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
