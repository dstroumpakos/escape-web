'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Hourglass } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn } from '@/components/animations/AnimateIn';
import { BloodDrips } from '@/components/horror/BloodDrips';

export function DownloadCTA() {
  const { t } = useTranslation();
  return (
    <section id="download" className="relative py-28 md:py-40 overflow-hidden bg-black">
      <BloodDrips count={22} seed={11} maxLength={90} speed={6} />
      {/* Pulse of red light behind everything */}
      <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-brand-red/20 blur-[140px] animate-pulse-soft" />

      {/* Heart monitor running across the section */}
      <svg aria-hidden viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-32 opacity-40" fill="none">
        <motion.path
          d="M0 60 H300 L320 60 L335 20 L352 104 L368 38 L380 60 H560 L580 60 L592 30 L610 96 L622 60 H900 L918 60 L930 14 L948 108 L962 60 H1200"
          className="stroke-brand-red-light"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 3, ease: 'linear', repeat: Infinity, repeatDelay: 0.6 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(var(--glow-hi),0.9))' }}
        />
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimateIn animation="scaleIn">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black border border-brand-red/50 mb-6 shadow-[0_0_40px_rgba(var(--glow),0.55)] animate-heartbeat">
            <Hourglass className="w-9 h-9 text-brand-red-light animate-[spin_6s_steps(2)_infinite]" />
          </div>
          <div className="horror-label mb-6">{t('horror.clock')}</div>
        </AnimateIn>

        <AnimateIn animation="fadeUp" delay={0.2}>
          <h2 className="section-heading mb-6 text-4xl! md:text-6xl! lg:text-7xl!">
            {t('download.title')}{' '}
            <span className="font-blood text-brand-red-light text-blood-glow animate-flicker text-[0.8em]">{t('download.title_highlight')}</span>{' '}
            {t('download.title_end')}
          </h2>
          <p className="section-subheading mx-auto mb-12">{t('download.subtitle')}</p>
        </AnimateIn>

        <AnimateIn animation="fadeUp" delay={0.4}>
          <div className="flex justify-center mb-8">
            <Link href="/signup" className="btn-primary flex items-center gap-2 text-lg py-4! px-10! animate-heartbeat">
              {t('download.cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex justify-center gap-3">
            <button className="flex items-center gap-2 bg-black border border-brand-border rounded-md px-5 py-3 opacity-60 cursor-default">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-brand-text-muted leading-none">{t('download.appstore_label')}</div>
                <div className="text-sm font-semibold leading-tight">{t('download.appstore')}</div>
              </div>
            </button>
            <button className="flex items-center gap-2 bg-black border border-brand-border rounded-md px-5 py-3 opacity-60 cursor-default">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-brand-text-muted leading-none">{t('download.playstore_label')}</div>
                <div className="text-sm font-semibold leading-tight">{t('download.playstore')}</div>
              </div>
            </button>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
