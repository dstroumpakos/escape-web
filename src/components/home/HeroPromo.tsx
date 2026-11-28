'use client';

import Link from 'next/link';
import { Sparkles, MapPin, ArrowUpRight } from 'lucide-react';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { sideOf } from '@/lib/mode';

/** True while a room's paid promotion runs (convex/promo.ts). */
export function isPromoted(r: { promoUntil?: number }, now = Date.now()) {
  return typeof r.promoUntil === 'number' && r.promoUntil > now;
}

/**
 * Every promoted room, horror and puzzles alike, on both sides of the home:
 * horror first, then puzzles; oldest promotion first.
 */
export function usePromoRooms() {
  const rooms = useSafeQuery<any[]>(api.rooms.list);
  if (!rooms) return [];
  const now = Date.now();
  const order = (r: any) => (sideOf(r) === 'horror' ? 0 : 1);
  return rooms
    .filter((r) => isPromoted(r, now))
    .sort((a, b) => order(a) - order(b) || (a.promoSince ?? 0) - (b.promoSince ?? 0));
}

/**
 * Paid rooms (admin > Promo) in the home hero, so they are on the first
 * screen without scrolling. Small cards in a row; arrows when there are more.
 */
export function HeroPromo({ variant = 'horror' }: { variant?: 'horror' | 'puzzle' }) {
  const { t } = useTranslation();
  const rooms = usePromoRooms();
  if (rooms.length === 0) return null;

  const puzzle = variant === 'puzzle';
  // Gold frame and glow; the puzzle side is a little cooler
  const frame = puzzle
    ? 'from-[#f6d27a] via-[#8fb3ff]/40 to-[#f6d27a]'
    : 'from-brand-gold via-brand-red/60 to-brand-gold';
  const glow = puzzle
    ? 'shadow-[0_0_22px_rgba(242,199,92,0.18)] hover:shadow-[0_10px_34px_rgba(242,199,92,0.38)]'
    : 'shadow-[0_0_22px_rgba(201,154,46,0.16)] hover:shadow-[0_10px_34px_rgba(220,30,40,0.45)]';
  const ink = puzzle ? 'text-[#f6d27a]' : 'text-brand-gold';
  // Always horror on the top row, puzzles below. Both rows use the bigger
  // count, so the cards are the same size in the two rows.
  const groups = [rooms.filter((r) => sideOf(r) === 'horror'), rooms.filter((r) => sideOf(r) !== 'horror')].filter((g) => g.length);
  const n = Math.max(...groups.map((g) => g.length));

  return (
    <div className="mt-7 [@media(max-height:800px)]:mt-4 relative left-1/2 -translate-x-1/2 w-[min(1600px,calc(100vw-2rem))] text-left animate-fade-up animate-delay-700">
      {/* ── ✦ Standing out ✦ ── (players never see that a room paid) */}
      <div className={`mb-3 flex items-center justify-center gap-3 ${ink}`}>
        <span className="h-px w-10 sm:w-20 bg-linear-to-r from-transparent to-current opacity-60" />
        <span className="flex items-center gap-1.5 font-type text-[11px] tracking-[0.35em] uppercase">
          <Sparkles className="w-3.5 h-3.5" /> {t('promo.heading')} <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="h-px w-10 sm:w-20 bg-linear-to-l from-transparent to-current opacity-60" />
      </div>

      {/* Phones: a row to swipe. Wider screens: every card visible, up to 10 a row
          (5 on tablets, 8 on laptops), never wider than 300px, a last row centred; no arrows. */}
      {groups.map((group, gi) => (
      <div
        key={gi}
        style={{ '--n': n } as React.CSSProperties}
        className={`flex gap-3 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1 pt-1 pb-2
          sm:flex-wrap sm:overflow-visible sm:justify-center sm:gap-(--g)
          sm:[--c:min(var(--n),5)] lg:[--c:min(var(--n),8)] xl:[--c:min(var(--n),10)]
          ${n > 6 ? '[--g:0.625rem]' : '[--g:1rem]'}`}
      >
        {group.map((r) => (
          <Link
            key={r._id}
            href={`/rooms/${r._id}`}
            className={`group snap-start shrink-0 w-[220px] sm:w-[calc((100%-(var(--c)-1)*var(--g))/var(--c))] sm:max-w-[300px] rounded-xl p-px bg-linear-to-br ${frame} ${glow} transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="relative aspect-[16/11] [@media(max-height:800px)]:aspect-[16/9] rounded-[11px] overflow-hidden bg-black">
              {r.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              {/* Dark fade so the title reads on any photo */}
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
              {/* Shine that sweeps across on hover only */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-y-4 -left-1/2 w-1/3 rotate-12 bg-linear-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-[420%] transition-transform duration-1000 ease-out"
              />

              <span className={`absolute top-2 right-2 grid place-items-center w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 ${ink} opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}>
                <ArrowUpRight className="w-4 h-4" />
              </span>

              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className={`font-display font-bold leading-tight truncate ${n > 7 ? 'text-sm' : 'text-base'} ${puzzle ? 'text-[#f4ecd9]' : 'text-brand-bone'} [text-shadow:0_2px_10px_#000]`}>
                  {r.title}
                </p>
                <p className="mt-0.5 text-xs text-white/70 truncate flex items-center gap-1">
                  {r.location && <MapPin className={`w-3 h-3 shrink-0 ${ink}`} />}
                  {[r.companyName, r.location].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      ))}
    </div>
  );
}

/**
 * The split home (before the player picks a side): each half shows only its
 * own promoted rooms, puzzles on the left, horror on the right
 * (HomeHero → SplitHero). All of them at once in a grid, never hidden behind
 * a scroll: 2 a row on phones, 3 on tablets, 4 on desktop (5 when there are many).
 */
export function SidePromo({ side }: { side: 'horror' | 'puzzle' }) {
  const { t } = useTranslation();
  const rooms = usePromoRooms().filter((r) => sideOf(r) === side);
  if (rooms.length === 0) return null;

  const puzzle = side === 'puzzle';
  const frame = puzzle
    ? 'from-[#f6d27a] via-[#8fb3ff]/40 to-[#f6d27a]'
    : 'from-brand-gold via-brand-red/60 to-brand-gold';
  const glow = puzzle
    ? 'shadow-[0_0_18px_rgba(242,199,92,0.16)] hover:shadow-[0_8px_28px_rgba(242,199,92,0.36)]'
    : 'shadow-[0_0_18px_rgba(201,154,46,0.14)] hover:shadow-[0_8px_28px_rgba(220,30,40,0.45)]';
  const ink = puzzle ? 'text-[#f6d27a]' : 'text-brand-gold';

  return (
    <div className="mt-8 [@media(max-height:800px)]:mt-5 text-left">
      <div className={`mb-2.5 flex items-center gap-2 ${ink}`}>
        <Sparkles className="w-3.5 h-3.5" />
        <span className="font-type text-[11px] tracking-[0.3em] uppercase">{t('promo.heading')}</span>
        <span className="h-px flex-1 max-w-24 bg-linear-to-r from-current to-transparent opacity-60" />
      </div>
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${rooms.length > 8 ? 'xl:grid-cols-5' : ''} gap-2.5 lg:gap-3 pt-1 pb-2`}>
        {rooms.map((r) => (
          <Link
            key={r._id}
            href={`/rooms/${r._id}`}
            className={`group min-w-0 rounded-xl p-px bg-linear-to-br ${frame} ${glow} transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="relative aspect-[16/11] rounded-[11px] overflow-hidden bg-black">
              {r.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className={`font-display font-bold text-sm leading-tight truncate ${puzzle ? 'text-[#f4ecd9]' : 'text-brand-bone'} [text-shadow:0_2px_10px_#000]`}>
                  {r.title}
                </p>
                <p className="mt-0.5 text-[11px] text-white/70 truncate flex items-center gap-1">
                  {r.location && <MapPin className={`w-3 h-3 shrink-0 ${ink}`} />}
                  {[r.companyName, r.location].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
