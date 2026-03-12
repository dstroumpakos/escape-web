'use client';

import {
  Unlock,
  Calendar,
  Code,
  LayoutDashboard,
  BarChart2,
  Camera,
  MapPin,
  QrCode,
  Globe,
  CheckCircle2,
  ArrowRight,
  Star,
  ChevronDown,
  Users,
  Zap,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
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

  const features = [
    { icon: Calendar, key: 'booking' },
    { icon: Code, key: 'widget' },
    { icon: LayoutDashboard, key: 'dashboard' },
    { icon: BarChart2, key: 'analytics' },
    { icon: Camera, key: 'photos' },
    { icon: MapPin, key: 'listing' },
    { icon: QrCode, key: 'qr' },
    { icon: Globe, key: 'website' },
  ];

  const plans = [
    {
      id: 'free',
      features: 6,
      color: 'from-slate-500 to-slate-600',
      border: 'border-slate-500/30',
    },
    {
      id: 'starter',
      features: 6,
      color: 'from-green-500 to-green-600',
      border: 'border-green-500/30',
    },
    {
      id: 'pro',
      features: 6,
      popular: true,
      color: 'from-brand-red to-red-600',
      border: 'border-brand-red/30',
    },
    {
      id: 'enterprise',
      features: 9,
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
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-brand-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20">
              <Unlock className="w-8 h-8 text-brand-red" />
            </div>
          </div>
          <span className="inline-block text-brand-red text-sm font-semibold uppercase tracking-wider mb-4 bg-brand-red/10 px-4 py-1.5 rounded-full">
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
                <div className="text-4xl font-bold text-brand-red mb-2">{stat.value}</div>
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
                  <feat.icon className="w-6 h-6 text-brand-red" />
                </div>
                <h3 className="font-semibold mb-2">{t(`fer.feat_${feat.key}_title`)}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">{t(`fer.feat_${feat.key}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`card p-6 flex flex-col relative ${plan.popular ? `border-brand-red/40 ring-1 ring-brand-red/20` : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-red to-red-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> {t('fer.most_popular')}
                  </div>
                )}
                <div className="mb-5">
                  <div className={`inline-block bg-gradient-to-r ${plan.color} text-white text-xs font-bold px-3 py-1 rounded-full mb-3`}>
                    {t(`fer.plan_${plan.id}`)}
                  </div>
                  <p className="text-sm text-brand-text-secondary mb-3">{t(`fer.plan_${plan.id}_desc`)}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{t(`fer.plan_${plan.id}_price`)}</span>
                  </div>
                  {plan.id !== 'free' && (
                    <p className="text-xs text-brand-text-muted mt-1">
                      {t(`fer.plan_${plan.id}_price_year`)}
                    </p>
                  )}
                  {plan.id === 'free' && (
                    <p className="text-xs text-brand-gold mt-1">
                      + €1.50 + VAT {t('fer.per_booking_note')}
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {Array.from({ length: plan.features }, (_, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
                      <span>{t(`fer.plan_${plan.id}_f${i + 1}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id === 'enterprise' ? '/contact' : '/company/register'}
                  className={`w-full text-center py-2.5 rounded-xl font-medium transition-colors ${
                    plan.popular
                      ? 'bg-brand-red text-white hover:bg-brand-red/90'
                      : 'bg-brand-surface border border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.id === 'enterprise' ? t('fer.contact_sales') : t('fer.select_plan')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                  <span className="text-brand-red font-bold text-lg">{step.num}</span>
                </div>
                <step.icon className="w-8 h-8 text-brand-red mx-auto mb-3" />
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
            <div className="absolute inset-0 bg-gradient-to-br from-brand-red/5 to-brand-gold/5" />
            <div className="relative z-10">
              <Shield className="w-12 h-12 text-brand-red mx-auto mb-6" />
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
                <Link href="/contact" className="hover:text-brand-red transition-colors">
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
