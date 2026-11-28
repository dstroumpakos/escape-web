'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, KeyRound, Search, Skull } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ROOM_THEMES } from '@/lib/roomThemes';
import { SUBTHEMES } from '../../../convex/roomCategories';
import { setMode, type Mode } from '@/lib/mode';
import { SidePromo } from './HeroPromo';
import { BloodDrips } from '@/components/horror/BloodDrips';
import { WatchingEyes } from '@/components/horror/WatchingEyes';

/** The chips under each side: its first subcategories (convex/roomCategories.ts). */
const PUZZLE_CHIPS = SUBTHEMES.puzzle.slice(0, 6);
const HORROR_CHIPS = SUBTHEMES.horror;
const themesOf = (values: string[]) => ROOM_THEMES.filter((th) => values.includes(th.value));

/**
 * The home hero: always the split "puzzles or horror" hero, both sides, whatever
 * the player picked. The home never changes with the side (lib/mode.ts →
 * usePageMode); only the other tabs do.
 */
export function HomeHero() {
  return <SplitHero />;
}

/** Pick a side and go to its rooms (a theme chip goes straight to that theme). */
function usePick() {
  const router = useRouter();
  return (side: Mode, theme?: string) => {
    setMode(side);
    router.push(theme ? `/discover?theme=${encodeURIComponent(theme)}` : '/discover');
  };
}

function Stars({ count = 40, seed = 3 }: { count?: number; seed?: number }) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }, (_, i) => {
        const size = rnd() < 0.15 ? 3 : rnd() < 0.5 ? 2 : 1;
        return (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-pulse-soft"
            style={{
              left: `${rnd() * 100}%`,
              top: `${rnd() * 100}%`,
              width: size,
              height: size,
              opacity: 0.25 + rnd() * 0.6,
              animationDelay: `${rnd() * 3}s`,
              boxShadow: size === 3 ? '0 0 6px 1px rgba(242,199,92,0.7)' : undefined,
              backgroundColor: size === 3 ? '#f6d27a' : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/** Two constellations, gold dots joined by faint lines. */
function Constellations({ className = '' }: { className?: string }) {
  const a = [[8, 30], [22, 18], [36, 26], [48, 14]];
  const b = [[60, 52], [74, 44], [86, 58], [72, 70], [60, 52]];
  const line = (pts: number[][]) => pts.map((p) => p.join(',')).join(' ');
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}>
      <polyline points={line(a)} fill="none" stroke="rgba(242,199,92,0.25)" strokeWidth="0.15" strokeDasharray="0.6 0.6" />
      <polyline points={line(b)} fill="none" stroke="rgba(242,199,92,0.25)" strokeWidth="0.15" strokeDasharray="0.6 0.6" />
      {[...a, ...b].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.45" fill="#f6d27a" />
      ))}
    </svg>
  );
}

