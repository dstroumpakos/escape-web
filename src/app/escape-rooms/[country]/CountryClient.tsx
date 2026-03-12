'use client';

import Link from 'next/link';
import { MapPin, DoorOpen, Star, Clock, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CityData } from '@/data/cities';

const COUNTRY_FLAG: Record<string, string> = {
  'united-kingdom': '🇬🇧', germany: '🇩🇪', france: '🇫🇷', netherlands: '🇳🇱',
  spain: '🇪🇸', italy: '🇮🇹', portugal: '🇵🇹', belgium: '🇧🇪', austria: '🇦🇹',
  'czech-republic': '🇨🇿', hungary: '🇭🇺', poland: '🇵🇱', switzerland: '🇨🇭',
  denmark: '🇩🇰', sweden: '🇸🇪', norway: '🇳🇴', finland: '🇫🇮', romania: '🇷🇴',
  bulgaria: '🇧🇬', croatia: '🇭🇷', slovenia: '🇸🇮', 'united-states': '🇺🇸',
  canada: '🇨🇦', australia: '🇦🇺', japan: '🇯🇵', 'south-korea': '🇰🇷',
  'united-arab-emirates': '🇦🇪', singapore: '🇸🇬',
};

export default function CountryClient({
  countryName,
  countrySlug,
  cities,
  totalRooms,
}: {
  countryName: string;
  countrySlug: string;
  cities: CityData[];
  totalRooms: number;
}) {
  const { t } = useTranslation();
  const flag = COUNTRY_FLAG[countrySlug] || '🌍';

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-4 pt-6 text-sm text-brand-text-secondary flex items-center gap-1.5 flex-wrap">
        <Link href="/escape-rooms" className="hover:text-brand-primary transition-colors">
          {t('dir.breadcrumb_home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white">{countryName}</span>
      </nav>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{flag}</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              {t('dir.country_title').replace('{country}', countryName)}
            </h1>
          </div>
          <p className="text-lg text-brand-text-secondary max-w-3xl mb-8">
            {t('dir.country_subtitle')
              .replace('{rooms}', String(totalRooms))
              .replace('{cities}', String(cities.length))
              .replace('{country}', countryName)}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-12">
            <div className="px-5 py-3 rounded-xl bg-brand-card border border-brand-border text-center">
              <div className="text-2xl font-bold text-brand-primary">{cities.length}</div>
              <div className="text-xs text-brand-text-secondary">{t('dir.stat_cities')}</div>
            </div>
            <div className="px-5 py-3 rounded-xl bg-brand-card border border-brand-border text-center">
              <div className="text-2xl font-bold text-brand-primary">{totalRooms}+</div>
              <div className="text-xs text-brand-text-secondary">{t('dir.stat_rooms')}</div>
            </div>
            <div className="px-5 py-3 rounded-xl bg-brand-card border border-brand-border text-center">
              <div className="text-2xl font-bold text-brand-primary">
                {(cities.reduce((s, c) => s + c.avgRating, 0) / cities.length).toFixed(1)}
              </div>
              <div className="text-xs text-brand-text-secondary">{t('dir.stat_avg_rating')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* City cards */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-display font-bold mb-8">
            {t('dir.cities_in').replace('{country}', countryName)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cities
              .sort((a, b) => b.roomCount - a.roomCount)
              .map((city) => (
                <Link
                  key={city.citySlug}
                  href={`/escape-rooms/${countrySlug}/${city.citySlug}`}
                  className="group p-6 rounded-xl bg-brand-card border border-brand-border hover:border-brand-primary/50 transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-brand-primary transition-colors">
                    {city.city}
                  </h3>
                  <div className="space-y-2 text-sm text-brand-text-secondary mb-4">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-brand-primary" />
                      {city.roomCount}+ {t('dir.rooms')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {city.avgRating} {t('dir.avg_rating')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {city.avgDuration}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {city.avgGroupSize} {t('dir.players')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {city.themes.slice(0, 3).map((theme) => (
                      <span
                        key={theme}
                        className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs"
                      >
                        {theme}
                      </span>
                    ))}
                    {city.themes.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs">
                        +{city.themes.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-brand-primary text-sm font-medium">
                    {t('dir.explore')} <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
