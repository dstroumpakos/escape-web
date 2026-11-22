'use client';

import {
  Calendar,
  Code,
  LayoutDashboard,
  BarChart2,
  Camera,
  MapPin,
  Globe,
  CheckCircle2,
  ArrowRight,
  Star,
  ChevronDown,
  Users,
  Zap,
  Shield,
  CreditCard,
  ExternalLink,
  Stamp,
  ShoppingBag,
} from 'lucide-react';
import { BOOKING_ENABLED } from '@/lib/features';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { PLANS as PLAN_INFO, PAYG_FEE, UNLIMITED_PRICE } from '@/lib/plans';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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

export default function ForEscapeRoomsPage() {
  const { t } = useTranslation();
  const platformStats = useQuery(api.stats.getPlatformStats);

  // With UNLOCKED's own booking off (src/lib/features.ts) the platform is a
  // showcase + community: no booking widget, no room payments, no prices here.
  const features = BOOKING_ENABLED
    ? [
        { icon: Calendar, key: 'booking' },
        { icon: Code, key: 'widget' },
        { icon: LayoutDashboard, key: 'dashboard' },
        { icon: BarChart2, key: 'analytics' },
        { icon: Camera, key: 'photos' },
        { icon: MapPin, key: 'listing' },
        { icon: CreditCard, key: 'payments' },
        { icon: Globe, key: 'website' },
      ]
    : [
        { icon: MapPin, key: 'listing' },
        { icon: ExternalLink, key: 'booknow' },
        { icon: Stamp, key: 'passport' },
        { icon: Users, key: 'community' },
        { icon: BarChart2, key: 'analytics' },
        { icon: Camera, key: 'photos' },
        { icon: ShoppingBag, key: 'merch' },
        { icon: Globe, key: 'website' },
      ];

  const plans = [
    {
      id: 'payg' as const,
      popular: false,
      color: 'from-emerald-500 to-emerald-600',
      border: 'border-emerald-500/30',
    },
    {
      id: 'unlimited' as const,
      popular: true,
      color: 'from-purple-500 to-purple-600',
      border: 'border-purple-500/30',
    },
  ];

  const steps = [
    { num: 1, icon: Users },
    { num: 2, icon: LayoutDashboard },
    { num: 3, icon: Code },
    { num: 4, icon: Zap },
  ];

  const faqs = Array.from({ length: 8 }, (_, i) => ({
    q: t(`fer.faq${i + 1}_q`),
    a: t(`fer.faq${i + 1}_a`),
  }));

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-brand-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20">
              <EyeKeyhole variant="onDark" className="w-10 h-10 text-brand-red-light" />
            </div>
          </div>
          <span className="inline-block text-brand-red-light text-sm font-semibold uppercase tracking-wider mb-4 bg-brand-red/10 px-4 py-1.5 rounded-full">
            {t('fer.hero_badge')}
          </span>
          <h1 className="section-heading mb-6">
            {t('fer.hero_title')} <span className="text-gradient">{t('fer.hero_highlight')}</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            {t('fer.hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/company/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3.5">
              {t('fer.hero_cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/company/login" className="btn-outline inline-flex items-center gap-2 px-8 py-3.5">
              {t('fer.hero_cta_login')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-brand-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-heading mb-3">
              {t('fer.stats_title')} <span className="text-gradient">{t('fer.stats_highlight')}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { value: platformStats ? `${platformStats.totalRooms}+` : '—', label: t('fer.stat1_label') },
              { value: platformStats ? `${platformStats.completedEscapes.toLocaleString()}+` : '—', label: t('fer.stat2_label') },
              { value: platformStats ? `${platformStats.averageRating.toFixed(1)}/5` : '—', label: t('fer.stat3_label') },
            ].map((stat, i) => (
              <div key={i} className="card p-8 text-center">
                <div className="text-4xl font-bold text-brand-red-light mb-2">{stat.value}</div>
                <div className="text-sm text-brand-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('fer.features_title')} <span className="text-gradient">{t('fer.features_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('fer.features_subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => (
              <div key={feat.key} className="card p-6 group hover:border-brand-red/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center mb-4 group-hover:bg-brand-red/20 transition-colors">
                  <feat.icon className="w-6 h-6 text-brand-red-light" />
                </div>
                <h3 className="font-semibold mb-2">{t(`fer.feat_${feat.key}_title`)}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">{t(`fer.feat_${feat.key}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing: per-booking plans, so only while UNLOCKED's own booking is on */}
      {BOOKING_ENABLED && (
      <section id="pricing" className="py-20 border-t border-brand-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('fer.pricing_title')} <span className="text-gradient">{t('fer.pricing_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('fer.pricing_subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`card p-6 flex flex-col relative ${plan.popular ? `border-brand-red/40 ring-1 ring-brand-red/20` : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-brand-red to-brand-red-hover text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> {t('fer.most_popular')}
                  </div>
                )}
                <div className="mb-5">
                  <div className={`inline-block bg-linear-to-r ${plan.color} text-white text-xs font-bold px-3 py-1 rounded-full mb-3`}>
                    {t(`company.plan.${plan.id}`)}
                  </div>
                  <p className="text-sm text-brand-text-secondary mb-3">{t(PLAN_INFO[plan.id].descKey)}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {plan.id === 'payg' ? `€${PAYG_FEE}` : `€${UNLIMITED_PRICE.monthly}/${t('billing.month')}`}
                    </span>
                  </div>
                  {plan.id === 'unlimited' ? (
                    <p className="text-xs text-brand-text-muted mt-1">
                      {`€${UNLIMITED_PRICE.yearly}/${t('billing.year')}`} · {t('plans.yearly_save')}
                    </p>
                  ) : (
                    <p className="text-xs text-brand-gold mt-1">{t('fer.per_booking_cap')}</p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {PLAN_INFO[plan.id].features.map((k) => (
                    <li key={k} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-brand-red-light mt-0.5 shrink-0" />
                      <span>{t(k)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/company/register"
                  className={`w-full text-center py-2.5 rounded-xl font-medium transition-colors ${
                    plan.popular
                      ? 'bg-brand-red text-white hover:bg-brand-red/90'
                      : 'bg-brand-surface border border-white/10 hover:border-white/20'
                  }`}
                >
                  {t('fer.select_plan')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* How It Works */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('fer.how_title')} <span className="text-gradient">{t('fer.how_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('fer.how_subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="card p-6 text-center relative">
                <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-brand-red-light font-bold text-lg">{step.num}</span>
                </div>
                <step.icon className="w-8 h-8 text-brand-red-light mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{t(`fer.how_step${step.num}_title`)}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">{t(`fer.how_step${step.num}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-brand-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('fer.faq_title')} <span className="text-gradient">{t('fer.faq_highlight')}</span>
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
          <div className="card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-brand-red/5 to-brand-gold/5" />
            <div className="relative z-10">
              <Shield className="w-12 h-12 text-brand-red-light mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {t('fer.cta_title')} <span className="text-gradient">{t('fer.cta_highlight')}</span>
              </h2>
              <p className="text-brand-text-secondary mb-8 max-w-lg mx-auto">
                {t('fer.cta_subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/company/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3.5">
                  {t('fer.cta_button')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <p className="text-sm text-brand-text-muted mt-4">
                <Link href="/contact" className="hover:text-brand-red-light transition-colors">
                  {t('fer.cta_contact')} →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
