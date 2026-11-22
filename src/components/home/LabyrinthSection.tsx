'use client';

import { useTranslation } from '@/lib/i18n';
import { AnimateIn } from '@/components/animations/AnimateIn';
import { MinotaurMark } from '@/components/horror/AriadneThread';

/** Three steps tied together by Ariadne's thread, shown after the featured rooms. */
export function LabyrinthSection() {
  const { t } = useTranslation();
  const steps = [
    { n: 1, title: t('ariadne.step1.title'), text: t('ariadne.step1.text') },
    { n: 2, title: t('ariadne.step2.title'), text: t('ariadne.step2.text') },
    { n: 3, title: t('ariadne.step3.title'), text: t('ariadne.step3.text') },
  ];

  return (
    <section className="relative overflow-hidden bg-brand-bg py-24">
      {/* Turning labyrinth rings behind the content */}
      <div aria-hidden className="horror-motion absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" fill="none">
          <g className="ariadne-spin" style={{ stroke: 'rgba(var(--glow),0.16)' }} strokeWidth="1.5">
            <circle cx="500" cy="300" r="140" strokeDasharray="480 120" />
            <circle cx="500" cy="300" r="220" strokeDasharray="760 180" />
            <circle cx="500" cy="300" r="300" strokeDasharray="1000 240" />
          </g>
          <g className="ariadne-spin-rev" style={{ stroke: 'rgba(var(--glow),0.1)' }} strokeWidth="1.5">
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
            className="horror-motion hidden md:block absolute left-[8%] right-[8%] top-9 h-10 w-[84%] pointer-events-none"
            fill="none"
          >
            <path
              className="ariadne-thread stroke-brand-red-light"
              d="M0 20 C 120 -6, 200 46, 300 20 S 480 -6, 600 20 S 780 46, 900 20"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 5px rgba(var(--glow),0.8))' }}
            />
          </svg>

          {steps.map((s, i) => (
            <AnimateIn key={s.n} animation="fadeUp" delay={i * 0.12}>
              <div className="relative h-full rounded-xl border border-brand-border bg-brand-card p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand-red hover:shadow-[0_14px_44px_rgba(var(--glow),0.28)]">
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
