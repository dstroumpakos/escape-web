'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { BloodDrips } from '@/components/horror/BloodDrips';
import { WatchingEyes } from '@/components/horror/WatchingEyes';
import { AriadneThread, MinotaurMark } from '@/components/horror/AriadneThread';
import { setMode } from '@/lib/mode';
import { HeroPromo, usePromoRooms } from './HeroPromo';

/** Things written on the walls. Only the flashlight shows them. */
const scrawls = [
  { text: 'LET ME OUT', x: 6, y: 18, r: -8, s: 'text-3xl md:text-5xl' },
  { text: 'ΒΟΗΘΕΙΑ', x: 70, y: 12, r: 6, s: 'text-2xl md:text-4xl' },
  { text: "IT'S BEHIND YOU", x: 58, y: 74, r: -4, s: 'text-xl md:text-3xl' },
  { text: '13', x: 18, y: 62, r: 10, s: 'text-5xl md:text-7xl' },
  { text: 'DON’T TURN AROUND', x: 4, y: 84, r: 3, s: 'text-lg md:text-2xl' },
  { text: 'ΜΗΝ ΚΟΙΤΑΣ ΠΙΣΩ', x: 74, y: 44, r: -10, s: 'text-lg md:text-2xl' },
];

function Tally({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className="absolute w-24 md:w-36 opacity-70"
      style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)` }}
      stroke="#b0000e"
      strokeWidth="4"
      strokeLinecap="round"
    >
      {[0, 1].map((g) => (
        <g key={g} transform={`translate(${g * 58} 0)`}>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={8 + i * 10} y1={8} x2={6 + i * 10} y2={52} />
          ))}
          <line x1="0" y1="44" x2="48" y2="14" />
        </g>
      ))}
    </svg>
  );
}

function Handprint({ x, y, r, flip = false }: { x: number; y: number; r: number; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 130"
      className="absolute w-16 md:w-24 opacity-60"
      style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg) scaleX(${flip ? -1 : 1})`, filter: 'url(#horror-goo)' }}
      fill="#8f0610"
    >
      <ellipse cx="50" cy="88" rx="30" ry="32" />
      <rect x="18" y="20" width="12" height="58" rx="6" transform="rotate(-12 24 50)" />
      <rect x="34" y="6" width="12" height="66" rx="6" transform="rotate(-4 40 40)" />
      <rect x="51" y="4" width="12" height="68" rx="6" transform="rotate(4 57 40)" />
      <rect x="67" y="14" width="11" height="60" rx="6" transform="rotate(12 72 44)" />
      <rect x="74" y="64" width="11" height="40" rx="6" transform="rotate(48 80 84)" />
      <circle cx="30" cy="124" r="3" />
      <circle cx="58" cy="128" r="2" />
    </svg>
  );
}

