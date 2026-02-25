'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
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
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
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
  const { company } = useCompanyAuth();
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
  const PLAN_ROOM_LIMITS: Record<string, number> = { starter: 3, pro: 10, enterprise: Infinity };
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-surface via-brand-surface to-brand-red/5 border border-white/5 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-brand-text-secondary mb-1">{formatDate()}</p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, <span className="text-brand-red">{company?.name}</span>
            </h1>
            <p className="text-brand-text-secondary mt-1.5 text-sm">
              {todayBookings
                ? todayBookings.length > 0
                  ? `You have ${todayBookings.length} booking${todayBookings.length !== 1 ? 's' : ''} today — ${upcomingCount} upcoming, ${completedCount} completed`
                  : 'No bookings yet today. A quiet day to prepare!'
                : 'Loading your schedule...'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/company/bookings" className="btn-ghost text-sm flex items-center gap-2 !py-2.5 !px-4">
              <CalendarDays className="w-4 h-4" /> Bookings
            </Link>
            {atLimit ? (
              <div className="flex items-center gap-2 text-sm text-brand-text-secondary bg-brand-bg border border-white/5 rounded-xl px-4 py-2.5">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span>Room limit</span>
              </div>
            ) : (
              <Link href="/company/rooms/new" className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Room
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Today&apos;s Metrics (live pulse) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={CalendarDays}
          label="Today&apos;s Bookings"
          value={todayStats?.totalBookings ?? '-'}
          accent="blue"
          detail={upcomingCount > 0 ? `${upcomingCount} upcoming` : undefined}
        />
        <MetricCard
          icon={DollarSign}
          label="Today&apos;s Revenue"
          value={todayStats ? `€${todayStats.revenue.toFixed(0)}` : '-'}
          accent="green"
          detail={todayStats && todayStats.revenue > 0 ? 'from bookings' : undefined}
        />
        <MetricCard
          icon={Eye}
          label="Available Slots"
          value={todayStats?.availableSlots ?? '-'}
          accent="yellow"
          detail="remaining today"
        />
        <MetricCard
          icon={Activity}
          label="Active Rooms"
          value={`${activeRooms}/${roomCount}`}
          accent="red"
          detail={roomLimit !== Infinity ? `${roomLimit} max (${plan})` : `${plan} plan`}
        />
      </div>

      {/* ── Split: Overview + Schedule ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Overview Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-red" /> Overview
              </h2>
              <span className="text-xs text-brand-text-secondary">All time</span>
            </div>
            <div className="space-y-4">
              <OverviewRow
                icon={DoorOpen}
                label="Rooms"
                value={String(roomCount)}
                sub={roomLimit !== Infinity ? `of ${roomLimit}` : 'unlimited'}
                color="text-purple-400"
                progress={roomLimit !== Infinity ? (roomCount / roomLimit) * 100 : undefined}
              />
              <OverviewRow
                icon={CalendarDays}
                label="Total Bookings"
                value={String(stats?.totalBookings ?? 0)}
                color="text-cyan-400"
              />
              <OverviewRow
                icon={DollarSign}
                label="Revenue"
                value={stats ? `€${stats.totalRevenue.toFixed(0)}` : '€0'}
                color="text-emerald-400"
              />
              <OverviewRow
                icon={CheckCircle}
                label="Completed"
                value={String(stats?.advanced?.completedBookings ?? 0)}
                sub="bookings"
                color="text-orange-400"
              />
              <OverviewRow
                icon={CalendarDays}
                label="Upcoming"
                value={String(stats?.upcomingBookings ?? 0)}
                sub="bookings"
                color="text-blue-400"
              />
            </div>
          </div>

          {/* Room Capacity Card */}
          {roomLimit !== Infinity && (
            <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-brand-text-secondary mb-3">Room Capacity</h3>
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
                  <p className="text-sm font-medium">{roomCount} of {roomLimit} rooms used</p>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    {atLimit ? 'Upgrade to add more rooms' : `${roomLimit - roomCount} room${roomLimit - roomCount !== 1 ? 's' : ''} available`}
                  </p>
                  {atLimit && (
                    <Link href="/company/settings" className="text-xs text-brand-red hover:underline mt-1 inline-block">
                      Upgrade plan →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Today&apos;s Schedule */}
        <div className="lg:col-span-3">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-red" /> Today&apos;s Schedule
              </h2>
              <Link href="/company/bookings" className="text-xs text-brand-red hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {!todayBookings ? (
              <div className="text-center py-12 text-brand-text-secondary text-sm">Loading...</div>
            ) : todayBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-brand-text-secondary/20" />
                <p className="text-brand-text-secondary text-sm">No bookings for today</p>
                <Link href="/company/bookings" className="text-xs text-brand-red hover:underline mt-2 inline-block">
                  Go to Bookings →
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
                        {booking.playerName} · {booking.players} players
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
                        {booking.source === 'external' ? 'External' : 'UNLOCKED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Advanced Analytics (Pro+) ── */}
      {(stats as any)?.advanced && (
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold">Advanced Analytics</h2>
            <span className="text-[10px] bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">Pro</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MiniStat icon={CheckCircle} label="Completed" value={(stats as any).advanced.completedBookings} color="text-green-400" />
            <MiniStat icon={XCircle} label="Cancelled" value={(stats as any).advanced.cancelledBookings} color="text-red-400" />
            <MiniStat icon={Star} label="Avg Rating" value={(stats as any).advanced.avgRating || '—'} color="text-yellow-400" />
            <MiniStat icon={Percent} label="Conversion" value={`${(stats as any).advanced.conversionRate}%`} color="text-cyan-400" />
            <MiniStat icon={CreditCard} label="Avg €/Booking" value={`€${(stats as any).advanced.avgRevenuePerBooking}`} color="text-emerald-400" />
          </div>
        </div>
      )}

      {/* ── Enterprise Analytics ── */}
      {(stats as any)?.fullAnalytics && (
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Crown className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold">Enterprise Insights</h2>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">Enterprise</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-brand-bg/50 rounded-xl p-4 border border-white/[0.03]">
              <p className="text-2xl font-bold">{(stats as any).fullAnalytics.totalSubscribers}</p>
              <p className="text-xs text-brand-text-secondary mt-1">Total Subscribers</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Circle className="w-2 h-2 fill-current" /> {(stats as any).fullAnalytics.activeSubscribers} active
                </span>
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <Circle className="w-2 h-2 fill-current" /> {(stats as any).fullAnalytics.churnedSubscribers} churned
                </span>
              </div>
            </div>
            {(stats as any).fullAnalytics.revenuePerRoom?.slice(0, 2).map((r: any) => (
              <div key={r.roomId} className="bg-brand-bg/50 rounded-xl p-4 border border-white/[0.03]">
                <p className="text-lg font-bold text-emerald-400">€{r.revenue}</p>
                <p className="text-xs text-brand-text-secondary mt-1 truncate">{r.title}</p>
                <p className="text-[10px] text-brand-text-secondary mt-2">Revenue from room</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Analytics Upsell (Starter) ── */}
      {plan === 'starter' && stats && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-surface to-brand-red/5 border border-white/5 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-brand-red" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Unlock Advanced Analytics</h3>
              <p className="text-sm text-brand-text-secondary mt-0.5">
                See completion rates, ratings, conversion metrics, revenue breakdowns and more.
              </p>
            </div>
            <Link href="/company/settings" className="btn-primary text-sm shrink-0 flex items-center gap-1.5">
              Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-red" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <QuickAction
            href="/company/rooms/new"
            icon={Plus}
            label="Add Room"
            desc="New escape room"
            color="text-brand-red"
            disabled={atLimit}
          />
          <QuickAction
            href="/company/bookings"
            icon={CalendarDays}
            label="Bookings"
            desc="Manage reservations"
            color="text-blue-400"
          />
          <QuickAction
            href="/company/rooms"
            icon={DoorOpen}
            label="Rooms"
            desc="Edit your listings"
            color="text-purple-400"
          />
          <QuickAction
            href="/company/settings"
            icon={Settings}
            label="Settings"
            desc="Plan & preferences"
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
    red:    { bg: 'bg-brand-red/10',   text: 'text-brand-red',   glow: 'shadow-red-500/5' },
  };
  const c = colors[accent] || colors.blue;

  return (
    <div className={`bg-brand-surface rounded-2xl border border-white/5 p-4 shadow-lg ${c.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${c.text}`} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-brand-text-secondary mt-1">{label}</p>
      {detail && <p className="text-[10px] text-brand-text-secondary/60 mt-0.5">{detail}</p>}
    </div>
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
  if (disabled) {
    return (
      <div className="p-4 rounded-2xl bg-brand-surface/50 border border-white/5 opacity-50 cursor-not-allowed">
        <Lock className="w-5 h-5 text-brand-text-secondary mb-2" />
        <p className="text-sm font-medium text-brand-text-secondary">{label}</p>
        <p className="text-[10px] text-brand-text-secondary mt-0.5">Limit reached</p>
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
  const acceptTerms = useMutation(api.companies.acceptTerms);
  const selectPlan = useMutation(api.companies.selectPlan);
  const resubmit = useMutation(api.companies.resubmitForReview);

  if (status === 'pending_terms') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto mt-12">
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to UNLOCKED</h1>
          <p className="text-brand-text-secondary mb-6">
            Before you get started, please accept our terms of service and
            business agreement.
          </p>
          <div className="bg-brand-bg rounded-xl p-4 mb-6 text-left text-sm text-brand-text-secondary max-h-48 overflow-y-auto">
            <p className="font-semibold text-white mb-2">Terms of Service</p>
            <p>
              By using the UNLOCKED Business Portal, you agree to list your
              escape rooms accurately, honor all bookings made through the
              platform, and maintain up-to-date availability. UNLOCKED charges a
              service fee per booking. Cancellation policies apply as per the
              platform guidelines.
            </p>
          </div>
          <button
            onClick={() => acceptTerms({ companyId: companyId as any })}
            className="btn-primary !py-3 px-8"
          >
            Accept Terms & Continue
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending_plan') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto mt-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Choose Your Plan</h1>
          <p className="text-brand-text-secondary mt-2">
            Select the plan that best fits your business
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Starter',
              value: 'starter' as const,
              price: 'Free',
              features: ['Up to 3 rooms', 'Basic analytics', 'Email support'],
            },
            {
              name: 'Pro',
              value: 'pro' as const,
              price: '€49/mo',
              features: [
                'Unlimited rooms',
                'Advanced analytics',
                'Priority support',
                'Subscription system',
              ],
              popular: true,
            },
            {
              name: 'Enterprise',
              value: 'enterprise' as const,
              price: '€99/mo',
              features: [
                'Everything in Pro',
                'Custom branding',
                'API access',
                'Dedicated manager',
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
                  Most Popular
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
                Select {plan.name}
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
          <h1 className="text-2xl font-bold mb-2">Under Review</h1>
          <p className="text-brand-text-secondary">
            Your account is being reviewed by our team. You&apos;ll be notified
            once approved. This usually takes 1-2 business days.
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
          <h1 className="text-2xl font-bold mb-2">Application Declined</h1>
          <p className="text-brand-text-secondary mb-6">
            Your application was not approved. Please review the feedback and
            resubmit.
          </p>
          <button
            onClick={() => resubmit({ companyId: companyId as any })}
            className="btn-primary !py-3 px-8"
          >
            Resubmit for Review
          </button>
        </div>
      </div>
    );
  }

  return null;
}
