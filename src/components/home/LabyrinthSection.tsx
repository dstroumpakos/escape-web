'use client';

import { useTranslation } from '@/lib/i18n';
import { AnimateIn } from '@/components/animations/AnimateIn';
import { MinotaurMark } from '@/components/horror/AriadneThread';
import { DualBackdrop, blendStyle } from './DualSides';

/**
 * Three steps tied together by Ariadne's thread, shown after the featured rooms.
 * Both sides at once like the rest of the home (DualSides.tsx): the rings and
 * the thread run from puzzle gold on the left into horror red on the right.
 */
export function LabyrinthSection() {
  const { t } = useTranslation();
  const steps = [
    { n: 1, title: t('ariadne.step1.title'), text: t('ariadne.step1.text') },
    { n: 2, title: t('ariadne.step2.title'), text: t('ariadne.step2.text') },
    { n: 3, title: t('ariadne.step3.title'), text: t('ariadne.step3.text') },
  ];

  return (
    <section className="relative overflow-hidden py-24">
      <DualBackdrop />
      {/* Turning labyrinth rings behind the content */}
      <div aria-hidden className="horror-motion horror-still absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" fill="none">
          <defs>
            <linearGradient id="lab-rings" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
              <stop offset="0.2" stopColor="#f2c75c" />
              <stop offset="0.8" stopColor="#c8101b" />
            </linearGradient>
          </defs>
          <g className="ariadne-spin" style={{ stroke: 'url(#lab-rings)', strokeOpacity: 0.22 }} strokeWidth="1.5">
            <circle cx="500" cy="300" r="140" strokeDasharray="480 120" />
            <circle cx="500" cy="300" r="220" strokeDasharray="760 180" />
            <circle cx="500" cy="300" r="300" strokeDasharray="1000 240" />
          </g>
          <g className="ariadne-spin-rev" style={{ stroke: 'url(#lab-rings)', strokeOpacity: 0.14 }} strokeWidth="1.5">
            <circle cx="500" cy="300" r="380" strokeDasharray="1400 300" />
            <circle cx="500" cy="300" r="460" strokeDasharray="1800 320" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateIn animation="fadeUp">
          <div className="text-center mb-14 flex flex-col items-center gap-4">
            <MinotaurMark />
            <span className="font-type text-[12px] tracking-[0.35em] text-brand-red-light">{t('ariadne.eyebrow')}</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-brand-bone text-balance">{t('ariadne.title')}</h2>
            <p className="text-brand-text-secondary max-w-xl text-pretty">{t('ariadne.subtitle')}</p>
          </div>
        </AnimateIn>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* The thread running through the cards (desktop) */}
          <svg
            aria-hidden
            viewBox="0 0 900 40"
            preserveAspectRatio="none"
            className="horror-motion horror-still hidden md:block absolute left-[8%] right-[8%] top-9 h-10 w-[84%] pointer-events-none"
            fill="none"
          >
            <defs>
              <linearGradient id="lab-thread" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#f2c75c" />
                <stop offset="1" stopColor="#ff2a36" />
              </linearGradient>
            </defs>
            <path
              className="ariadne-thread"
              stroke="url(#lab-thread)"
              d="M0 20 C 120 -6, 200 46, 300 20 S 480 -6, 600 20 S 780 46, 900 20"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 5px rgba(242,120,60,0.7))' }}
            />
          </svg>

          {steps.map((s, i) => (
            <AnimateIn key={s.n} animation="fadeUp" delay={i * 0.12}>
              {/* Gold on the puzzle side, red on the horror side, the middle in between */}
              <div style={blendStyle(i / 2)} className="relative h-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand-red hover:shadow-[0_14px_44px_rgba(var(--glow),0.28)]">
                <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-brand-red bg-brand-bg font-display text-xl font-bold text-brand-red-light">
                  {s.n}
                </div>
                <h3 className="font-display text-xl font-bold text-brand-bone mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed text-brand-text-secondary">{s.text}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
