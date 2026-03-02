'use client';

import {
  Globe,
  Palette,
  Smartphone,
  Search,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  FileText,
  Image,
  MessageSquare,
  Layers,
  BarChart2,
  Headphones,
  CalendarDays,
  CreditCard,
  Star,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brand-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-brand-surface/30 transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-brand-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-brand-text-secondary leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function WebsiteServicePage() {
  const { t } = useTranslation();

  const included = [
    { icon: Palette, key: 'design' },
    { icon: Smartphone, key: 'responsive' },
    { icon: Search, key: 'seo' },
    { icon: Zap, key: 'speed' },
    { icon: Shield, key: 'ssl' },
    { icon: CalendarDays, key: 'booking' },
    { icon: Globe, key: 'domain' },
    { icon: Headphones, key: 'support' },
  ];

  const process = [
    { step: 1, icon: MessageSquare, key: 'consultation' },
    { step: 2, icon: Palette, key: 'design_phase' },
    { step: 3, icon: Layers, key: 'development' },
    { step: 4, icon: BarChart2, key: 'review' },
    { step: 5, icon: Zap, key: 'launch' },
  ];

  const requirements = [
    { icon: FileText, key: 'brand_info' },
    { icon: Image, key: 'photos' },
    { icon: MessageSquare, key: 'content' },
    { icon: Globe, key: 'domain_req' },
    { icon: CreditCard, key: 'payment' },
  ];

  const faqs = Array.from({ length: 7 }, (_, i) => ({
    q: t(`ws.faq${i + 1}_q`),
    a: t(`ws.faq${i + 1}_a`),
  }));

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20">
              <Globe className="w-8 h-8 text-brand-red" />
            </div>
          </div>
          <span className="block text-brand-red text-sm font-semibold uppercase tracking-wider mb-4">
            {t('ws.label')}
          </span>
          <h1 className="section-heading mb-6">
            {t('ws.hero_title')} <span className="text-gradient">{t('ws.hero_highlight')}</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            {t('ws.hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
              {t('ws.hero_cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#pricing" className="btn-outline inline-flex items-center gap-2">
              {t('ws.hero_cta_pricing')}
            </a>
          </div>
        </div>
      </section>

      {/* Why You Need a Website */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('ws.why_title')} <span className="text-gradient">{t('ws.why_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('ws.why_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 text-center">
                <div className="text-3xl font-bold text-brand-red mb-2">{t(`ws.why_stat${i}_value`)}</div>
                <div className="text-sm text-brand-text-secondary">{t(`ws.why_stat${i}_label`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('ws.included_title')} <span className="text-gradient">{t('ws.included_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('ws.included_subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {included.map((item) => (
              <div key={item.key} className="card p-6 group hover:border-brand-red/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center mb-4 group-hover:bg-brand-red/20 transition-colors">
                  <item.icon className="w-6 h-6 text-brand-red" />
                </div>
                <h3 className="font-semibold mb-2">{t(`ws.inc_${item.key}_title`)}</h3>
                <p className="text-sm text-brand-text-secondary">{t(`ws.inc_${item.key}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-brand-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('ws.pricing_title')} <span className="text-gradient">{t('ws.pricing_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('ws.pricing_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="card p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{t('ws.plan1_name')}</h3>
                <p className="text-sm text-brand-text-secondary mb-4">{t('ws.plan1_desc')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{t('ws.plan1_price')}</span>
                </div>
                <p className="text-xs text-brand-text-muted mt-1">{t('ws.plan1_price_note')}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
                    <span>{t(`ws.plan1_feat${i}`)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="btn-outline w-full text-center">
                {t('ws.plan_cta')}
              </Link>
            </div>

            {/* Professional - Recommended */}
            <div className="card p-8 flex flex-col border-brand-red/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> {t('ws.recommended')}
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{t('ws.plan2_name')}</h3>
                <p className="text-sm text-brand-text-secondary mb-4">{t('ws.plan2_desc')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-brand-red">{t('ws.plan2_price')}</span>
                </div>
                <p className="text-xs text-brand-text-muted mt-1">{t('ws.plan2_price_note')}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
                    <span>{t(`ws.plan2_feat${i}`)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="btn-primary w-full text-center">
                {t('ws.plan_cta')}
              </Link>
            </div>

            {/* Premium */}
            <div className="card p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{t('ws.plan3_name')}</h3>
                <p className="text-sm text-brand-text-secondary mb-4">{t('ws.plan3_desc')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{t('ws.plan3_price')}</span>
                </div>
                <p className="text-xs text-brand-text-muted mt-1">{t('ws.plan3_price_note')}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
                    <span>{t(`ws.plan3_feat${i}`)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="btn-outline w-full text-center">
                {t('ws.plan_cta')}
              </Link>
            </div>
          </div>

          {/* Maintenance note */}
          <div className="mt-8 card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-brand-gold" />
              <h4 className="font-semibold">{t('ws.maintenance_title')}</h4>
            </div>
            <p className="text-sm text-brand-text-secondary max-w-2xl mx-auto">{t('ws.maintenance_desc')}</p>
          </div>
        </div>
      </section>

      {/* Our Process / Timeline */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('ws.process_title')} <span className="text-gradient">{t('ws.process_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('ws.process_subtitle')}
            </p>
          </div>

          <div className="space-y-0">
            {process.map((p, idx) => (
              <div key={p.key} className="relative flex gap-6 pb-10 last:pb-0">
                {/* Vertical line */}
                {idx < process.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-brand-border/50" />
                )}
                {/* Step circle */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-brand-red/10 border-2 border-brand-red/30 flex items-center justify-center z-10">
                  <span className="text-sm font-bold text-brand-red">{p.step}</span>
                </div>
                {/* Content */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p.icon className="w-4 h-4 text-brand-red" />
                    <h3 className="font-semibold">{t(`ws.step_${p.key}_title`)}</h3>
                  </div>
                  <p className="text-sm text-brand-text-secondary leading-relaxed">
                    {t(`ws.step_${p.key}_desc`)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-brand-text-muted mt-2">
                    <Clock className="w-3 h-3" /> {t(`ws.step_${p.key}_time`)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-brand-red" />
              <h4 className="font-semibold">{t('ws.total_time_title')}</h4>
            </div>
            <p className="text-sm text-brand-text-secondary">{t('ws.total_time_desc')}</p>
          </div>
        </div>
      </section>

      {/* What We Need From You */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('ws.need_title')} <span className="text-gradient">{t('ws.need_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('ws.need_subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requirements.map((req) => (
              <div key={req.key} className="card p-6">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center mb-4">
                  <req.icon className="w-5 h-5 text-brand-red" />
                </div>
                <h3 className="font-semibold mb-2">{t(`ws.need_${req.key}_title`)}</h3>
                <p className="text-sm text-brand-text-secondary">{t(`ws.need_${req.key}_desc`)}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-brand-text-muted italic">{t('ws.need_note')}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('ws.faq_title')} <span className="text-gradient">{t('ws.faq_highlight')}</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="section-heading mb-4">
            {t('ws.cta_title')} <span className="text-gradient">{t('ws.cta_highlight')}</span>
          </h2>
          <p className="text-brand-text-secondary mb-8 max-w-xl mx-auto">
            {t('ws.cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
              {t('ws.cta_button')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
