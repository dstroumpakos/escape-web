'use client';

import Link from 'next/link';
import { Crown, Lock, Package, Timer, Store, Truck, KeyRound } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { ProductView } from '../../../convex/merch';
import { euro } from './shopUi';
import { localeFor } from '@/lib/languages';

export function PriceTag({ p, large = false }: { p: ProductView; large?: boolean }) {
  const { t } = useTranslation();
  const size = large ? 'text-3xl' : 'text-lg';
  if (p.yourDiscountPercent > 0) {
    return (
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`${size} font-display font-black text-brand-gold tabular-nums`}>{euro(p.yourPriceCents)}</span>
        <span className="text-sm text-brand-text-muted line-through tabular-nums">{euro(p.priceCents)}</span>
        <span className="text-[11px] font-semibold text-brand-gold inline-flex items-center gap-1">
          <Crown className="w-3 h-3" /> {t('shop.badge.premium_price')}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`${size} font-display font-black text-brand-bone tabular-nums`}>{euro(p.priceCents)}</span>
      {p.premiumPriceCents !== null && (
        <span className="text-xs text-brand-gold inline-flex items-center gap-1">
          <Crown className="w-3 h-3" /> {t('shop.card.premium_from', { price: euro(p.premiumPriceCents) })}
        </span>
      )}
    </div>
  );
}

export function LockNote({ p }: { p: ProductView }) {
  const { t, language } = useTranslation();
  if (!p.locked) return null;
  const when = (ts: number | null) =>
    ts
      ? new Date(ts).toLocaleString(localeFor(language), {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
  const text =
    p.locked === 'premium_only'
      ? t('shop.lock.premium_only')
      : p.locked === 'unlock_escaped'
      ? t('shop.lock.unlock_escaped', { room: p.unlockRoomTitle ?? '' })
      : p.locked === 'unlock_played'
      ? t('shop.lock.unlock_played', { room: p.unlockRoomTitle ?? '' })
      : t('shop.lock.upcoming', { date: when(p.releaseAt) });
  const Icon = p.locked === 'premium_only' ? Crown : p.locked === 'upcoming' ? Timer : KeyRound;
  return (
    <p className="text-xs text-brand-text-secondary flex items-start gap-1.5">
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-gold" />
      <span>{text}</span>
    </p>
  );
}

export function ProductCard({ p, showSeller = true }: { p: ProductView; showSeller?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link href={`/shop/${p._id}`} className="card group flex flex-col">
      <div className="relative aspect-square bg-black/40 overflow-hidden">
        {p.images[0] ? (
          <img
            src={p.images[0]}
            alt={p.title}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              p.locked || p.soldOut ? 'opacity-60' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-brand-text-muted" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {p.release === 'early_access' && (
            <span className="text-[10px] font-type tracking-wider px-2 py-1 rounded-sm bg-brand-gold text-black">
              {t('shop.badge.early_access')}
            </span>
          )}
          {p.premiumOnly && (
            <span className="text-[10px] font-type tracking-wider px-2 py-1 rounded-sm bg-black/75 border border-brand-gold/60 text-brand-gold inline-flex items-center gap-1">
              <Crown className="w-3 h-3" /> {t('shop.badge.members_only')}
            </span>
          )}
          {p.unlockRule && (
            <span className="text-[10px] font-type tracking-wider px-2 py-1 rounded-sm bg-black/75 border border-purple-400/50 text-purple-300">
              {p.unlockRule === 'escaped' ? t('shop.badge.i_escaped') : t('shop.badge.i_played')}
            </span>
          )}
          {p.soldOut && (
            <span className="text-[10px] font-type tracking-wider px-2 py-1 rounded-sm bg-black/80 text-brand-text-secondary">
              {t('shop.badge.sold_out')}
            </span>
          )}
        </div>
        {p.locked && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-brand-gold" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        {showSeller && (
          <p className="text-[11px] font-type tracking-[0.12em] uppercase text-brand-text-muted truncate">
            {p.sellerName}
            {p.companyCity ? ` · ${p.companyCity}` : ''}
          </p>
        )}
        <h3 className="font-display font-bold text-brand-bone leading-tight line-clamp-2">{p.title}</h3>
        <div className="mt-auto space-y-1.5">
          <PriceTag p={p} />
          <LockNote p={p} />
          <p className="text-[11px] text-brand-text-muted flex items-center gap-3">
            {p.pickup && (
              <span className="inline-flex items-center gap-1">
                <Store className="w-3 h-3" /> {t('shop.card.pickup')}
              </span>
            )}
            {p.shipping && (
              <span className="inline-flex items-center gap-1">
                <Truck className="w-3 h-3" /> {t('shop.card.shipping')}
              </span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** What Premium gives in the shop. */
export function PerksBanner({ perks }: { perks: { isPremium: boolean; welcomeGiftAvailable: boolean; platformDiscountPercent: number; earlyAccessHours: number } }) {
  const { t } = useTranslation();
  return (
    <div className="panel p-5 sm:p-6 border-brand-gold/30! flex flex-col md:flex-row md:items-center gap-4">
      <div className="w-12 h-12 shrink-0 rounded-md bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center">
        <Crown className="w-6 h-6 text-brand-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-brand-bone">
          {perks.isPremium ? t('shop.perks.title_member') : t('shop.perks.title')}
        </p>
        <p className="text-sm text-brand-text-secondary mt-1">
          {t('shop.perks.line', {
            pct: String(perks.platformDiscountPercent),
            hours: String(perks.earlyAccessHours),
          })}
          {perks.welcomeGiftAvailable && <span className="text-brand-gold"> {t('shop.perks.gift_waiting')}</span>}
        </p>
      </div>
      {!perks.isPremium && (
        <Link href="/premium" className="btn-outline text-sm py-2! px-5! shrink-0 text-center">
          {t('shop.perks.get_premium')}
        </Link>
      )}
    </div>
  );
}
