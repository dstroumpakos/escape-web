'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Star,
  Clock,
  DoorOpen,
  TrendingUp,
  Award,
} from 'lucide-react';

type Tab = 'players' | 'rooms' | 'teams';

const fallbackPlayers = [
  { rank: 1, name: 'Alex M.', avatar: 'AM', played: 87, escaped: 82, rate: 94, badges: 23, streak: 12 },
  { rank: 2, name: 'Maria K.', avatar: 'MK', played: 72, escaped: 67, rate: 93, badges: 19, streak: 8 },
  { rank: 3, name: 'Nikos P.', avatar: 'NP', played: 65, escaped: 59, rate: 91, badges: 17, streak: 15 },
  { rank: 4, name: 'Sophie L.', avatar: 'SL', played: 58, escaped: 52, rate: 90, badges: 14, streak: 6 },
  { rank: 5, name: 'Dimitris T.', avatar: 'DT', played: 53, escaped: 47, rate: 89, badges: 12, streak: 4 },
  { rank: 6, name: 'Elena V.', avatar: 'EV', played: 49, escaped: 44, rate: 90, badges: 11, streak: 7 },
  { rank: 7, name: 'Kostas A.', avatar: 'KA', played: 45, escaped: 39, rate: 87, badges: 10, streak: 3 },
  { rank: 8, name: 'Christina D.', avatar: 'CD', played: 41, escaped: 36, rate: 88, badges: 9, streak: 5 },
  { rank: 9, name: 'George F.', avatar: 'GF', played: 38, escaped: 33, rate: 87, badges: 8, streak: 2 },
  { rank: 10, name: 'Anna R.', avatar: 'AR', played: 35, escaped: 30, rate: 86, badges: 7, streak: 9 },
];

const fallbackRooms = [
  { rank: 1, name: 'Egyptian Tomb', venue: 'Escape Athens', rating: 4.9, reviews: 256, escapeRate: 32, theme: 'History' },
  { rank: 2, name: 'Prison Break', venue: 'Room Escape GR', rating: 4.9, reviews: 203, escapeRate: 28, theme: 'Adventure' },
  { rank: 3, name: 'The Haunted Mansion', venue: 'Dark Rooms', rating: 4.8, reviews: 142, escapeRate: 45, theme: 'Horror' },
  { rank: 4, name: 'Cyber Heist', venue: 'TechEscape', rating: 4.8, reviews: 134, escapeRate: 38, theme: 'Sci-Fi' },
  { rank: 5, name: 'Da Vinci Code', venue: 'Mystery Rooms', rating: 4.7, reviews: 98, escapeRate: 52, theme: 'Mystery' },
];

