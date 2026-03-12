'use client';

import Link from 'next/link';
import {
  MapPin, Star, Clock, Users, DoorOpen, ArrowRight, ChevronRight,
  Puzzle, Lightbulb, Shield, Sparkles, CalendarCheck, TrendingUp,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CityData } from '@/data/cities';

function difficultyLabel(d: number): string {
  if (d <= 1.5) return 'Easy';
  if (d <= 2.5) return 'Moderate';
  if (d <= 3.5) return 'Challenging';
  if (d <= 4.5) return 'Hard';
  return 'Expert';
}

function difficultyColor(d: number): string {
  if (d <= 1.5) return 'text-green-400';
  if (d <= 2.5) return 'text-blue-400';
  if (d <= 3.5) return 'text-yellow-400';
  if (d <= 4.5) return 'text-orange-400';
  return 'text-red-400';
}

export default function CityClient({ city, nearby }: { city: CityData; nearby: CityData[] }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const faqs = [
    { q: t('dir.faq1_q').replace('{city}', city.city), a: t('dir.faq1_a').replace('{city}', city.city).replace('{rooms}', String(city.roomCount)).replace('{themes}', city.themes.join(', ')) },
    { q: t('dir.faq2_q').replace('{city}', city.city), a: t('dir.faq2_a').replace('{city}', city.city).replace('{price}', city.avgPrice) },
    { q: t('dir.faq3_q').replace('{city}', city.city), a: t('dir.faq3_a').replace('{city}', city.city).replace('{duration}', city.avgDuration).replace('{group}', city.avgGroupSize) },
    { q: t('dir.faq4_q').replace('{city}', city.city), a: t('dir.faq4_a').replace('{city}', city.city) },
  ];

  // JSON-LD Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Escape Rooms', item: 'https://unlocked.gr/escape-rooms' },
      { '@type': 'ListItem', position: 2, name: city.country, item: `https://unlocked.gr/escape-rooms/${city.countrySlug}` },
      { '@type': 'ListItem', position: 3, name: city.city, item: `https://unlocked.gr/escape-rooms/${city.countrySlug}/${city.citySlug}` },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Escape Rooms in ${city.city}`,
    numberOfItems: city.roomCount,
    itemListElement: city.themes.map((theme, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${theme} Escape Rooms in ${city.city}`,
      url: `https://unlocked.gr/escape-rooms/${city.countrySlug}/${city.citySlug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-4 pt-6 text-sm text-brand-text-secondary flex items-center gap-1.5 flex-wrap">
        <Link href="/escape-rooms" className="hover:text-brand-primary transition-colors">
          {t('dir.breadcrumb_home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/escape-rooms/${city.countrySlug}`} className="hover:text-brand-primary transition-colors">
          {city.country}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white">{city.city}</span>
      </nav>

      {/* ── Hero ── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
            {t('dir.city_h1').replace('{city}', city.city).replace('{country}', city.country).replace('{year}', String(year))}
          </h1>
          <p className="text-lg text-brand-text-secondary max-w-3xl mb-8">
            {t('dir.city_intro')
              .replace('{city}', city.city)
              .replace('{rooms}', String(city.roomCount))
              .replace('{themes}', city.themes.slice(0, 3).join(', '))}
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: DoorOpen, label: t('dir.rooms'), value: `${city.roomCount}+` },
              { icon: Star, label: t('dir.avg_rating'), value: `${city.avgRating}/5` },
              { icon: Clock, label: t('dir.duration'), value: city.avgDuration },
              { icon: Users, label: t('dir.group_size'), value: city.avgGroupSize },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-4 rounded-xl bg-brand-card border border-brand-border text-center">
                <Icon className="w-5 h-5 mx-auto mb-2 text-brand-primary" />
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-brand-text-secondary">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Themes ── */}
      <section className="py-12 px-4 bg-brand-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6">
            {t('dir.themes_title').replace('{city}', city.city)}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {city.themes.map((theme) => (
              <div
                key={theme}
                className="p-4 rounded-xl bg-brand-card border border-brand-border text-center hover:border-brand-primary/40 transition-colors"
              >
                <Puzzle className="w-6 h-6 mx-auto mb-2 text-brand-primary" />
                <div className="font-medium text-sm">{theme}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Difficulty & Pricing ── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">
              {t('dir.difficulty_title')}
            </h2>
            <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-brand-text-secondary">{t('dir.avg_difficulty')}</span>
                <span className={`font-bold ${difficultyColor(city.avgDifficulty)}`}>
                  {city.avgDifficulty}/5 — {difficultyLabel(city.avgDifficulty)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-brand-primary rounded-full h-3 transition-all"
                  style={{ width: `${(city.avgDifficulty / 5) * 100}%` }}
                />
              </div>
              <p className="text-sm text-brand-text-secondary mt-4">
                {t('dir.difficulty_desc').replace('{city}', city.city)}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold mb-4">
              {t('dir.pricing_title')}
            </h2>
            <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-brand-text-secondary">{t('dir.price_range')}</span>
                <span className="font-bold text-brand-primary text-lg">{city.avgPrice}</span>
              </div>
              <p className="text-sm text-brand-text-secondary">
                {t('dir.pricing_desc')
                  .replace('{city}', city.city)
                  .replace('{price}', city.avgPrice)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tips ── */}
      <section className="py-12 px-4 bg-brand-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6">
            {t('dir.tips_title').replace('{city}', city.city)}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Lightbulb, text: t('dir.tip_1') },
              { icon: Users, text: t('dir.tip_2') },
              { icon: CalendarCheck, text: t('dir.tip_3') },
              { icon: Shield, text: t('dir.tip_4') },
              { icon: Sparkles, text: t('dir.tip_5') },
              { icon: TrendingUp, text: t('dir.tip_6') },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-brand-card border border-brand-border">
                <Icon className="w-5 h-5 mt-0.5 text-brand-primary shrink-0" />
                <span className="text-sm text-brand-text-secondary">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to Book ── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6">
            {t('dir.book_title').replace('{city}', city.city)}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="text-center p-6 rounded-xl bg-brand-card border border-brand-border">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold mb-2">{t(`dir.book_step${step}_title`)}</h3>
                <p className="text-sm text-brand-text-secondary">{t(`dir.book_step${step}_desc`)}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold transition-colors"
            >
              {t('dir.book_cta')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Nearby Areas ── */}
      {city.landmarks.length > 0 && (
        <section className="py-12 px-4 bg-brand-card/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-display font-bold mb-4">
              {t('dir.areas_title').replace('{city}', city.city)}
            </h2>
            <div className="flex flex-wrap gap-2">
              {city.landmarks.map((lm) => (
                <span key={lm} className="px-3 py-1.5 rounded-full bg-brand-card border border-brand-border text-sm">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-brand-primary" />
                  {lm}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-8">
            {t('dir.faq_title').replace('{city}', city.city)}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group p-5 rounded-xl bg-brand-card border border-brand-border"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-brand-text-secondary group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-brand-text-secondary text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nearby Cities ── */}
      {nearby.length > 0 && (
        <section className="py-12 px-4 bg-brand-card/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-display font-bold mb-6">
              {t('dir.nearby_title')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {nearby.map((nc) => (
                <Link
                  key={nc.citySlug}
                  href={`/escape-rooms/${nc.countrySlug}/${nc.citySlug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-brand-card border border-brand-border hover:border-brand-primary/50 transition-all"
                >
                  <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
                  <div>
                    <div className="font-medium text-sm group-hover:text-brand-primary transition-colors">
                      {nc.city}
                    </div>
                    <div className="text-xs text-brand-text-secondary">
                      {nc.roomCount}+ {t('dir.rooms')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
            {t('dir.cta_title').replace('{city}', city.city)}
          </h2>
          <p className="text-brand-text-secondary mb-8">
            {t('dir.cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold transition-colors"
            >
              {t('dir.cta_signup')}
            </Link>
            <Link
              href="/discover"
              className="px-8 py-3 rounded-lg bg-brand-card border border-brand-border hover:border-brand-primary/50 font-semibold transition-colors"
            >
              {t('dir.cta_browse')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
