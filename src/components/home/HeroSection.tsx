'use client';

import Link from 'next/link';
import {
  Search,
  Sparkles,
  Skull,
  Compass,
  Landmark,
  Cpu,
  Microscope,
  Ghost,
  Swords,
} from 'lucide-react';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

const heroThemes = [
  { key: 'theme.horror', value: 'Horror', icon: Skull, color: 'from-red-600 to-red-900' },
  { key: 'theme.adventure', value: 'Adventure', icon: Compass, color: 'from-amber-600 to-amber-900' },
  { key: 'theme.mystery', value: 'Mystery', icon: Search, color: 'from-purple-600 to-purple-900' },
  { key: 'theme.history', value: 'Historical', icon: Landmark, color: 'from-yellow-600 to-yellow-900' },
  { key: 'theme.scifi', value: 'Sci-Fi', icon: Cpu, color: 'from-cyan-600 to-cyan-900' },
  { key: 'theme.science', value: 'Science', icon: Microscope, color: 'from-green-600 to-green-900' },
  { key: 'theme.paranormal', value: 'Paranormal', icon: Ghost, color: 'from-indigo-600 to-indigo-900' },
  { key: 'theme.medieval', value: 'Medieval', icon: Swords, color: 'from-orange-600 to-orange-900' },
];

export function HeroSection() {
  const { t } = useTranslation();
  const platformStats = useSafeQuery<{ totalPlayers: number; totalRooms: number; averageRating: number }>(
    api.stats.getPlatformStats
  );

  const playersLabel = platformStats
    ? `${platformStats.totalPlayers.toLocaleString()}${t('hero.players')}`
    : '…';
  const ratingLabel = platformStats
    ? `⭐ ${platformStats.averageRating} ${t('hero.avg_rating')}`
    : '…';
  const roomsLabel = platformStats
    ? `${platformStats.totalRooms}${t('hero.rooms')}`
    : '…';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,30,30,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,30,30,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/20 rounded-full px-4 py-1.5 mb-8 animate-fade-up">
          <Sparkles className="w-4 h-4 text-brand-red" />
          <span className="text-brand-red text-sm font-medium">
            {t('hero.badge')}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6 animate-fade-up animate-delay-100">
          {t('hero.title1')}
          <br />
          <span className="text-gradient">{t('hero.title2')}</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-brand-text-secondary max-w-2xl mx-auto mb-10 animate-fade-up animate-delay-200">
          {t('hero.subtitle')}
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10 animate-fade-up animate-delay-300">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-red/50 to-brand-red-light/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              <Search className="w-5 h-5 text-brand-text-muted ml-5 shrink-0" />
              <input
                type="text"
                placeholder={t('hero.search_placeholder')}
                className="w-full bg-transparent px-4 py-4 text-white placeholder-brand-text-muted focus:outline-none"
              />
              <button className="btn-primary !rounded-l-none !rounded-r-xl shrink-0 !py-4 !px-6">
                {t('hero.search')}
              </button>
            </div>
          </div>
        </div>

        {/* Theme Quick Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 animate-fade-up animate-delay-400">
          {heroThemes.map((theme) => (
            <Link
              key={theme.value}
              href={`/discover?theme=${encodeURIComponent(theme.value)}`}
              className="group relative overflow-hidden rounded-full px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
              <div className="absolute inset-0 bg-brand-card/60 group-hover:bg-brand-card/40 transition-colors" />
              <div className="absolute inset-0 border border-brand-border/30 rounded-full group-hover:border-brand-red/30 transition-colors" />
              <div className="relative z-10 flex items-center gap-1.5">
                <theme.icon className="w-3.5 h-3.5 text-brand-text-muted group-hover:text-brand-red transition-colors" />
                <span className="text-xs sm:text-sm font-medium text-brand-text-secondary group-hover:text-white transition-colors">
                  {t(theme.key)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex items-center justify-center gap-4 sm:gap-8 text-brand-text-muted text-sm animate-fade-up animate-delay-500">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-brand-surface border-2 border-brand-bg flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: ['#FF1E1E', '#FF4D4D', '#CC1818', '#FF6B6B'][i],
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span>{playersLabel}</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-brand-border" />
          <span className="hidden sm:block">{ratingLabel}</span>
          <div className="hidden sm:block w-px h-5 bg-brand-border" />
          <span className="hidden sm:block">{roomsLabel}</span>
        </div>
      </div>
    </section>
  );
}