const badges = [
  { icon: '🏆', name: 'Champion', desc: 'Escape 50+ rooms' },
  { icon: '🔥', name: 'On Fire', desc: '10 escapes in a row' },
  { icon: '🧠', name: 'Mastermind', desc: 'Escape 5 hard rooms' },
  { icon: '⚡', name: 'Speed Demon', desc: 'Escape in under 30 min' },
  { icon: '👥', name: 'Team Leader', desc: 'Play with 20+ unique teammates' },
  { icon: '🌍', name: 'Explorer', desc: 'Try all room themes' },
  { icon: '🎯', name: 'Perfectionist', desc: 'No hints used in 10 rooms' },
  { icon: '🌙', name: 'Night Owl', desc: '10 late-night escapes' },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
        <Crown className="w-5 h-5 text-yellow-900" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
        <Medal className="w-5 h-5 text-gray-800" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
        <Medal className="w-5 h-5 text-amber-200" />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center text-sm font-bold text-brand-text-muted">
      {rank}
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('players');

  // Query real data from Convex
  const convexRooms = useQuery(api.rooms.list);

  // Build top players: we don't have a dedicated leaderboard query, so use fallback
  // In the future this could be a server-side query that sorts users by escaped count
  const topPlayers = fallbackPlayers;

  // Build top rooms from real data when available
  const topRooms =
    convexRooms && convexRooms.length > 0
      ? [...convexRooms]
          .sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 5)
          .map((r: any, i: number) => ({
            rank: i + 1,
            name: r.title || 'Untitled',
            venue: r.location || 'Unknown',
            rating: r.rating ?? 0,
            reviews: r.reviews ?? 0,
            escapeRate: r.escapeRate ?? 0,
            theme: r.theme || 'Mystery',
          }))
      : fallbackRooms;

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-brand-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 mb-6">
            <Trophy className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="section-heading mb-4">
            Leader<span className="text-gradient">board</span>
          </h1>
          <p className="text-lg text-brand-text-secondary max-w-xl mx-auto">
            See who&apos;s dominating the escape room scene. Climb the ranks,
            earn badges, and prove you&apos;re the ultimate escape artist.
          </p>
        </div>
      </section>

      {/* Global Stats */}
      <section className="pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: DoorOpen, label: 'Total Escapes', value: '5,247', color: 'text-brand-red' },
                { icon: Clock, label: 'Avg. Escape Time', value: '47 min', color: 'text-cyan-400' },
                { icon: TrendingUp, label: 'Success Rate', value: '68%', color: 'text-green-400' },
                { icon: Award, label: 'Badges Earned', value: '1,832', color: 'text-brand-gold' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                  <div className="text-xl md:text-2xl font-display font-bold">
                    {s.value}
                  </div>
                  <div className="text-xs text-brand-text-muted mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab buttons */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'players' as Tab, label: 'Top Players', icon: Trophy },
              { id: 'rooms' as Tab, label: 'Top Rooms', icon: Star },
              { id: 'teams' as Tab, label: 'Badges', icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-red text-white'
                    : 'bg-brand-card border border-brand-border text-brand-text-secondary hover:text-white hover:border-brand-red/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Players Table */}
          {activeTab === 'players' && (
            <div className="space-y-3">
              {/* Top 3 podium */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[topPlayers[1], topPlayers[0], topPlayers[2]].map(
                  (player, i) => {
                    const order = [2, 1, 3][i];
                    const heights = ['h-32', 'h-40', 'h-28'][i];
                    return (
                      <div key={player.rank} className="text-center">
                        <div className="mb-3">
                          <div
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-full mx-auto flex items-center justify-center text-lg font-bold ${
                              order === 1
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 ring-4 ring-yellow-400/30'
                                : order === 2
                                ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800 ring-4 ring-gray-400/20'
                                : 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-200 ring-4 ring-amber-600/20'
                            }`}
                          >
                            {player.avatar}
                          </div>
                          <h3 className="font-semibold text-sm mt-2">
                            {player.name}
                          </h3>
                          <p className="text-xs text-brand-text-muted">
                            {player.escaped} escapes
                          </p>
                        </div>
                        <div
                          className={`${heights} bg-gradient-to-t from-brand-surface to-brand-card rounded-t-xl flex items-end justify-center pb-3`}
                        >
                          <span className="text-2xl font-display font-bold text-brand-text-muted">
                            #{order}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Full list */}
              <div className="card overflow-hidden">
                <div className="hidden md:grid grid-cols-[60px_1fr_80px_80px_80px_80px_80px] gap-4 p-4 bg-brand-surface/50 text-xs font-medium text-brand-text-muted uppercase">
                  <span>Rank</span>
                  <span>Player</span>
                  <span className="text-center">Played</span>
                  <span className="text-center">Escaped</span>
                  <span className="text-center">Rate</span>
                  <span className="text-center">Badges</span>
                  <span className="text-center">Streak</span>
                </div>
                {topPlayers.map((player) => (
                  <div
                    key={player.rank}
                    className={`grid grid-cols-[60px_1fr_auto] md:grid-cols-[60px_1fr_80px_80px_80px_80px_80px] gap-4 p-4 items-center border-t border-brand-border/30 hover:bg-brand-surface/30 transition-colors ${
                      player.rank <= 3 ? 'bg-brand-surface/10' : ''
                    }`}
                  >
                    <div className="flex justify-center">
                      <RankBadge rank={player.rank} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red text-sm font-bold">
                        {player.avatar}
                      </div>
                      <div>
                        <span className="font-medium text-sm">
                          {player.name}
                        </span>
                        <div className="md:hidden text-xs text-brand-text-muted">
                          {player.escaped} escapes · {player.rate}%
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block text-center text-sm text-brand-text-secondary">
                      {player.played}
                    </div>
                    <div className="hidden md:block text-center text-sm font-medium">
                      {player.escaped}
                    </div>
                    <div className="hidden md:block text-center">
                      <span className="text-sm font-medium text-green-400">
                        {player.rate}%
                      </span>
                    </div>
                    <div className="hidden md:block text-center text-sm text-brand-gold">
                      {player.badges}
                    </div>
                    <div className="hidden md:flex items-center justify-center gap-1 text-sm">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-orange-400">{player.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Rooms */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              {topRooms.map((room) => (
                <div
                  key={room.rank}
                  className="card p-5 flex items-center gap-4 hover:border-brand-red/30"
                >
                  <RankBadge rank={room.rank} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{room.name}</h3>
                    <p className="text-sm text-brand-text-muted">{room.venue}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <span className="px-2.5 py-1 rounded-full bg-brand-surface text-brand-text-secondary text-xs">
                      {room.theme}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />
                      <span className="font-medium">{room.rating}</span>
                      <span className="text-brand-text-muted">
                        ({room.reviews})
                      </span>
                    </div>
                    <div className="text-brand-text-secondary">
                      {room.escapeRate}% escape rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Badges */}
          {activeTab === 'teams' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge, i) => (
                <div
                  key={i}
                  className="card p-5 text-center hover:border-brand-gold/30"
                >
                  <span className="text-4xl mb-3 block">{badge.icon}</span>
                  <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-brand-text-muted">{badge.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
