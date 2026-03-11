'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCompanyAuth, useCompanyPath } from '@/lib/companyAuth';
import Link from 'next/link';
import {
  DoorOpen,
  CalendarDays,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  Lock,
  BarChart3,
  CheckCircle,
  XCircle,
  Star,
  Percent,
  CreditCard,
  Crown,
  Zap,
  Eye,
  Settings,
  Sparkles,
  ArrowUpRight,
  Circle,
  Code,
  Target,
  Repeat,
  Timer,
  MessageSquare,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t('company.greeting.morning');
  if (h < 18) return t('company.greeting.afternoon');
  return t('company.greeting.evening');
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CompanyDashboardPage() {
  const { t } = useTranslation();
  const { company } = useCompanyAuth();
  const p = useCompanyPath();
  const companyId = company?.id;

  const today = new Date().toISOString().split('T')[0];

  const stats = useQuery(
    api.companies.getDashboardStats,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const todayStats = useQuery(
    api.companies.getTodayStats,
    companyId ? { companyId: companyId as any, date: today } : 'skip'
  );

  const todayBookings = useQuery(
    api.companies.getBookingsByDate,
    companyId ? { companyId: companyId as any, date: today } : 'skip'
  );

  const plan = (stats as any)?.plan || company?.platformPlan || 'starter';
  const PLAN_ROOM_LIMITS: Record<string, number> = { free: 1, starter: 1, pro: 10, enterprise: Infinity };
  const roomLimit = PLAN_ROOM_LIMITS[plan] || 3;
  const roomCount = stats?.totalRooms ?? 0;
  const atLimit = roomCount >= roomLimit;
  const activeRooms = stats?.activeRooms ?? 0;

  // Onboarding banner
  const onboardingStatus = company?.onboardingStatus;
  if (onboardingStatus && onboardingStatus !== 'approved') {
    return <OnboardingBanner status={onboardingStatus} companyId={companyId!} />;
  }

  const upcomingCount = todayBookings?.filter((b: any) => b.status === 'upcoming').length ?? 0;
  const completedCount = todayBookings?.filter((b: any) => b.status === 'completed').length ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Hero Header ── */}
      <AnimateIn animation="fadeUp">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-surface via-brand-surface to-brand-red/5 border border-white/5 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-brand-text-secondary mb-1">{formatDate()}</p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting(t)}, <span className="text-brand-red">{company?.name}</span>
            </h1>
            <p className="text-brand-text-secondary mt-1.5 text-sm">
              {todayBookings
                ? todayBookings.length > 0
                  ? `${t('company.dashboard.you_have')} ${todayBookings.length} ${todayBookings.length !== 1 ? t('company.dashboard.bookings_plural') : t('company.dashboard.booking_singular')} ${t('company.dashboard.today')} — ${upcomingCount} ${t('company.dashboard.upcoming')}, ${completedCount} ${t('company.dashboard.completed')}`
                  : t('company.dashboard.no_bookings_today')
                : t('company.dashboard.loading_schedule')}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href={p('/company/bookings')} className="btn-ghost text-sm flex items-center gap-2 !py-2.5 !px-4">
              <CalendarDays className="w-4 h-4" /> {t('company.nav.bookings')}
            </Link>
            {atLimit ? (
              <div className="flex items-center gap-2 text-sm text-brand-text-secondary bg-brand-bg border border-white/5 rounded-xl px-4 py-2.5">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span>{t('company.dashboard.room_limit')}</span>
              </div>
            ) : (
              <Link href={p('/company/rooms/new')} className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t('company.dashboard.add_room')}
              </Link>
            )}
          </div>
        </div>
      </div>
      </AnimateIn>

      {/* ── Today&apos;s Metrics (live pulse) ── */}
      <StaggerContainer stagger={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={CalendarDays}
          label={t('company.dashboard.todays_bookings')}
          value={todayStats?.totalBookings ?? '-'}
          accent="blue"
          detail={upcomingCount > 0 ? `${upcomingCount} ${t('company.dashboard.upcoming')}` : undefined}
        />
        <MetricCard
          icon={DollarSign}
          label={t('company.dashboard.todays_revenue')}
          value={todayStats ? `€${todayStats.revenue.toFixed(0)}` : '-'}
          accent="green"
          detail={todayStats && todayStats.revenue > 0 ? t('company.dashboard.from_bookings') : undefined}
        />
        <MetricCard
          icon={Eye}
          label={t('company.dashboard.available_slots')}
          value={todayStats?.availableSlots ?? '-'}
          accent="yellow"
          detail={t('company.dashboard.remaining_today')}
        />
        <MetricCard
          icon={Activity}
          label={t('company.dashboard.active_rooms')}
          value={`${activeRooms}/${roomCount}`}
          accent="red"
          detail={roomLimit !== Infinity ? `${roomLimit} max (${plan})` : `${plan} ${t('company.plan.plan_label')}`}
        />
      </StaggerContainer>

      {/* ── Split: Overview + Schedule ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Overview Stats */}
        <AnimateIn animation="fadeRight" className="lg:col-span-2 space-y-4">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-red" /> {t('company.dashboard.overview')}
              </h2>
              <span className="text-xs text-brand-text-secondary">{t('company.dashboard.all_time')}</span>
            </div>
            <div className="space-y-4">
              <OverviewRow
                icon={DoorOpen}
                label={t('company.nav.rooms')}
                value={String(roomCount)}
                sub={roomLimit !== Infinity ? `${t('company.dashboard.of')} ${roomLimit}` : t('company.dashboard.unlimited')}
                color="text-purple-400"
                progress={roomLimit !== Infinity ? (roomCount / roomLimit) * 100 : undefined}
              />
              <OverviewRow
                icon={CalendarDays}
                label={t('company.dashboard.total_bookings')}
                value={String(stats?.totalBookings ?? 0)}
                color="text-cyan-400"
              />
              <OverviewRow
                icon={DollarSign}
                label={t('company.dashboard.revenue')}
                value={stats ? `€${stats.totalRevenue.toFixed(0)}` : '€0'}
                color="text-emerald-400"
              />
              <OverviewRow
                icon={CheckCircle}
                label={t('company.dashboard.completed')}
                value={String(stats?.advanced?.completedBookings ?? 0)}
                sub={t('company.dashboard.bookings_plural')}
                color="text-orange-400"
              />
              <OverviewRow
                icon={CalendarDays}
                label={t('company.dashboard.upcoming')}
                value={String(stats?.upcomingBookings ?? 0)}
                sub={t('company.dashboard.bookings_plural')}
                color="text-blue-400"
              />
            </div>
          </div>

          {/* Room Capacity Card */}
          {roomLimit !== Infinity && (
            <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-brand-text-secondary mb-3">{t('company.dashboard.room_capacity')}</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                      strokeDasharray={`${(roomCount / roomLimit) * 100} ${100 - (roomCount / roomLimit) * 100}`}
                      strokeLinecap="round"
                      className={atLimit ? 'text-yellow-500' : 'text-brand-red'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{roomCount}/{roomLimit}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{roomCount} {t('company.dashboard.of')} {roomLimit} {t('company.dashboard.rooms_used')}</p>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    {atLimit ? t('company.dashboard.upgrade_to_add') : `${roomLimit - roomCount} ${roomLimit - roomCount !== 1 ? t('company.dashboard.rooms_available') : t('company.dashboard.room_available')}`}
                  </p>
                  {atLimit && (
                    <Link href={p('/company/settings')} className="text-xs text-brand-red hover:underline mt-1 inline-block">
                      {t('company.dashboard.upgrade_plan')} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimateIn>

        {/* Right: Today&apos;s Schedule */}
        <AnimateIn animation="fadeLeft" delay={0.2} className="lg:col-span-3">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-red" /> {t('company.dashboard.todays_schedule')}
              </h2>
              <Link href={p('/company/bookings')} className="text-xs text-brand-red hover:underline flex items-center gap-1">
                {t('company.dashboard.view_all')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {!todayBookings ? (
              <div className="text-center py-12 text-brand-text-secondary text-sm">{t('company.dashboard.loading')}</div>
            ) : todayBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-brand-text-secondary/20" />
                <p className="text-brand-text-secondary text-sm">{t('company.dashboard.no_bookings_for_today')}</p>
                <Link href={p('/company/bookings')} className="text-xs text-brand-red hover:underline mt-2 inline-block">
                  {t('company.dashboard.go_to_bookings')} →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {todayBookings.map((booking: any, idx: number) => (
                  <div
                    key={booking._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg/50 border border-white/[0.03] hover:border-white/10 transition-colors group"
                  >
                    {/* Time column */}
                    <div className="relative flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                        booking.status === 'completed'
                          ? 'bg-green-500/10 text-green-400'
                          : booking.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-brand-red/10 text-brand-red'
                      }`}>
                        {booking.time}
                      </div>
                      {idx < todayBookings.length - 1 && (
                        <div className="w-px h-3 bg-white/5 mt-1" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{booking.roomTitle}</p>
                      <p className="text-xs text-brand-text-secondary mt-0.5">
                        {booking.playerName} · {booking.players} {t('company.dashboard.players')}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        booking.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400'
                          : booking.status === 'completed'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {booking.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        booking.source === 'external'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-brand-red/10 text-brand-red'
                      }`}>
                        {booking.source === 'external' ? t('company.dashboard.external') : 'UNLOCKED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimateIn>
      </div>

      {/* ── Advanced Analytics (Pro+) ── */}
      {(stats as any)?.advanced && (
        <AnimateIn animation="fadeUp">
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold">{t('company.dashboard.advanced_analytics')}</h2>
            <span className="text-[10px] bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">{t('company.plan.pro')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <MiniStat icon={CheckCircle} label={t('company.dashboard.completed')} value={(stats as any).advanced.completedBookings} color="text-green-400" />
            <MiniStat icon={XCircle} label={t('company.dashboard.cancelled')} value={(stats as any).advanced.cancelledBookings} color="text-red-400" />
            <MiniStat icon={Star} label={t('company.dashboard.avg_rating')} value={(stats as any).advanced.avgRating || '—'} color="text-yellow-400" />
            <MiniStat icon={Percent} label={t('company.dashboard.conversion')} value={`${(stats as any).advanced.conversionRate}%`} color="text-cyan-400" />
            <MiniStat icon={CreditCard} label={t('company.dashboard.avg_per_booking')} value={`€${(stats as any).advanced.avgRevenuePerBooking}`} color="text-emerald-400" />
          </div>
        </div>
        </AnimateIn>
      )}

      {/* ── Enterprise Analytics ── */}
      {(stats as any)?.fullAnalytics && (() => {
        const fa = (stats as any).fullAnalytics;
        return (
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold">{t('company.dashboard.enterprise_insights')}</h2>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">{t('company.plan.enterprise')}</span>
          </div>

          {/* Row 1: Key Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <MiniStat icon={Users} label={t('company.dashboard.unique_players')} value={fa.totalUniquePlayers} color="text-purple-400" />
            <MiniStat icon={Users} label={t('company.dashboard.total_players_served')} value={fa.totalPlayersServed} color="text-blue-400" />
            <MiniStat icon={Users} label={t('company.dashboard.avg_group_size')} value={fa.avgGroupSize} color="text-cyan-400" />
            <MiniStat icon={Repeat} label={t('company.dashboard.repeat_customers')} value={`${fa.repeatCustomerRate}%`} color="text-amber-400" />
            <MiniStat icon={Target} label={t('company.dashboard.escape_rate')} value={`${fa.escapeRate}%`} color="text-emerald-400" />
          </div>

          {/* Row 2: Insights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/[0.03]">
              <Clock className="w-4 h-4 text-orange-400 mb-2" />
              <p className="text-lg font-bold">{fa.peakTime}</p>
              <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.peak_time')}</p>
            </div>
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/[0.03]">
              <CalendarDays className="w-4 h-4 text-pink-400 mb-2" />
              <p className="text-lg font-bold">{fa.peakDay}</p>
              <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.peak_day')}</p>
            </div>
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/[0.03]">
              <MessageSquare className="w-4 h-4 text-yellow-400 mb-2" />
              <p className="text-lg font-bold">{fa.totalReviews}</p>
              <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.total_reviews')}</p>
            </div>
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/[0.03]">
              <Code className="w-4 h-4 text-teal-400 mb-2" />
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold">{fa.platformBookings}</p>
                <span className="text-[10px] text-brand-text-secondary">/</span>
                <p className="text-sm font-semibold text-brand-text-secondary">{fa.widgetBookings}</p>
              </div>
              <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.platform_vs_widget')}</p>
            </div>
          </div>

          {/* Row 3: Subscribers + Revenue per Room */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-brand-bg/50 rounded-xl p-4 border border-white/[0.03]">
              <p className="text-2xl font-bold">{fa.totalSubscribers}</p>
              <p className="text-xs text-brand-text-secondary mt-1">{t('company.dashboard.total_subscribers')}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Circle className="w-2 h-2 fill-current" /> {fa.activeSubscribers} {t('company.dashboard.active')}
                </span>
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <Circle className="w-2 h-2 fill-current" /> {fa.churnedSubscribers} {t('company.dashboard.churned')}
                </span>
              </div>
            </div>
            {fa.revenuePerRoom?.slice(0, 2).map((r: any) => (
              <div key={r.roomId} className="bg-brand-bg/50 rounded-xl p-4 border border-white/[0.03]">
                <p className="text-lg font-bold text-emerald-400">€{r.revenue}</p>
                <p className="text-xs text-brand-text-secondary mt-1 truncate">{r.title}</p>
                <p className="text-[10px] text-brand-text-secondary mt-2">{t('company.dashboard.revenue_from_room')}</p>
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {/* ── Analytics Upsell (Starter) ── */}
      {plan === 'starter' && stats && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-surface to-brand-red/5 border border-white/5 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-brand-red" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{t('company.dashboard.unlock_analytics')}</h3>
              <p className="text-sm text-brand-text-secondary mt-0.5">
                {t('company.dashboard.unlock_analytics_desc')}
              </p>
            </div>
            <Link href={p('/company/settings')} className="btn-primary text-sm shrink-0 flex items-center gap-1.5">
              {t('company.dashboard.upgrade')} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-red" /> {t('company.dashboard.quick_actions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickAction
            href={p('/company/rooms/new')}
            icon={Plus}
            label={t('company.dashboard.add_room')}
            desc={t('company.dashboard.new_escape_room')}
            color="text-brand-red"
            disabled={atLimit}
          />
          <QuickAction
            href={p('/company/bookings')}
            icon={CalendarDays}
            label={t('company.nav.bookings')}
            desc={t('company.dashboard.manage_reservations')}
            color="text-blue-400"
          />
          <QuickAction
            href={p('/company/rooms')}
            icon={DoorOpen}
            label={t('company.nav.rooms')}
            desc={t('company.dashboard.edit_listings')}
            color="text-purple-400"
          />
          <QuickAction
            href={p('/company/settings')}
            icon={Settings}
            label={t('company.nav.settings')}
            desc={t('company.dashboard.plan_preferences')}
            color="text-green-400"
          />
          <QuickAction
            href={p('/company/settings?tab=widget')}
            icon={Code}
            label={t('company.dashboard.widget_title')}
            desc={t('company.dashboard.widget_desc')}
            color="text-orange-400"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Metric Card ── */
function MetricCard({ icon: Icon, label, value, accent, detail }: {
  icon: any; label: string; value: string | number; accent: string; detail?: string;
}) {
  const colors: Record<string, { bg: string; text: string; glow: string }> = {
    blue:   { bg: 'bg-blue-500/10',    text: 'text-blue-400',    glow: 'shadow-blue-500/5' },
    green:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
    yellow: { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  glow: 'shadow-yellow-500/5' },
    red:    { bg: 'bg-brand-red/10',   text: 'text-brand-red',   glow: 'shadow-red-500/5' },
  };
  const c = colors[accent] || colors.blue;

  return (
    <StaggerItem>
    <div className={`bg-brand-surface rounded-2xl border border-white/5 p-4 shadow-lg ${c.glow} hover:-translate-y-0.5 transition-transform duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${c.text}`} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-brand-text-secondary mt-1">{label}</p>
      {detail && <p className="text-[10px] text-brand-text-secondary/60 mt-0.5">{detail}</p>}
    </div>
    </StaggerItem>
  );
}

/* ── Overview Row ── */
function OverviewRow({ icon: Icon, label, value, sub, color, progress }: {
  icon: any; label: string; value: string; sub?: string; color: string; progress?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm text-brand-text-secondary">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold">{value}</span>
          {sub && <span className="text-[10px] text-brand-text-secondary ml-1">{sub}</span>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-yellow-500' : 'bg-brand-red'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Mini Stat (for analytics rows) ── */
function MiniStat({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/[0.03]">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-brand-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

/* ── Quick Action Link ── */
function QuickAction({ href, icon: Icon, label, desc, color, disabled }: {
  href: string; icon: any; label: string; desc: string; color: string; disabled?: boolean;
}) {
  const { t } = useTranslation();
  if (disabled) {
    return (
      <div className="p-4 rounded-2xl bg-brand-surface/50 border border-white/5 opacity-50 cursor-not-allowed">
        <Lock className="w-5 h-5 text-brand-text-secondary mb-2" />
        <p className="text-sm font-medium text-brand-text-secondary">{label}</p>
        <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.limit_reached')}</p>
      </div>
    );
  }
  return (
    <Link href={href} className="p-4 rounded-2xl bg-brand-surface border border-white/5 hover:border-brand-red/30 transition-all group">
      <Icon className={`w-5 h-5 ${color} mb-2 group-hover:scale-110 transition-transform`} />
      <p className="text-sm font-medium group-hover:text-brand-red transition-colors">{label}</p>
      <p className="text-[10px] text-brand-text-secondary mt-0.5">{desc}</p>
    </Link>
  );
}

function OnboardingBanner({
  status,
  companyId,
}: {
  status: string;
  companyId: string;
}) {
  const { t } = useTranslation();
  const acceptTerms = useMutation(api.companies.acceptTerms);
  const selectPlan = useMutation(api.companies.selectPlan);
  const resubmit = useMutation(api.companies.resubmitForReview);

  if (status === 'pending_terms') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto mt-12">
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('company.onboarding.welcome')}</h1>
          <p className="text-brand-text-secondary mb-6">
            {t('company.onboarding.terms_intro')}
          </p>
          <div className="bg-brand-bg rounded-xl p-4 mb-6 text-left text-sm text-brand-text-secondary max-h-48 overflow-y-auto">
            <p className="font-semibold text-white mb-2">{t('company.onboarding.terms_title')}</p>
            <p>
              {t('company.onboarding.terms_body')}
            </p>
          </div>
          <button
            onClick={() => acceptTerms({ companyId: companyId as any })}
            className="btn-primary !py-3 px-8"
          >
            {t('company.onboarding.accept_terms')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending_plan') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto mt-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{t('company.onboarding.choose_plan')}</h1>
          <p className="text-brand-text-secondary mt-2">
            {t('company.onboarding.choose_plan_desc')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: t('company.plan.starter'),
              value: 'starter' as const,
              price: t('company.onboarding.free'),
              features: [t('company.onboarding.starter_f1'), t('company.onboarding.starter_f2'), t('company.onboarding.starter_f3')],
            },
            {
              name: t('company.plan.pro'),
              value: 'pro' as const,
              price: '€98/' + t('company.onboarding.mo'),
              features: [
                t('company.onboarding.pro_f1'),
                t('company.onboarding.pro_f2'),
                t('company.onboarding.pro_f3'),
                t('company.onboarding.pro_f4'),
              ],
              popular: true,
            },
            {
              name: t('company.plan.enterprise'),
              value: 'enterprise' as const,
              price: '€198/' + t('company.onboarding.mo'),
              features: [
                t('company.onboarding.ent_f1'),
                t('company.onboarding.ent_f2'),
                t('company.onboarding.ent_f3'),
                t('company.onboarding.ent_f4'),
                t('company.onboarding.ent_f5'),
                t('company.onboarding.ent_f6'),
                t('company.onboarding.ent_f7'),
                t('company.onboarding.ent_f8'),
                t('company.onboarding.ent_f9'),
              ],
            },
          ].map((plan) => (
            <div
              key={plan.value}
              className={`bg-brand-surface rounded-2xl border p-6 ${
                plan.popular
                  ? 'border-brand-red ring-1 ring-brand-red/20'
                  : 'border-white/5'
              }`}
            >
              {plan.popular && (
                <span className="text-xs bg-brand-red text-white px-3 py-1 rounded-full font-medium">
                  {t('company.onboarding.most_popular')}
                </span>
              )}
              <h3 className="text-xl font-bold mt-3">{plan.name}</h3>
              <p className="text-2xl font-bold text-brand-red mt-2">
                {plan.price}
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-brand-text-secondary flex items-center gap-2"
                  >
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  selectPlan({
                    companyId: companyId as any,
                    plan: plan.value,
                  })
                }
                className={`w-full mt-6 py-2.5 rounded-xl font-medium transition-all ${
                  plan.popular
                    ? 'btn-primary'
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                {t('company.onboarding.select')} {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'pending_review') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto mt-12">
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('company.onboarding.under_review')}</h1>
          <p className="text-brand-text-secondary">
            {t('company.onboarding.under_review_desc')}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto mt-12">
        <div className="bg-brand-surface rounded-2xl border border-red-500/20 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✗</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('company.onboarding.declined')}</h1>
          <p className="text-brand-text-secondary mb-6">
            {t('company.onboarding.declined_desc')}
          </p>
          <button
            onClick={() => resubmit({ companyId: companyId as any })}
            className="btn-primary !py-3 px-8"
          >
            {t('company.onboarding.resubmit')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
