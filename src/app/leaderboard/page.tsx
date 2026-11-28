'use client';

import { useState } from 'react';
import { PASSPORT_ENABLED } from '@/lib/features';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Trophy,
  Crown,
  Star,
  DoorOpen,
  Award,
  Loader2,
  Stamp,
  KeyRound,
  PenLine,
  Heart,
  Camera,
  Image as ImageIcon,
  Users,
  Info,
  ChevronDown,
  CalendarDays,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { rankLabel } from '@/components/profile/ProfileView';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import { localeFor } from '@/lib/languages';

type Tab = 'players' | 'rooms' | 'teams';
type Period = 'all' | 'month';

type Player = {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  initials: string;
  title?: string;
  score?: number;
  games?: number;
  escapes?: number;
  reviews?: number;
  badges: number;
  escaped: number;
  played: number;
};

/** Points per action: keep in step with SCORE in convex/leaderboardScore.ts. */
const SCORE_RULES = [
  { pts: 20, key: 'lb.rule_game', Icon: Stamp },
  { pts: 10, key: 'lb.rule_escape', Icon: KeyRound },
  { pts: 3, key: 'lb.rule_review', Icon: PenLine },
  { pts: 3, key: 'lb.rule_long_review', Icon: PenLine },
  { pts: 5, key: 'lb.rule_badge', Icon: Award },
  { pts: 1, key: 'lb.rule_like', Icon: Heart },
  { pts: 5, key: 'lb.rule_avatar', Icon: Camera },
  { pts: 5, key: 'lb.rule_cover', Icon: ImageIcon },
];

const MEDAL = {
  1: { ring: 'ring-[#f2c75c]', text: 'text-[#f2c75c]', bg: 'from-[#f2c75c]/25', label: 'bg-[#f2c75c] text-[#1a1305]' },
  2: { ring: 'ring-[#c9d1dc]', text: 'text-[#c9d1dc]', bg: 'from-[#c9d1dc]/15', label: 'bg-[#c9d1dc] text-[#14181f]' },
  3: { ring: 'ring-[#cd8a4b]', text: 'text-[#cd8a4b]', bg: 'from-[#cd8a4b]/20', label: 'bg-[#cd8a4b] text-[#1d1006]' },
} as const;

function Avatar({ p, size }: { p: Pick<Player, 'avatar' | 'name' | 'initials'>; size: string }) {
  return p.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.avatar} alt={p.name} className={`${size} rounded-full object-cover`} />
  ) : (
    <span className={`${size} rounded-full bg-brand-red/20 text-brand-red-light font-bold flex items-center justify-center`}>
      {p.initials}
    </span>
  );
}

const EL_MONTHS = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];

const scoreOf = (p: Player) => p.score ?? p.escaped * 10 + p.played * 20;

