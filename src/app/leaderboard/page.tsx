'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Clock,
  DoorOpen,
  TrendingUp,
  Award,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type Tab = 'players' | 'rooms' | 'teams';

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('players');

  const badges = [
    { icon: '🏆', name: t('leaderboard.badge_champion'), desc: t('leaderboard.badge_champion_desc') },
    { icon: '🔥', name: t('leaderboard.badge_on_fire'), desc: t('leaderboard.badge_on_fire_desc') },
    { icon: '🧠', name: t('leaderboard.badge_mastermind'), desc: t('leaderboard.badge_mastermind_desc') },
    { icon: '⚡', name: t('leaderboard.badge_speed_demon'), desc: t('leaderboard.badge_speed_demon_desc') },
    { icon: '👥', name: t('leaderboard.badge_team_leader'), desc: t('leaderboard.badge_team_leader_desc') },
    { icon: '🌍', name: t('leaderboard.badge_explorer'), desc: t('leaderboard.badge_explorer_desc') },
    { icon: '🎯', name: t('leaderboard.badge_perfectionist'), desc: t('leaderboard.badge_perfectionist_desc') },
    { icon: '🌙', name: t('leaderboard.badge_night_owl'), desc: t('leaderboard.badge_night_owl_desc') },
  ];

  // Query real data from Convex
  const leaderboardData = useQuery(api.users.leaderboard, { limit: 20 });
  const convexRooms = useQuery(api.rooms.list);

  const isLoading = leaderboardData === undefined;

  // Live players from Convex
  const topPlayers = leaderboardData?.players ?? [];

  // Live stats from Convex
  const globalStats = leaderboardData?.stats;

  // Build top rooms from real data
  const topRooms =
    convexRooms && convexRooms.length > 0
      ? [...convexRooms]
          .sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 10)
          .map((r: any, i: number) => ({
            rank: i + 1,
            name: r.title || 'Untitled',
            venue: r.companyName || r.location || 'Unknown',
            rating: r.rating ?? 0,
            reviews: r.reviews ?? 0,
            escapeRate: r.escapeRate ?? 0,
            theme: r.theme || 'Mystery',
          }))
      : [];

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
            {t('leaderboard.title')}
          </h1>
          <p className="text-lg text-brand-text-secondary max-w-xl mx-auto">
            {t('leaderboard.subtitle')}
          </p>
        </div>
      </section>

      {/* Global Stats */}
      <section className="pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: DoorOpen, label: t('leaderboard.total_escapes'), value: globalStats ? globalStats.totalEscapes.toLocaleString() : '—', color: 'text-brand-red' },
                { icon: Clock, label: t('leaderboard.avg_escape_time'), value: globalStats ? `${globalStats.totalPlayed.toLocaleString()} ${t('leaderboard.played')}` : '—', color: 'text-cyan-400' },
                { icon: TrendingUp, label: t('leaderboard.success_rate'), value: globalStats ? `${globalStats.successRate}%` : '—', color: 'text-green-400' },
                { icon: Award, label: t('leaderboard.badges_earned'), value: globalStats ? globalStats.totalBadges.toLocaleString() : '—', color: 'text-brand-gold' },
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
              { id: 'players' as Tab, label: t('leaderboard.top_players'), icon: Trophy },
              { id: 'rooms' as Tab, label: t('leaderboard.top_rooms'), icon: Star },
              { id: 'teams' as Tab, label: t('leaderboard.badges'), icon: Award },
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
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
                </div>
              ) : topPlayers.length === 0 ? (
                <div className="card p-12 text-center">
                  <Trophy className="w-12 h-12 text-brand-text-muted mx-auto mb-4" />
                  <p className="text-brand-text-secondary">{t('leaderboard.no_players_yet')}</p>
                </div>
              ) : (
                <>
              {/* Top 3 podium */}
              {topPlayers.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
                {[topPlayers[1], topPlayers[0], topPlayers[2]].map(
                  (player, i) => {
                    const order = [2, 1, 3][i];
                    const heights = ['h-32', 'h-40', 'h-28'][i];
                    return (
                      <div key={player.rank} className="text-center">
                        <div className="mb-3">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className={`w-14 h-14 md:w-16 md:h-16 rounded-full mx-auto object-cover ${
                                order === 1
                                  ? 'ring-4 ring-yellow-400/30'
                                  : order === 2
                                  ? 'ring-4 ring-gray-400/20'
                                  : 'ring-4 ring-amber-600/20'
                              }`}
                            />
                          ) : (
                          <div
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-full mx-auto flex items-center justify-center text-lg font-bold ${
                              order === 1
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 ring-4 ring-yellow-400/30'
                                : order === 2
                                ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800 ring-4 ring-gray-400/20'
                                : 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-200 ring-4 ring-amber-600/20'
                            }`}
                          >
                            {player.initials}
                          </div>
                          )}
                          <h3 className="font-semibold text-sm mt-2">
                            {player.name}
                          </h3>
                          <p className="text-xs text-brand-text-muted">
                            {player.escaped} {t('leaderboard.escapes')}
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
              )}

              {/* Full list */}
              <div className="card overflow-hidden">
                <div className="hidden md:grid grid-cols-[60px_1fr_80px_80px_80px_80px] gap-4 p-4 bg-brand-surface/50 text-xs font-medium text-brand-text-muted uppercase">
                  <span>{t('leaderboard.rank')}</span>
                  <span>{t('leaderboard.player')}</span>
                  <span className="text-center">{t('leaderboard.played')}</span>
                  <span className="text-center">{t('leaderboard.escaped')}</span>
                  <span className="text-center">{t('leaderboard.rate')}</span>
                  <span className="text-center">{t('leaderboard.badges_col')}</span>
                </div>
                {topPlayers.map((player) => (
                  <div
                    key={player.rank}
                    className={`grid grid-cols-[60px_1fr_auto] md:grid-cols-[60px_1fr_80px_80px_80px_80px] gap-4 p-4 items-center border-t border-brand-border/30 hover:bg-brand-surface/30 transition-colors ${
                      player.rank <= 3 ? 'bg-brand-surface/10' : ''
                    }`}
                  >
                    <div className="flex justify-center">
                      <RankBadge rank={player.rank} />
                    </div>
                    <div className="flex items-center gap-3">
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red text-sm font-bold">
                        {player.initials}
                      </div>
                      )}
                      <div>
                        <span className="font-medium text-sm">
                          {player.name}
                        </span>
                        <div className="md:hidden text-xs text-brand-text-muted">
                          {player.escaped} {t('leaderboard.escapes')} · {player.rate}%
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
                  </div>
                ))}
              </div>
                </>
              )}
            </div>
          )}

          {/* Top Rooms */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              {topRooms.length === 0 ? (
                <div className="card p-12 text-center">
                  <Star className="w-12 h-12 text-brand-text-muted mx-auto mb-4" />
                  <p className="text-brand-text-secondary">{t('leaderboard.no_rooms_yet')}</p>
                </div>
              ) : (
              topRooms.map((room) => (
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
                      {room.escapeRate}% {t('leaderboard.escape_rate')}
                    </div>
                  </div>
                </div>
              ))
              )}
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
