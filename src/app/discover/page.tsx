'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Users,
  SlidersHorizontal,
  DoorOpen,
  Zap,
  X,
} from 'lucide-react';

const themes = ['All', 'Horror', 'Sci-Fi', 'Mystery', 'Historical', 'Fantasy', 'Adventure'];

const difficultyLabels: Record<number, string> = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Challenging',
  4: 'Hard',
  5: 'Extreme',
};

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'duration'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const allRooms = useQuery(api.rooms.list);

  const filteredRooms = useMemo(() => {
    if (!allRooms) return [];
    let rooms = [...allRooms];

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

    rooms.sort((a: any, b: any) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'price') return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === 'duration') return (a.duration ?? 0) - (b.duration ?? 0);
      return 0;
    });

    return rooms;
  }, [allRooms, searchQuery, selectedTheme, sortBy]);

  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="section-heading mb-4 text-center">
            Discover <span className="text-gradient">Escape Rooms</span>
          </h1>
          <p className="text-brand-text-secondary text-center mb-8 max-w-xl mx-auto">
            Browse all available rooms, filter by theme, and find your next adventure.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search rooms by name, location, or theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field !pl-12 !pr-12"
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

          {/* Theme filters */}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
            {themes.map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedTheme === theme
                    ? 'bg-brand-red text-white'
                    : 'bg-brand-card border border-brand-border text-brand-text-secondary hover:text-white hover:border-brand-red/30'
                }`}
              >
                {theme}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-card border border-brand-border text-brand-text-secondary hover:text-white hover:border-brand-red/30 flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Sort
            </button>
          </div>

          {showFilters && (
            <div className="flex justify-center gap-2 mb-4">
              {[
                { value: 'rating' as const, label: 'Top Rated' },
                { value: 'price' as const, label: 'Lowest Price' },
                { value: 'duration' as const, label: 'Shortest' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sortBy === s.value
                      ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
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
              <p className="text-brand-text-muted">Loading rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <DoorOpen className="w-16 h-16 text-brand-border mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No rooms found</h3>
              <p className="text-brand-text-muted">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-brand-text-muted mb-6">
                {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room: any) => (
                  <Link
                    href={`/rooms/${room._id}`}
                    key={room._id}
                    className="card-hover group cursor-pointer block"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-brand-surface to-brand-card overflow-hidden">
                      {room.image ? (
                        <img
                          src={room.image}
                          alt={room.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <DoorOpen className="w-16 h-16 text-brand-border/30 group-hover:text-brand-red/20 transition-colors duration-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-card/80 to-transparent z-10" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 z-20 flex gap-2">
                        {room.isNew && (
                          <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" /> NEW
                          </span>
                        )}
                        {room.isTrending && (
                          <span className="bg-brand-gold text-black text-xs font-bold px-2.5 py-1 rounded-full">
                            🔥 TRENDING
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="absolute top-3 right-3 z-20">
                        <span className="bg-brand-card/90 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-brand-border/50">
                          €{room.price}
                          <span className="text-brand-text-muted font-normal text-xs">/person</span>
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3 bg-brand-surface text-brand-text-secondary">
                        {room.theme}
                      </span>

                      <h3 className="text-lg font-semibold mb-1 group-hover:text-brand-red transition-colors">
                        {room.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-sm text-brand-text-muted mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        {room.location}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />
                        <span className="text-sm font-medium">{room.rating}</span>
                        <span className="text-sm text-brand-text-muted">
                          ({room.reviews} reviews)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-brand-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {room.duration} min
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {room.players}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">
                            {difficultyLabels[room.difficulty] || `Lvl ${room.difficulty}`}
                          </span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: room.maxDifficulty || 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i < room.difficulty ? 'bg-brand-red' : 'bg-brand-border'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
