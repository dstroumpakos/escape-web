'use client';

import { useEffect, useState } from 'react';
import { useCompanyQuery, useCompanyAuth, useCompanyPath, uiLocale, localDateKey } from '@/lib/companyAuth';
import { api } from '../../../convex/_generated/api';
import { BOOKING_ENABLED } from '@/lib/features';
import { BookClicksCard } from '@/components/company/BookClicksCard';
import { roomLimitFor } from '@/lib/plans';
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
  MessageSquare,
  Globe,
  Check,
  Building2,
  Image as ImageIcon,
  X,
  Rocket,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import { DashboardBookingCalendar } from '@/components/company/BookingCalendar';
import { statusLabel, WIDGET_COPIED, readFlag } from '@/lib/companyUi';

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t('company.greeting.morning');
  if (h < 18) return t('company.greeting.afternoon');
  return t('company.greeting.evening');
}

const CHECKLIST_DISMISSED = 'unlocked_checklist_dismissed';

export default function CompanyDashboardPage() {
  const { t, language } = useTranslation();
  const { company } = useCompanyAuth();
  const p = useCompanyPath();
  const companyId = company?.id;

  const today = localDateKey();

  const stats = useCompanyQuery(
    api.companies.getDashboardStats,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const todayStats = useCompanyQuery(
    api.companies.getTodayStats,
    companyId ? { companyId: companyId as any, date: today } : 'skip'
  );

  const todayBookings = useCompanyQuery(
    api.companies.getBookingsByDate,
    companyId ? { companyId: companyId as any, date: today } : 'skip'
  );

  const rooms = useCompanyQuery(api.companies.getRooms, companyId ? { companyId: companyId as any } : 'skip');
  const companyData = useCompanyQuery(api.companies.getById, companyId ? { id: companyId as any } : 'skip');

  const [checklistDismissed, setChecklistDismissed] = useState(true);
  const [widgetCopied, setWidgetCopied] = useState(false);
  useEffect(() => {
    setChecklistDismissed(readFlag(CHECKLIST_DISMISSED));
    setWidgetCopied(readFlag(WIDGET_COPIED));
  }, []);

  const plan = (stats as any)?.plan || company?.platformPlan || 'starter';
  const roomLimit = roomLimitFor(plan, (stats as any)?.roomLimit);
  const roomCount = stats?.totalRooms ?? 0;
  const atLimit = roomCount >= roomLimit;
  const activeRooms = stats?.activeRooms ?? 0;

  const bookableRooms = (rooms || []).filter((r: any) => !r.photosOnly && r.isActive !== false);

  const upcomingCount = todayBookings?.filter((b: any) => b.status === 'upcoming').length ?? 0;
  const completedCount = todayBookings?.filter((b: any) => b.status === 'completed').length ?? 0;

  // ── Getting started checklist ──
  const cd: any = companyData;
  const realRooms = (rooms || []).filter((r: any) => !r.photosOnly);
  const steps = [
    {
      key: 'profile',
      done: !!(cd?.phone && cd?.address && cd?.city && cd?.description),
      label: t('cx.start.profile'),
      desc: t('cx.start.profile_desc'),
      href: p('/company/settings'),
      icon: Building2,
    },
    {
      key: 'room',
      done: realRooms.length > 0,
      label: t('cx.start.room'),
      desc: t('cx.start.room_desc'),
      href: p('/company/rooms/new'),
      icon: DoorOpen,
    },
    {
      key: 'photo',
      done: realRooms.some((r: any) => r.image && !String(r.image).startsWith('/placeholder')),
      label: t('cx.start.photo'),
      desc: t('cx.start.photo_desc'),
      href: realRooms[0] ? p(`/company/rooms/${realRooms[0]._id}/edit`) : p('/company/rooms/new'),
      icon: ImageIcon,
    },
    {
      key: 'times',
      done: realRooms.some((r: any) => (r.defaultTimeSlots || []).length > 0),
      label: t('cx.start.times'),
      desc: t('cx.start.times_desc'),
      href: realRooms[0] ? p(`/company/rooms/${realRooms[0]._id}/edit`) : p('/company/rooms/new'),
      icon: Clock,
    },
    {
      key: 'widget',
      done: widgetCopied,
      label: t('cx.start.widget'),
      desc: t('cx.start.widget_desc'),
      href: p('/company/settings?tab=widget'),
      icon: Code,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const showChecklist = !!companyData && rooms !== undefined && !checklistDismissed && doneCount < steps.length;

  const dismissChecklist = () => {
    setChecklistDismissed(true);
    try {
      localStorage.setItem(CHECKLIST_DISMISSED, '1');
    } catch {}
  };

  const dateLine = new Date().toLocaleDateString(uiLocale(language), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Hero Header ── */}
      <AnimateIn animation="fadeUp">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-surface via-brand-surface to-brand-red/5 border border-white/5 p-5 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-brand-text-secondary mb-1 capitalize">{dateLine}</p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting(t)}, <span className="text-brand-red-light">{company?.name}</span>
            </h1>
            <p className="text-brand-text-secondary mt-1.5 text-sm">
              {todayBookings
                ? todayBookings.length > 0
                  ? `${t('company.dashboard.you_have')} ${todayBookings.length} ${todayBookings.length !== 1 ? t('company.dashboard.bookings_plural') : t('company.dashboard.booking_singular')} ${t('company.dashboard.today')} · ${upcomingCount} ${t('company.dashboard.upcoming')}, ${completedCount} ${t('company.dashboard.completed')}`
                  : t('company.dashboard.no_bookings_today')
                : t('company.dashboard.loading_schedule')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
            <Link href={p('/company/slots')} className="btn-ghost text-sm flex items-center gap-2 py-2.5! px-4!">
              <Clock className="w-4 h-4" /> {t('cx.nav.slots')}
            </Link>
            {atLimit ? (
              <Link
                href={p('/company/billing')}
                className="flex items-center gap-2 text-sm text-brand-text-secondary bg-brand-bg border border-white/5 rounded-xl px-4 py-2.5 hover:border-yellow-500/30"
              >
                <Lock className="w-4 h-4 text-yellow-400" />
                <span>{t('company.dashboard.room_limit')}</span>
              </Link>
            ) : (
              <Link href={p('/company/rooms/new')} className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t('company.dashboard.add_room')}
              </Link>
            )}
          </div>
        </div>
      </div>
      </AnimateIn>

      {/* ── Getting started ── */}
      {showChecklist && (
        <div className="bg-brand-surface rounded-2xl border border-brand-red/20 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold flex items-center gap-2">
                <Rocket className="w-4 h-4 text-brand-red-light" /> {t('cx.start.title')}
              </h2>
              <p className="text-sm text-brand-text-secondary mt-0.5">
                {t('cx.start.progress', { done: String(doneCount), total: String(steps.length) })}
              </p>
            </div>
            <button
              onClick={dismissChecklist}
              className="p-1.5 rounded-lg text-brand-text-secondary hover:text-white hover:bg-white/5"
              aria-label={t('cx.start.hide')}
              title={t('cx.start.hide')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-brand-red rounded-full transition-all"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {steps.map((s, i) => {
              const isNext = !s.done && steps.findIndex((x) => !x.done) === i;
              return (
                <Link
                  key={s.key}
                  href={s.href}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    s.done
                      ? 'border-white/5 bg-brand-bg/40 opacity-60'
                      : isNext
                      ? 'border-brand-red/30 bg-brand-red/5 hover:bg-brand-red/10'
                      : 'border-white/5 bg-brand-bg/60 hover:border-white/15'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      s.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-brand-text-secondary'
                    }`}
                  >
                    {s.done ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${s.done ? 'line-through' : ''}`}>{s.label}</p>
                    {!s.done && <p className="text-xs text-brand-text-secondary mt-0.5">{s.desc}</p>}
                  </div>
                  {isNext && <ArrowRight className="w-4 h-4 text-brand-red-light ml-auto mt-1 shrink-0" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Players sent to their own site by "Book now" (externalLinks.ts) ── */}
      {!BOOKING_ENABLED && companyId && <BookClicksCard companyId={companyId} />}

      {/* ── Bookings calendar: rooms side by side, tap a time to book it ── */}
      {bookableRooms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-red-light" /> {t('cx.bcal.dash_title')}
            </h2>
            <Link href={p('/company/bookings')} className="text-xs text-brand-red-light hover:underline flex items-center gap-1">
              {t('cx.bcal.open_bookings')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <DashboardBookingCalendar rooms={rooms || []} companyId={companyId} />
        </div>
      )}

      {/* ── Today's Metrics (live pulse) ── */}
      <StaggerContainer stagger={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
          detail={
            roomLimit !== Infinity
              ? t('cx.dashboard.max_rooms', { limit: String(roomLimit), plan: t(`company.onboarding.plan_${plan}`) })
              : `${t(`company.onboarding.plan_${plan}`)} ${t('company.plan.plan_label')}`
          }
        />
      </StaggerContainer>

      {/* ── Split: Overview + Schedule ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Overview Stats */}
        <AnimateIn animation="fadeRight" className="lg:col-span-2 space-y-4">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-red-light" /> {t('company.dashboard.overview')}
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
                      strokeDasharray={`${Math.min(roomCount / roomLimit, 1) * 100} ${100 - Math.min(roomCount / roomLimit, 1) * 100}`}
                      strokeLinecap="round"
                      className={atLimit ? 'text-yellow-500' : 'text-brand-red-light'}
                      stroke="currentColor"
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
                    <Link href={p('/company/billing')} className="text-xs text-brand-red-light hover:underline mt-1 inline-block">
                      {t('company.dashboard.upgrade_plan')} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimateIn>

        {/* Right: Today's Schedule */}
        <AnimateIn animation="fadeLeft" delay={0.2} className="lg:col-span-3">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-brand-red-light" /> {t('company.dashboard.todays_schedule')}
              </h2>
              <Link href={p('/company/bookings')} className="text-xs text-brand-red-light hover:underline flex items-center gap-1">
                {t('company.dashboard.view_all')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {!todayBookings ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : todayBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-brand-text-secondary/20" />
                <p className="text-brand-text-secondary text-sm">{t('company.dashboard.no_bookings_for_today')}</p>
                <Link href={p('/company/bookings')} className="text-xs text-brand-red-light hover:underline mt-2 inline-block">
                  {t('company.dashboard.go_to_bookings')}
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {todayBookings.map((booking: any) => (
                  <Link
                    key={booking._id}
                    href={p(`/company/bookings?date=${today}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg/50 border border-white/3 hover:border-white/10 transition-colors"
                  >
                    <div className={`w-14 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      booking.status === 'completed'
                        ? 'bg-green-500/10 text-green-400'
                        : booking.status === 'cancelled'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-brand-red/10 text-brand-red-light'
                    }`}>
                      {booking.time}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{booking.roomTitle}</p>
                      <p className="text-xs text-brand-text-secondary mt-0.5 truncate">
                        {booking.playerName} · {booking.players} {t('company.dashboard.players')}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        booking.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400'
                          : booking.status === 'completed'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {statusLabel(t, booking.status)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        booking.source === 'external'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-brand-red/10 text-brand-red-light'
                      }`}>
                        {booking.source === 'external' ? t('company.dashboard.external') : 'UNLOCKED'}
                      </span>
                    </div>
                  </Link>
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
            <BarChart3 className="w-5 h-5 text-brand-red-light" />
            <h2 className="font-bold">{t('company.dashboard.advanced_analytics')}</h2>
            <span className="text-[10px] bg-brand-red/10 text-brand-red-light px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">{t('company.plan.pro')}</span>
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
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/3">
              <Clock className="w-4 h-4 text-orange-400 mb-2" />
              <p className="text-lg font-bold">{fa.peakTime}</p>
              <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.peak_time')}</p>
            </div>
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/3">
              <CalendarDays className="w-4 h-4 text-pink-400 mb-2" />
              <p className="text-lg font-bold">{fa.peakDay}</p>
              <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.peak_day')}</p>
            </div>
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/3">
              <MessageSquare className="w-4 h-4 text-yellow-400 mb-2" />
              <p className="text-lg font-bold">{fa.totalReviews}</p>
              <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.total_reviews')}</p>
            </div>
            <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/3">
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
            <div className="bg-brand-bg/50 rounded-xl p-4 border border-white/3">
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
              <div key={r.roomId} className="bg-brand-bg/50 rounded-xl p-4 border border-white/3">
                <p className="text-lg font-bold text-emerald-400">€{r.revenue}</p>
                <p className="text-xs text-brand-text-secondary mt-1 truncate">{r.title}</p>
                <p className="text-[10px] text-brand-text-secondary mt-2">{t('company.dashboard.revenue_from_room')}</p>
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-red-light" /> {t('company.dashboard.quick_actions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction
            href={p('/company/rooms/new')}
            icon={Plus}
            label={t('company.dashboard.add_room')}
            desc={t('company.dashboard.new_escape_room')}
            color="text-brand-red-light"
            disabled={atLimit}
            disabledHref={p('/company/billing')}
          />
          <QuickAction
            href={p('/company/slots')}
            icon={Clock}
            label={t('cx.nav.slots')}
            desc={t('cx.dashboard.slots_desc')}
            color="text-emerald-400"
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
            href={p('/company/settings?tab=widget')}
            icon={Code}
            label={t('company.dashboard.widget_title')}
            desc={t('company.dashboard.widget_desc')}
            color="text-orange-400"
          />
          <QuickAction
            href={p('/company/settings')}
            icon={Settings}
            label={t('company.nav.settings')}
            desc={t('company.dashboard.plan_preferences')}
            color="text-green-400"
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
    red:    { bg: 'bg-brand-red/10',   text: 'text-brand-red-light',   glow: 'shadow-red-500/5' },
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
    <div className="bg-brand-bg/50 rounded-xl p-3 border border-white/3">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-brand-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

/* ── Quick Action Link ── */
function QuickAction({ href, icon: Icon, label, desc, color, disabled, disabledHref }: {
  href: string; icon: any; label: string; desc: string; color: string; disabled?: boolean; disabledHref?: string;
}) {
  const { t } = useTranslation();
  if (disabled) {
    return (
      <Link href={disabledHref || href} className="p-4 rounded-2xl bg-brand-surface/50 border border-white/5 hover:border-yellow-500/30 transition-all">
        <Lock className="w-5 h-5 text-yellow-400/80 mb-2" />
        <p className="text-sm font-medium text-brand-text-secondary">{label}</p>
        <p className="text-[10px] text-brand-text-secondary mt-0.5">{t('company.dashboard.limit_reached')} · {t('company.dashboard.upgrade')}</p>
      </Link>
    );
  }
  return (
    <Link href={href} className="p-4 rounded-2xl bg-brand-surface border border-white/5 hover:border-brand-red/30 transition-all group">
      <Icon className={`w-5 h-5 ${color} mb-2 group-hover:scale-110 transition-transform`} />
      <p className="text-sm font-medium group-hover:text-brand-red-light transition-colors">{label}</p>
      <p className="text-[10px] text-brand-text-secondary mt-0.5">{desc}</p>
    </Link>
  );
}
