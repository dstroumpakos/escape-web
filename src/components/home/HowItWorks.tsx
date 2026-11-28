'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Users, KeyRound, DoorOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import { HorrorHeading } from '@/components/horror/HorrorHeading';
import { DualBackdrop, blendStyle } from './DualSides';

/** Four steps, walking from puzzle gold into horror red (both sides at once, DualSides.tsx). */
export function HowItWorks() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const steps = [
    { icon: Search, title: t('how.step1.title'), description: t('how.step1.desc'), step: 'I' },
    { icon: Users, title: t('how.step2.title'), description: t('how.step2.desc'), step: 'II' },
    { icon: KeyRound, title: t('how.step3.title'), description: t('how.step3.desc'), step: 'III' },
    { icon: DoorOpen, title: t('how.step4.title'), description: t('how.step4.desc'), step: 'IV' },
  ];

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
      <DualBackdrop />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HorrorHeading
          kicker={t('horror.no_escape')}
          title={t('how.title')}
          highlight={t('how.title_highlight')}
          subtitle={t('how.subtitle')}
        />

        <div ref={ref} className="relative">
          {/* A line of blood that runs between the steps as you scroll */}
          <div aria-hidden className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-[3px] bg-brand-border/40 rounded-full">
            <motion.div
              className="h-full origin-left rounded-full bg-linear-to-r from-[#d9a53a] via-[#f08a3c] to-[#ff2a36] shadow-[0_0_12px_rgba(242,120,60,0.7)]"
              style={{ scaleX: lineScale }}
            />
          </div>

          <StaggerContainer stagger={0.18} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map((step, i) => (
              <StaggerItem key={i} animation="fadeUp">
                <div style={blendStyle(i / (steps.length - 1))} className="relative group text-center">
                  {/* Candle-lit seal */}
                  <div className="relative mx-auto mb-6 w-[104px] h-[104px]">
                    <div
                      className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(var(--candle),0.35),transparent_65%)] blur-md animate-flicker"
                      style={{ animationDelay: `${i * 0.9}s` }}
                    />
                    <div className="absolute inset-[14px] rounded-full border border-brand-red/50 bg-black flex items-center justify-center shadow-[inset_0_0_20px_rgba(var(--glow),0.4),0_0_24px_rgba(var(--glow),0.35)] group-hover:animate-shake">
                      <step.icon className="w-8 h-8 text-brand-red-light" />
                    </div>
                    {/* Rotating ritual ring */}
                    <svg aria-hidden viewBox="0 0 104 104" className="absolute inset-0 w-full h-full animate-spin-slow [animation-duration:24s]">
                      <circle cx="52" cy="52" r="49" fill="none" className="stroke-brand-red" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 7" />
                    </svg>
                  </div>

                  <div className="horror-label mb-2">
                    {t('horror.ritual')} {step.step}
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 text-brand-bone group-hover:text-brand-red-light transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-brand-text-secondary leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