function SplitHero() {
  const { t } = useTranslation();
  const pick = usePick();
  const puzzleThemes = themesOf(PUZZLE_CHIPS);
  const horrorThemes = themesOf(HORROR_CHIPS);

  return (
    <section className="split-hero relative md:min-h-[100svh] overflow-hidden bg-[#050202] md:flex md:flex-col">
      <div className="relative flex flex-col md:grid md:grid-cols-1 md:grid-rows-1 md:flex-1">
        {/* ── Puzzles: night sky ───────────────────── */}
        <div className="group/p relative md:col-start-1 md:row-start-1 md:[clip-path:polygon(0_0,58%_0,42%_100%,0_100%)] overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(80% 70% at 30% 40%, #1d3060 0%, #0c1532 55%, #060b1a 100%)' }}
          />
          <Stars count={46} seed={7} />
          <Constellations className="opacity-80" />
          <KeyRound aria-hidden className="absolute right-[20%] md:right-[50%] top-[16%] w-10 h-10 text-[#f2c75c]/60 rotate-[-30deg]" />
          <Search aria-hidden className="absolute left-[8%] bottom-[10%] md:left-[30%] md:bottom-[14%] w-8 h-8 text-[#8fb3ff]/40" />

          <div className="relative z-10 px-6 pt-28 pb-16 md:pb-14 md:pt-[max(7rem,16vh)] md:pl-[6%] md:w-[44%] lg:pl-[8%] lg:w-[42%]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f2c75c]/40 bg-[#f2c75c]/10 px-3 py-1 font-type text-[11px] tracking-[0.25em] uppercase text-[#f6d27a]">
              <KeyRound className="w-3.5 h-3.5" /> {t('mode.no_fear')}
            </span>
            <h2 className="mt-5 font-display font-bold leading-[1.05] text-[#f4ecd9] text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl text-balance">
              {t('mode.puzzle_title1')}
              <span className="block mt-2 italic text-[#f2c75c] [text-shadow:0_0_30px_rgba(242,199,92,0.35)]">
                {t('mode.puzzle_title2')}
              </span>
            </h2>
            <div aria-hidden className="mt-4 h-px w-3/4 bg-linear-to-r from-[#f2c75c]/70 to-transparent" />
            <p className="mt-5 max-w-md text-[#c4cde0] leading-relaxed text-pretty">{t('mode.puzzle_desc')}</p>
            <div className="mt-5 flex flex-wrap gap-2 max-w-md">
              {puzzleThemes.map((th) => (
                <button
                  key={th.value}
                  type="button"
                  onClick={() => pick('puzzle', th.value)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#8fb3ff]/25 bg-[#0d1a3a]/70 px-3 py-1.5 text-sm text-[#dfe6f5] hover:border-[#f2c75c]/70 hover:text-[#f6d27a] transition-colors"
                >
                  <th.icon className="w-3.5 h-3.5" /> {t(th.key)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => pick('puzzle')}
              className="mt-7 inline-flex items-center gap-2 rounded-md px-7 py-3.5 font-semibold text-[#1a1305] bg-linear-to-b from-[#f6d27a] via-[#e2b24a] to-[#b8862a] shadow-[0_10px_30px_-10px_rgba(242,199,92,0.8)] hover:shadow-[0_0_32px_rgba(242,199,92,0.6)] hover:-translate-y-0.5 transition-all"
            >
              <KeyRound className="w-4 h-4" /> {t('mode.puzzle_cta')} <ArrowRight className="w-4 h-4" />
            </button>
            {/* This side's promoted rooms only */}
            <SidePromo side="puzzle" />
          </div>
        </div>

        {/* On phones the sides stack: "or" sits on the seam */}
        <div aria-hidden className="md:hidden relative z-30 -my-7 flex justify-center">
          <span className="w-14 h-14 flex items-center justify-center rounded-full bg-[#0b0d18] border-2 border-[#f2c75c] font-display italic text-xl text-[#f6d27a] shadow-[0_0_24px_rgba(242,199,92,0.4)]">
            {t('mode.or')}
          </span>
        </div>

        {/* ── Horror: the dark ─────────────────────── */}
        <div className="group/h relative md:col-start-1 md:row-start-1 md:[clip-path:polygon(58%_0,100%_0,100%_100%,42%_100%)] overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(70% 60% at 72% 42%, #2c0a0d 0%, #140506 55%, #050202 100%)' }}
          />
          <span aria-hidden className="absolute right-[6%] md:right-[18%] top-[14%] font-blood text-4xl md:text-6xl text-[#9b000c]/25 rotate-[-8deg] select-none">
            LET ME OUT
          </span>
          <WatchingEyes
            pairs={[
              { x: 88, y: 18, size: 16, delay: 1.5, tilt: 6 },
              { x: 64, y: 84, size: 18, delay: 3 },
              { x: 92, y: 62, size: 14, delay: 4.5, tilt: -8 },
            ]}
          />

          <div className="relative z-10 px-6 pt-16 pb-24 md:pb-14 md:pt-[max(9rem,22vh)] md:ml-[58%] md:pr-[6%] lg:pr-[8%]">
            <span className="horror-label inline-flex items-center gap-2">
              <span aria-hidden className="inline-block w-6 h-px bg-brand-red-light/80" /> {t('mode.horror_kicker')}
            </span>
            <h2 className="mt-5 font-display font-black leading-[1.05] text-[#ece2d6] text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl text-balance [text-shadow:0_3px_0_#000]">
              {t('mode.horror_title1')}
              <span className="relative block mt-2 pb-3">
                <span className="text-gradient">{t('mode.horror_title2')}</span>
                <BloodDrips count={6} seed={4} maxLength={40} speed={6} band={false} className="top-[80%]! inset-x-[4%]! right-auto! w-[70%]!" />
              </span>
            </h2>
            <p className="mt-5 max-w-sm text-[#cbbdb4] leading-relaxed text-pretty">{t('mode.horror_desc')}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {horrorThemes.map((th) => (
                <button
                  key={th.value}
                  type="button"
                  onClick={() => pick('horror', th.value)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2a36]/30 bg-black/50 px-3 py-1.5 text-sm text-[#ece2d6] hover:border-[#ff2a36] hover:text-[#ff6a72] transition-colors"
                >
                  <th.icon className="w-3.5 h-3.5 text-[#ff4a52]" /> {t(th.key)}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => pick('horror')} className="btn-primary mt-7 inline-flex items-center gap-2">
              <Skull className="w-4 h-4" /> {t('mode.horror_cta')} <ArrowRight className="w-4 h-4" />
            </button>
            {/* This side's promoted rooms only */}
            <SidePromo side="horror" />
          </div>
        </div>

        {/* The cut between the two, and "or" */}
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-20">
          <line x1="58" y1="0" x2="42" y2="100" stroke="#ff2a36" strokeWidth="0.25" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 6px rgba(255,42,54,0.8))' }} />
        </svg>
        <span
          aria-hidden
          className="absolute z-30 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex w-16 h-16 items-center justify-center rounded-full bg-[#0b0d18] border-2 border-[#f2c75c] font-display italic text-2xl text-[#f6d27a] shadow-[0_0_0_6px_rgba(0,0,0,0.5),0_0_30px_rgba(242,199,92,0.45),0_0_40px_rgba(255,42,54,0.35)]"
        >
          {t('mode.or')}
        </span>
      </div>

      {/* What UNLOCKED is, and a way out for people who want everything */}
      <div className="relative z-30 border-t border-white/10 bg-black/70 backdrop-blur-md px-4 py-4 text-center">
        <h1 className="font-display text-base sm:text-lg font-semibold text-[#f4ecd9]">{t('mode.h1')}</h1>
        <p className="mt-1 text-xs sm:text-sm text-[#b9b0a8]">{t('mode.strip')}</p>
        <Link href="/discover" className="mt-2 inline-flex items-center gap-1 text-sm text-[#f6d27a] hover:underline">
          {t('mode.see_all')} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
