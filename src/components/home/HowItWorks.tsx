'use client';

import { Search, CalendarCheck, KeyRound, PartyPopper } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Search,
      title: t('how.step1.title'),
      description: t('how.step1.desc'),
      step: '01',
    },
    {
      icon: CalendarCheck,
      title: t('how.step2.title'),
      description: t('how.step2.desc'),
      step: '02',
    },
    {
      icon: KeyRound,
      title: t('how.step3.title'),
      description: t('how.step3.desc'),
      step: '03',
    },
    {
      icon: PartyPopper,
      title: t('how.step4.title'),
      description: t('how.step4.desc'),
      step: '04',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateIn animation="fadeUp" className="text-center mb-14">
          <h2 className="section-heading mb-4">
            {t('how.title')} <span className="text-gradient">{t('how.title_highlight')}</span>
          </h2>
          <p className="section-subheading mx-auto">
            {t('how.subtitle')}
          </p>
        </AnimateIn>

        <StaggerContainer stagger={0.15} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <StaggerItem key={i} animation="fadeUp">
              <div className="relative group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+48px)] w-[calc(100%-48px)] h-px bg-gradient-to-r from-brand-border to-transparent" />
                )}

                <div className="text-center">
                  {/* Step number */}
                  <span className="text-6xl font-display font-bold text-brand-surface/50 group-hover:text-brand-red/20 transition-colors duration-500">
                    {step.step}
                  </span>

                  {/* Icon */}
                  <div className="relative -mt-6 mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 group-hover:bg-brand-red/20 group-hover:border-brand-red/40 group-hover:scale-110 transition-all duration-300">
                    <step.icon className="w-7 h-7 text-brand-red" />
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-brand-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
