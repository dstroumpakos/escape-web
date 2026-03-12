'use client';

import Link from 'next/link';
import { Globe, MapPin, DoorOpen, ArrowRight, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Country {
  country: string;
  countrySlug: string;
  cityCount: number;
  totalRooms: number;
}

const CONTINENT_ORDER = ['Europe', 'North America', 'Asia', 'Oceania'];

const COUNTRY_FLAG: Record<string, string> = {
  'united-kingdom': '🇬🇧', germany: '🇩🇪', france: '🇫🇷', netherlands: '🇳🇱',
  spain: '🇪🇸', italy: '🇮🇹', portugal: '🇵🇹', belgium: '🇧🇪', austria: '🇦🇹',
  'czech-republic': '🇨🇿', hungary: '🇭🇺', poland: '🇵🇱', switzerland: '🇨🇭',
  denmark: '🇩🇰', sweden: '🇸🇪', norway: '🇳🇴', finland: '🇫🇮', romania: '🇷🇴',
  bulgaria: '🇧🇬', croatia: '🇭🇷', slovenia: '🇸🇮', 'united-states': '🇺🇸',
  canada: '🇨🇦', australia: '🇦🇺', japan: '🇯🇵', 'south-korea': '🇰🇷',
  'united-arab-emirates': '🇦🇪', singapore: '🇸🇬',
};

const COUNTRY_CONTINENT: Record<string, string> = {
  'united-kingdom': 'Europe', germany: 'Europe', france: 'Europe', netherlands: 'Europe',
  spain: 'Europe', italy: 'Europe', portugal: 'Europe', belgium: 'Europe', austria: 'Europe',
  'czech-republic': 'Europe', hungary: 'Europe', poland: 'Europe', switzerland: 'Europe',
  denmark: 'Europe', sweden: 'Europe', norway: 'Europe', finland: 'Europe', romania: 'Europe',
  bulgaria: 'Europe', croatia: 'Europe', slovenia: 'Europe', 'united-states': 'North America',
  canada: 'North America', australia: 'Oceania', japan: 'Asia', 'south-korea': 'Asia',
  'united-arab-emirates': 'Asia', singapore: 'Asia',
};

export default function DirectoryClient({
  countries,
  totalCities,
  totalRooms,
}: {
  countries: Country[];
  totalCities: number;
  totalRooms: number;
}) {
  const { t } = useTranslation();

  const grouped = CONTINENT_ORDER.map((continent) => ({
    continent,
    countries: countries.filter((c) => COUNTRY_CONTINENT[c.countrySlug] === continent),
  })).filter((g) => g.countries.length > 0);

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* Hero */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            {t('dir.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
            {t('dir.hero_title')}{' '}
            <span className="text-gradient">{t('dir.hero_highlight')}</span>
          </h1>
          <p className="text-lg text-brand-text-secondary max-w-2xl mx-auto mb-10">
            {t('dir.hero_subtitle')}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-primary">{countries.length}</div>
              <div className="text-sm text-brand-text-secondary">{t('dir.stat_countries')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-primary">{totalCities}+</div>
              <div className="text-sm text-brand-text-secondary">{t('dir.stat_cities')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-primary">{totalRooms.toLocaleString()}+</div>
              <div className="text-sm text-brand-text-secondary">{t('dir.stat_rooms')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Country listing by continent */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {grouped.map(({ continent, countries: cc }) => (
            <div key={continent} className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-8 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-brand-primary" />
                {continent}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cc.map((country) => (
                  <Link
                    key={country.countrySlug}
                    href={`/escape-rooms/${country.countrySlug}`}
                    className="group p-5 rounded-xl bg-brand-card border border-brand-border hover:border-brand-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{COUNTRY_FLAG[country.countrySlug] || '🌍'}</span>
                      <h3 className="font-semibold text-lg group-hover:text-brand-primary transition-colors">
                        {country.country}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {country.cityCount} {country.cityCount === 1 ? t('dir.city') : t('dir.cities')}
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5" />
                        {country.totalRooms}+ {t('dir.rooms')}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-brand-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('dir.explore')} <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 px-4 bg-brand-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6">
            {t('dir.seo_title')}
          </h2>
          <p className="text-brand-text-secondary leading-relaxed mb-6">
            {t('dir.seo_p1')}
          </p>
          <p className="text-brand-text-secondary leading-relaxed mb-8">
            {t('dir.seo_p2')}
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold transition-colors"
          >
            <Search className="w-4 h-4" />
            {t('dir.seo_cta')}
          </Link>
        </div>
      </section>
    </div>
  );
}
