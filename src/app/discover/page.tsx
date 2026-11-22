'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoomCard, toRoomCardData } from '@/components/rooms/RoomCard';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, SlidersHorizontal, DoorOpen, X } from 'lucide-react';
import { BOOKING_ENABLED } from '@/lib/features';
import { useTranslation } from '@/lib/i18n';
import { ROOM_THEME_VALUES, themeLabel as roomThemeLabel } from '@/lib/roomThemes';
import { useAuth } from '@/lib/auth';
import { useMode, setMode, forMode, HORROR_THEMES } from '@/lib/mode';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';

const themes = ['All', ...ROOM_THEME_VALUES];

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'duration'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();
  // Puzzle side (lib/mode.ts): horror rooms and their filters are hidden,
  // unless someone opens a horror theme on purpose (/discover?theme=Horror).
  const mode = useMode();
  const puzzle = mode === 'puzzle';

  // Read theme from URL params (e.g. /discover?theme=Horror)
  useEffect(() => {
    const themeParam = searchParams.get('theme');
    if (themeParam && themes.includes(themeParam)) {
      setSelectedTheme(themeParam);
    }
    // A search typed on the home page arrives as /discover?q=...
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);
  const { user } = useAuth();

  // Query user's premium status from Convex
  const convexUser = useQuery(
    api.users.getById,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );
  const isPremium = !!(convexUser as any)?.isPremium;

  const themeLabel = (theme: string): string =>
    theme === 'All' ? t('discover.filter_all') : roomThemeLabel(t, theme);

  const allRooms = useQuery(api.rooms.list);

  // On the puzzle side a theme chip shows only if it still has rooms there
  const puzzleThemes = useMemo(() => new Set(forMode(allRooms ?? [], 'puzzle').map((r: any) => r.theme)), [allRooms]);

  const filteredRooms = useMemo(() => {
    if (!allRooms) return [];
    let rooms = [...allRooms];

    // Early Access Visibility: hide rooms with future releaseDate
    // Premium users can see them 3 days early; non-premium users only after release
    const now = new Date();
    rooms = rooms.filter((r: any) => {
      if (!r.releaseDate) return true; // no release date = always visible
      const release = new Date(r.releaseDate + 'T00:00:00');
      if (isPremium) {
        // Premium users see it 3 days before release
        const earlyDate = new Date(release);
        earlyDate.setDate(earlyDate.getDate() - 3);
        return now >= earlyDate;
      }
      return now >= release;
    });

    if (!HORROR_THEMES.has(selectedTheme)) rooms = forMode(rooms, mode);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rooms = rooms.filter(
        (r: any) =>
          r.title?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.theme?.toLowerCase().includes(q)
      );
    }

    if (selectedTheme !== 'All') {
      rooms = rooms.filter((r: any) => r.theme === selectedTheme);
    }

    // Priority Placement: EA partner rooms always sort first, then normal sort
    rooms.sort((a: any, b: any) => {
      const aEA = a.isEarlyAccessPartner ? 1 : 0;
      const bEA = b.isEarlyAccessPartner ? 1 : 0;
      if (aEA !== bEA) return bEA - aEA; // EA partners first

      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'price') return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === 'duration') return (a.duration ?? 0) - (b.duration ?? 0);
      return 0;
    });

    return rooms;
  }, [allRooms, searchQuery, selectedTheme, sortBy, isPremium, mode]);

  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="fadeUp">
            <h1 className="section-heading mb-4 text-center">
              {t('discover.title')} <span className="text-gradient">{t('discover.title_highlight')}</span>
            </h1>
          </AnimateIn>
          <AnimateIn animation="fadeUp" delay={0.15}>
            <p className="text-brand-text-secondary text-center mb-8 max-w-xl mx-auto">
              {t('discover.subtitle')}
            </p>
          </AnimateIn>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-red-light" />
            <input
              type="search"
              placeholder={t('discover.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('discover.search_placeholder')}
              className="input-field pl-12! pr-12! py-3.5! [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {puzzle && (
            <p className="mb-4 text-center text-sm text-brand-text-secondary">
              {t('mode.hidden_note')}{' '}
              <button type="button" onClick={() => setMode(null)} className="text-brand-red-light hover:underline">
                {t('mode.show_them')}
              </button>
            </p>
          )}

          {/* Theme filters */}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
            {themes.filter((theme) => !puzzle || theme === 'All' || theme === selectedTheme || puzzleThemes.has(theme)).map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                aria-pressed={selectedTheme === theme}
                className={`px-3.5 py-2 rounded-sm text-sm font-medium transition-all duration-200 ${
                  selectedTheme === theme
                    ? 'bg-brand-red text-brand-bone border border-brand-red-light/50 shadow-[0_0_18px_rgba(var(--glow),0.55)]'
                    : 'bg-black/50 border border-brand-border text-brand-text-secondary hover:text-brand-bone hover:border-brand-red/60 hover:bg-brand-red/10'
                }`}
              >
                {themeLabel(theme)}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={`px-3.5 py-2 rounded-sm text-sm font-medium border flex items-center gap-1.5 transition-all duration-200 ${showFilters ? 'border-brand-gold/60 text-brand-gold bg-brand-gold/10' : 'border-brand-border bg-black/50 text-brand-text-secondary hover:text-brand-bone hover:border-brand-gold/50'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('discover.sort')}
            </button>
          </div>

          {showFilters && (
            <div className="flex justify-center gap-2 mb-4">
              {[
                { value: 'rating' as const, label: t('discover.sort_top_rated') },
                ...(BOOKING_ENABLED ? [{ value: 'price' as const, label: t('discover.sort_lowest_price') }] : []),
                { value: 'duration' as const, label: t('discover.sort_shortest') },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${
                    sortBy === s.value
                      ? 'bg-brand-red/20 text-brand-red-light border border-brand-red/30'
                      : 'bg-brand-surface text-brand-text-muted hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {!allRooms ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
              <p className="text-brand-text-muted">{t('discover.loading')}</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <DoorOpen className="w-16 h-16 text-brand-border mx-auto mb-4" />
              <h3 className="text-2xl font-display font-bold text-brand-bone mb-2">{t('discover.no_results')}</h3>
              <p className="text-brand-text-muted">
                {t('discover.no_results_hint')}
              </p>
            </div>
          ) : (
            <>
              <p className="horror-label mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-brand-red/60" />
                {t('discover.rooms_found', { count: String(filteredRooms.length) })}
              </p>
              <StaggerContainer stagger={0.08} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room: any) => (
                  <StaggerItem key={room._id} animation="fadeUp" className="h-full">
                    <RoomCard room={toRoomCardData(room)} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </>
          )}
        </div>
      </section>
    </>
  );
}