export function HeroSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  // The door opens as you scroll down into the page
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const doorAngle = useTransform(scrollYProgress, [0, 0.6], [-16, -78]);
  const lightOpacity = useTransform(scrollYProgress, [0, 0.6], [0.55, 1]);
  const spillScale = useTransform(scrollYProgress, [0, 0.6], [0.6, 1.4]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const router = useRouter();
  const [query, setQuery] = useState('');
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/discover?q=${encodeURIComponent(q)}` : '/discover');
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--fx', `${e.clientX - r.left}px`);
    el.style.setProperty('--fy', `${e.clientY - r.top}px`);
  };

  const title1 = t('hero.title1');
  // Paid rooms sit at the bottom of the first screen; the scroll cue makes way
  const hasPromo = usePromoRooms().length > 0;

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      className="flashlight-wander relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-black"
    >
      {/* ── The wall ───────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 40%, #1d1010 0%, #0d0707 55%, #050202 100%),' +
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 2px, transparent 2px 140px)',
        }}
      />
      {/* Cracks */}
      <svg aria-hidden className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M0 22 L8 25 L11 21 L19 27 L24 24" stroke="#000" strokeWidth="0.25" fill="none" />
        <path d="M100 66 L92 63 L89 68 L81 64 L77 70 L70 69" stroke="#000" strokeWidth="0.25" fill="none" />
        <path d="M38 0 L36 6 L40 10 L37 16" stroke="#000" strokeWidth="0.2" fill="none" />
      </svg>

      {/* Writing on the wall (revealed by the flashlight) */}
      <div aria-hidden className="absolute inset-0 select-none">
        {scrawls.map((s, i) => (
          <span
            key={i}
            className={`absolute font-blood ${s.s} text-[#9b000c] whitespace-nowrap`}
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.r}deg)`, opacity: 0.75 }}
          >
            {s.text}
          </span>
        ))}
        <Tally x={30} y={6} r={-6} />
        <Tally x={82} y={86} r={8} />
        <Handprint x={46} y={58} r={-18} />
        <Handprint x={88} y={24} r={14} flip />
        <Handprint x={2} y={38} r={22} />
      </div>

      {/* ── Darkness, with a hole where the flashlight points ── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle 300px at var(--fx) var(--fy), rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 45%, rgba(2,0,0,0.97) 100%)',
        }}
      />
      <div
        aria-hidden
        className="fx-android-off absolute inset-0 pointer-events-none mix-blend-screen"
        style={{ background: 'radial-gradient(circle 240px at var(--fx) var(--fy), rgba(255,210,170,0.09), transparent 70%)' }}
      />

      {/* ── The door ───────────────────────────────── */}
      <div aria-hidden className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ perspective: 1200 }}>
        <div className="relative w-[min(56vw,340px)] h-[min(72svh,620px)]">
          {/* What's on the other side */}
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: lightOpacity,
              background: 'linear-gradient(180deg, #ff3b2a 0%, #d10a14 35%, #6d0009 75%, #2a0003 100%)',
              boxShadow: '0 0 80px 20px rgba(200,16,27,0.55), 0 0 200px 60px rgba(200,16,27,0.25)',
              animation: 'light-leak 6s linear infinite',
            }}
          />
          {/* Frame */}
          <div className="absolute -inset-x-4 -top-4 bottom-0 border-x-[16px] border-t-[16px] border-[#0b0606] shadow-[inset_0_0_30px_rgba(0,0,0,0.9)]" />
          {/* Leaf */}
          <motion.div
            className="absolute inset-0 origin-left"
            style={{
              rotateY: doorAngle,
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(90deg, #120909 0%, #1a0d0d 60%, #0e0707 100%)',
              boxShadow: 'inset -8px 0 18px rgba(0,0,0,0.9), 6px 0 30px rgba(0,0,0,0.8)',
            }}
          >
            <div className="absolute inset-[10%_12%_55%_12%] border border-black/70 shadow-[inset_0_0_14px_rgba(0,0,0,0.9)]" />
            <div className="absolute inset-[52%_12%_10%_12%] border border-black/70 shadow-[inset_0_0_14px_rgba(0,0,0,0.9)]" />
            <div className="absolute right-[8%] top-1/2 w-3 h-3 rounded-full bg-[#3a2a1a] shadow-[0_0_6px_rgba(255,120,60,0.4)]" />
            {/* Claw marks on the inside */}
            <svg viewBox="0 0 60 80" className="absolute left-[30%] top-[22%] w-[40%] opacity-60" stroke="#5c0008" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 4 L16 70" />
              <path d="M22 2 L28 74" />
              <path d="M36 6 L40 72" />
              <path d="M50 10 L50 66" />
            </svg>
          </motion.div>
        </div>
        {/* Light spilling over the floor */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[min(90vw,700px)] h-28 origin-bottom blur-2xl"
          style={{
            scaleY: spillScale,
            opacity: lightOpacity,
            background: 'radial-gradient(50% 100% at 50% 100%, rgba(220,20,30,0.55), transparent 70%)',
          }}
        />
      </div>

      {/* ── Eyes in the dark ───────────────────────── */}
      <WatchingEyes
        pairs={[
          { x: 9, y: 26, size: 22, delay: 2.2, tilt: -6 },
          { x: 84, y: 20, size: 18, delay: 3.4, tilt: 8 },
          { x: 12, y: 74, size: 26, delay: 4.6 },
          { x: 88, y: 66, size: 20, delay: 5.5, tilt: -10 },
          { x: 64, y: 88, size: 14, delay: 6.8 },
          { x: 30, y: 90, size: 12, delay: 8 },
        ]}
      />

      {/* Fog rolling along the floor */}
      <div aria-hidden className="fx-android-off fx-lite-still horror-motion horror-still absolute inset-x-0 bottom-0 h-48 pointer-events-none overflow-hidden">
        <div
          className="absolute -inset-x-1/4 inset-y-0 blur-2xl opacity-70"
          style={{
            background:
              'radial-gradient(30% 70% at 25% 100%, rgba(150,130,130,0.35), transparent 70%), radial-gradient(35% 80% at 70% 100%, rgba(140,120,120,0.3), transparent 70%)',
            animation: 'fog-drift 22s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Ariadne's thread winding down to the door */}
      <AriadneThread />

      {/* ── Content ────────────────────────────────── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center ${hasPromo ? 'pt-20 pb-8' : 'pt-28 pb-24'}`}
      >
        <MinotaurMark className={`mx-auto animate-fade-up ${hasPromo ? 'mb-3 scale-90' : 'mb-5'}`} />

        {/* Heading */}
        <h1 className={`font-display font-black tracking-tight leading-[1.05] text-balance text-4xl sm:text-5xl md:text-6xl ${hasPromo ? 'mb-4 xl:text-[4rem]' : 'mb-7 xl:text-7xl'}`}>
          <span
            className="glitch text-brand-bone animate-fade-up animate-delay-100 [text-shadow:0_3px_0_#000,0_0_40px_rgba(0,0,0,0.9)]"
            data-text={title1}
          >
            {title1}
          </span>
          <br />
          <span className="relative inline-block animate-fade-up animate-delay-300 pb-2">
            <span className="text-gradient horror-rough">{t('hero.title2')}</span>
            <BloodDrips count={9} seed={2} maxLength={70} speed={5} band={false} className="top-[84%]! inset-x-[6%]!" />
          </span>
        </h1>

        {/* Subheading */}
        <p className={`text-lg md:text-xl text-brand-text-secondary max-w-xl mx-auto ${hasPromo ? 'mb-6' : 'mb-10'} text-pretty animate-fade-up animate-delay-500 [text-shadow:0_2px_8px_#000]`}>
          {t('hero.subtitle')}
        </p>

        {/* Search Bar */}
        <form onSubmit={onSearch} role="search" className="max-w-xl mx-auto animate-fade-up animate-delay-600">
          <div className="relative group">
            <div className="absolute -inset-px rounded-md bg-linear-to-r from-brand-blood via-brand-red-light to-brand-blood opacity-50 blur-[2px] group-hover:opacity-90 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-black/90 border border-brand-red/40 rounded-md overflow-hidden">
              <Search className="w-5 h-5 text-brand-red-light ml-5 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('hero.search_placeholder')}
                aria-label={t('hero.search')}
                className="w-full min-w-0 bg-transparent px-4 py-4 text-brand-bone placeholder-brand-text-secondary/80 focus:outline-hidden [&::-webkit-search-cancel-button]:hidden"
              />
              <button type="submit" className="btn-primary rounded-none! shrink-0 py-4! px-6!">
                {t('hero.search')}
              </button>
            </div>
          </div>
        </form>

        <button
          type="button"
          onClick={() => { setMode('puzzle'); window.scrollTo({ top: 0 }); }}
          className={`${hasPromo ? 'mt-3' : 'mt-6'} text-sm text-brand-text-secondary hover:text-[#f2c75c] underline-offset-4 hover:underline transition-colors animate-fade-up animate-delay-700`}
        >
          {t('mode.switch_to_puzzle')}
        </button>

        <HeroPromo />

      </motion.div>

      {/* Scroll cue */}
      {!hasPromo && (
      <a
        href="#rooms"
        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 hidden [@media(min-height:760px)]:flex flex-col items-center gap-2 text-brand-text-muted hover:text-brand-red-light transition-colors"
      >
        <span className="font-type text-[11px] tracking-[0.35em] uppercase">{t('horror.descend')}</span>
        <span className="relative block w-px h-12 bg-linear-to-b from-brand-red to-transparent overflow-visible">
          <span
            className="horror-motion absolute -left-[3px] top-0 w-[7px] h-[10px] rounded-full bg-brand-red shadow-[0_0_8px_rgba(255,40,50,0.9)]"
            style={{ animation: 'drop-fall 2.4s cubic-bezier(.55,0,1,.45) infinite' }}
          />
        </span>
      </a>
      )}
    </section>
  );
}