export default function LeaderboardPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('players');
  const [period, setPeriod] = useState<Period>('all');
  const [shown, setShown] = useState(20);

  const badges = [
    { icon: '🏆', key: 'champion', name: t('leaderboard.badge_champion'), desc: t('leaderboard.badge_champion_desc') },
    { icon: '🔥', key: 'on_fire', name: t('leaderboard.badge_on_fire'), desc: t('leaderboard.badge_on_fire_desc') },
    { icon: '🧠', key: 'mastermind', name: t('leaderboard.badge_mastermind'), desc: t('leaderboard.badge_mastermind_desc') },
    { icon: '⚡', key: 'speed_demon', name: t('leaderboard.badge_speed_demon'), desc: t('leaderboard.badge_speed_demon_desc') },
    { icon: '👥', key: 'team_leader', name: t('leaderboard.badge_team_leader'), desc: t('leaderboard.badge_team_leader_desc') },
    { icon: '🌍', key: 'explorer', name: t('leaderboard.badge_explorer'), desc: t('leaderboard.badge_explorer_desc') },
    { icon: '🎯', key: 'perfectionist', name: t('leaderboard.badge_perfectionist'), desc: t('leaderboard.badge_perfectionist_desc') },
    { icon: '🌙', key: 'night_owl', name: t('leaderboard.badge_night_owl'), desc: t('leaderboard.badge_night_owl_desc') },
    { icon: '🛍️', key: 'collector', name: t('leaderboard.badge_collector'), desc: t('leaderboard.badge_collector_desc') },
  ];

  const badgeStats = useQuery(api.badges.badgeLeaderboard);
  const data = useQuery(api.users.leaderboard, { limit: 100 });
  const mine = useQuery(api.leaderboardScore.myPosition, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');

  const isLoading = data === undefined;
  const list: Player[] = ((period === 'month' ? data?.monthPlayers : data?.players) ?? []) as Player[];
  const me = period === 'month' ? mine?.month : mine?.allTime;
  const stats = data?.stats;

  // Greek month names by hand: Intl gives the genitive ("Νοεμβρίου") on its own
  const monthName = data?.month
    ? language === 'el'
      ? EL_MONTHS[Number(data.month.slice(5, 7)) - 1]
      : new Date(`${data.month}-01T12:00:00`).toLocaleDateString(localeFor(language), { month: 'long' })
    : '';

  const topRooms = (data?.topRooms ?? []).map((r: any, i: number) => ({
    rank: i + 1,
    id: r.id as string,
    name: r.title || 'Untitled',
    venue: r.companyName || r.location || '',
    rating: r.rating ?? 0,
    reviews: r.reviews ?? 0,
    escapeRate: r.escapeRate ?? 0,
  }));

  const statTiles = [
    { Icon: Users, label: t('lb.players_ranked'), value: data?.scores?.length ?? (data ? list.length : null) },
    { Icon: DoorOpen, label: t('leaderboard.total_escapes'), value: stats?.totalEscapes ?? null },
    { Icon: Award, label: t('leaderboard.badges_earned'), value: stats?.totalBadges ?? null },
  ];

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-10 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--color-brand-gold)_14%,transparent),transparent_70%)]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <AnimateIn animation="fadeUp">
            <p className="horror-label mb-3 inline-flex items-center gap-2">
              <span aria-hidden className="h-px w-8 bg-brand-red/60" /> {t('lb.kicker')} <span aria-hidden className="h-px w-8 bg-brand-red/60" />
            </p>
            <h1 className="section-heading mb-4">{t('leaderboard.title')}</h1>
            <p className="text-lg text-brand-text-secondary text-pretty">{t('lb.subtitle')}</p>
          </AnimateIn>
          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
            {statTiles.map(({ Icon, label, value }) => (
              <div key={label} className="panel px-2 py-4">
                <Icon className="w-5 h-5 text-brand-gold mx-auto mb-1.5" />
                <div className="text-xl sm:text-2xl font-display font-bold">{value === null ? '—' : value.toLocaleString()}</div>
                <div className="text-[11px] sm:text-xs text-brand-text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
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

          {activeTab === 'players' && (
            <div>
              {/* Period */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div role="tablist" className="inline-flex rounded-xl border border-brand-border bg-brand-card p-1">
                  {([
                    { id: 'all' as Period, label: t('lb.all_time'), Icon: InfinityIcon },
                    { id: 'month' as Period, label: `${t('lb.this_month')}${monthName ? ` · ${monthName}` : ''}`, Icon: CalendarDays },
                  ]).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={period === id}
                      onClick={() => { setPeriod(id); setShown(20); }}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                        period === id ? 'bg-brand-surface text-brand-bone shadow-[inset_0_0_0_1px_var(--color-brand-border)]' : 'text-brand-text-secondary hover:text-brand-bone'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Your place */}
              <div className="panel p-4 sm:p-5 mb-8 flex flex-wrap items-center gap-4 border-brand-gold/30">
                {!user ? (
                  <Link href="/login" className="flex items-center gap-3 text-brand-text-secondary hover:text-brand-bone">
                    <Info className="w-5 h-5 text-brand-gold" /> {t('lb.login')}
                  </Link>
                ) : mine === undefined ? (
                  <Loader2 className="w-5 h-5 animate-spin text-brand-text-muted" />
                ) : me && me.place ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="w-14 h-14 rounded-xl bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center font-display text-xl font-bold text-brand-gold">
                        #{me.place}
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-brand-text-muted">{t('lb.your_place')}</div>
                        <div className="font-display text-2xl font-bold">
                          {me.score} <span className="text-sm font-sans font-normal text-brand-text-secondary">{t('lb.points')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:ml-auto text-xs">
                      {[
                        { Icon: Stamp, n: me.games, label: t('lb.games') },
                        { Icon: KeyRound, n: me.escapes, label: t('lb.escapes') },
                        { Icon: PenLine, n: me.reviews, label: t('lb.reviews') },
                        { Icon: Award, n: me.badges, label: t('lb.trophies') },
                      ].map(({ Icon, n, label }) => (
                        <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface/60 px-3 py-1.5 text-brand-text-secondary">
                          <Icon className="w-3.5 h-3.5 text-brand-gold" /> <b className="text-brand-bone">{n}</b> {label}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3">
                    <Stamp className="w-5 h-5 text-brand-gold mt-0.5" />
                    <div>
                      <div className="font-medium">{t('lb.not_ranked')}</div>
                      <div className="text-sm text-brand-text-secondary">{t('lb.not_ranked_hint')}</div>
                    </div>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-brand-red-light animate-spin" />
                </div>
              ) : list.length === 0 ? (
                <div className="card p-12 text-center">
                  <Trophy className="w-12 h-12 text-brand-text-muted mx-auto mb-4" />
                  <p className="text-brand-text-secondary">{period === 'month' ? t('lb.empty_month') : t('leaderboard.no_players_yet')}</p>
                </div>
              ) : (
                <>
                  {/* Podium: 2 · 1 · 3 */}
                  <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 mb-8">
                    {[list[1], list[0], list[2]].map((p, i) => {
                      if (!p) return <div key={i} />;
                      const place = ([2, 1, 3] as const)[i];
                      const m = MEDAL[place];
                      return (
                        <Link
                          key={p.id}
                          href={`/u/${p.id}`}
                          className={`panel relative overflow-hidden text-center px-2 sm:px-4 pt-5 ${place === 1 ? 'pb-7 sm:pb-9' : 'pb-5'} bg-linear-to-b ${m.bg} to-transparent hover:-translate-y-1 transition-transform`}
                        >
                          {place === 1 && <Crown className={`w-6 h-6 mx-auto mb-1 ${m.text}`} />}
                          <div className="relative inline-block">
                            <span className={`inline-block rounded-full ring-4 ${m.ring} ring-offset-2 ring-offset-brand-card`}>
                              <Avatar p={p} size={place === 1 ? 'w-16 h-16 sm:w-20 sm:h-20 text-xl' : 'w-12 h-12 sm:w-16 sm:h-16 text-base'} />
                            </span>
                            <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2 text-xs font-bold ${m.label}`}>#{place}</span>
                          </div>
                          <div className="mt-4 font-semibold text-sm sm:text-base truncate">{p.name}</div>
                          {p.title && <div className="text-[11px] text-brand-text-muted truncate">{rankLabel(t, p.title)}</div>}
                          <div className={`mt-2 font-display text-xl sm:text-3xl font-bold ${m.text}`}>{scoreOf(p).toLocaleString()}</div>
                          <div className="text-[11px] text-brand-text-muted">{t('lb.points')}</div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* The rest */}
                  <div className="panel overflow-hidden">
                    <div className="hidden md:grid grid-cols-[56px_1fr_72px_72px_72px_72px_96px] gap-3 px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-brand-text-muted border-b border-brand-border/60">
                      <span className="text-center">#</span>
                      <span>{t('leaderboard.player')}</span>
                      <span className="text-center" title={t('lb.games')}><Stamp className="w-4 h-4 mx-auto" /></span>
                      <span className="text-center" title={t('lb.escapes')}><KeyRound className="w-4 h-4 mx-auto" /></span>
                      <span className="text-center" title={t('lb.reviews')}><PenLine className="w-4 h-4 mx-auto" /></span>
                      <span className="text-center" title={t('lb.trophies')}><Award className="w-4 h-4 mx-auto" /></span>
                      <span className="text-right">{t('lb.score')}</span>
                    </div>
                    {list.slice(0, shown).map((p) => {
                      const isMe = user?.id === p.id;
                      return (
                        <Link
                          key={p.id}
                          href={`/u/${p.id}`}
                          className={`grid grid-cols-[40px_1fr_auto] md:grid-cols-[56px_1fr_72px_72px_72px_72px_96px] gap-3 px-3 sm:px-4 py-3 items-center border-t border-brand-border/30 first:border-t-0 transition-colors hover:bg-brand-surface/40 ${
                            isMe ? 'bg-brand-gold/10 shadow-[inset_3px_0_0_var(--color-brand-gold)]' : ''
                          }`}
                        >
                          <span className={`text-center font-display font-bold ${p.rank <= 3 ? MEDAL[p.rank as 1 | 2 | 3].text : 'text-brand-text-muted'}`}>
                            {p.rank}
                          </span>
                          <span className="flex items-center gap-3 min-w-0">
                            <Avatar p={p} size="w-9 h-9 text-sm shrink-0" />
                            <span className="min-w-0">
                              <span className="block font-medium text-sm truncate">
                                {p.name}
                                {isMe && <span className="ml-2 rounded-sm bg-brand-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-gold">{t('lb.you')}</span>}
                              </span>
                              <span className="block text-[11px] text-brand-text-muted truncate">
                                {p.title ? rankLabel(t, p.title) : ''}
                                <span className="md:hidden">
                                  {p.title ? ' · ' : ''}
                                  {p.games ?? p.played} {t('lb.games').toLowerCase()} · {p.escapes ?? p.escaped} {t('lb.escapes').toLowerCase()}
                                </span>
                              </span>
                            </span>
                          </span>
                          <span className="hidden md:block text-center text-sm text-brand-text-secondary">{p.games ?? p.played}</span>
                          <span className="hidden md:block text-center text-sm text-brand-text-secondary">{p.escapes ?? p.escaped}</span>
                          <span className="hidden md:block text-center text-sm text-brand-text-secondary">{p.reviews ?? 0}</span>
                          <span className="hidden md:block text-center text-sm text-brand-text-secondary">{p.badges}</span>
                          <span className="text-right font-display text-lg font-bold text-brand-bone">{scoreOf(p).toLocaleString()}</span>
                        </Link>
                      );
                    })}
                  </div>
                  {list.length > shown && (
                    <div className="mt-4 text-center">
                      <button onClick={() => setShown((n) => n + 30)} className="btn-outline inline-flex items-center gap-2 py-2!">
                        {t('lb.show_more')} <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* How points work */}
              <div className="mt-14">
                <h2 className="font-display text-2xl sm:text-3xl font-bold">{t('lb.how_title')}</h2>
                <p className="text-brand-text-secondary mt-1 mb-6">{t('lb.how_sub')}</p>
                <StaggerContainer stagger={0.05} className="grid gap-3 sm:grid-cols-2">
                  {SCORE_RULES.filter((r) => PASSPORT_ENABLED || (r.key !== 'lb.rule_game' && r.key !== 'lb.rule_escape')).map(({ pts, key, Icon }) => (
                    <StaggerItem key={key} animation="fadeUp">
                      <div className="panel flex items-center gap-4 p-4 h-full">
                        <span className="shrink-0 w-14 h-14 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex flex-col items-center justify-center leading-none">
                          <span className="font-display text-xl font-bold text-brand-gold">+{pts}</span>
                        </span>
                        <span className="flex items-start gap-2 text-sm text-brand-text-secondary">
                          <Icon className="w-4 h-4 mt-0.5 shrink-0 text-brand-text-muted" /> {t(key)}
                        </span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
                <ul className="mt-5 space-y-1.5 text-xs text-brand-text-muted">
                  {PASSPORT_ENABLED && <li className="flex gap-2"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {t('lb.note_manual')}</li>}
                  <li className="flex gap-2"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {t('lb.note_refresh')}</li>
                </ul>
              </div>
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
                  <Link key={room.rank} href={`/rooms/${room.id}`} className="card p-5 flex items-center gap-4 hover:border-brand-red/30">
                    <span className={`w-10 text-center font-display text-xl font-bold ${room.rank <= 3 ? MEDAL[room.rank as 1 | 2 | 3].text : 'text-brand-text-muted'}`}>
                      {room.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{room.name}</h3>
                      <p className="text-sm text-brand-text-muted">{room.venue}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />
                        <span className="font-medium">{room.rating}</span>
                        <span className="text-brand-text-muted">({room.reviews})</span>
                      </div>
                      <div className="hidden sm:block text-brand-text-muted text-xs">
                        {room.escapeRate}% {t('leaderboard.escape_rate')}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Trophies */}
          {activeTab === 'teams' && (
            <StaggerContainer stagger={0.08} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge, i) => {
                const stat = badgeStats?.find((s) => s.key === badge.key);
                const earnedCount = stat?.earnedCount ?? 0;
                return (
                  <StaggerItem key={i} animation="scaleUp">
                    <div className="card p-5 text-center hover:border-brand-gold/30 group">
                      <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">{badge.icon}</span>
                      <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                      <p className="text-xs text-brand-text-muted mb-2">{badge.desc}</p>
                      <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
                        <Award className="w-3 h-3" />
                        {earnedCount} {t('leaderboard.players_earned')} · +5 {t('lb.points')}
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>
      </section>
    </>
  );
}
