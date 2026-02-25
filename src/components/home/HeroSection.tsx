'use client';

import Link from 'next/link';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';

export function HeroSection() {
  const platformStats = useSafeQuery<{ totalPlayers: number; totalRooms: number; averageRating: number }>(
    api.stats.getPlatformStats
  );

  const playersLabel = platformStats
    ? `${platformStats.totalPlayers.toLocaleString()}+ Players`
    : '…';
  const ratingLabel = platformStats
    ? `⭐ ${platformStats.averageRating} Average Rating`
    : '…';
  const roomsLabel = platformStats
    ? `${platformStats.totalRooms}+ Rooms`
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
            The #1 Escape Room Platform
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6 animate-fade-up animate-delay-100">
          Discover. Escape.
          <br />
          <span className="text-gradient">Get UNLOCKED.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-brand-text-secondary max-w-2xl mx-auto mb-10 animate-fade-up animate-delay-200">
          Find and book the best escape rooms near you. Challenge your team,
          solve puzzles, and create memories that last a lifetime.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10 animate-fade-up animate-delay-300">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-red/50 to-brand-red-light/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              <Search className="w-5 h-5 text-brand-text-muted ml-5 shrink-0" />
              <input
                type="text"
                placeholder="Search escape rooms, themes, or locations..."
                className="w-full bg-transparent px-4 py-4 text-white placeholder-brand-text-muted focus:outline-none"
              />
              <button className="btn-primary !rounded-l-none !rounded-r-xl shrink-0 !py-4 !px-6">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-400">
          <Link href="/signup" className="btn-primary flex items-center gap-2 text-lg !py-4 !px-10">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/about" className="btn-outline text-lg !py-4 !px-10">
            Learn More
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex items-center justify-center gap-8 text-brand-text-muted text-sm animate-fade-up animate-delay-500">
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
