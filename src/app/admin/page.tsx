'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Building2,
  Users,
  DoorOpen,
  CalendarCheck,
  TrendingUp,
  Euro,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Rocket,
  Diamond,
  Crown,
  ArrowLeft,
  LogOut,
  Globe,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  X,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Search,
} from 'lucide-react';

export default function AdminPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'bookings' | 'users'>('overview');
  const [companySearch, setCompanySearch] = useState('');
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('unlocked_admin');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setAdminEmail(data.email);
      } catch {
        localStorage.removeItem('unlocked_admin');
      }
    }
    setIsLoading(false);
  }, []);

  const dashboard = useQuery(
    api.companies.getAdminDashboard,
    adminEmail ? { adminEmail } : 'skip'
  );

  const approveCompany = useMutation(api.companies.approveCompany);
  const declineCompany = useMutation(api.companies.declineCompany);

  const handleLogout = () => {
    localStorage.removeItem('unlocked_admin');
    setAdminEmail(null);
    router.replace('/company/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminEmail) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-brand-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('admin.access_required')}</h1>
          <p className="text-brand-text-secondary mb-6">{t('admin.access_desc')}</p>
          <Link
            href="/company/login"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t('admin.go_to_login')}
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
          <p className="text-brand-text-secondary text-sm">{t('admin.loading_dashboard')}</p>
        </div>
      </div>
    );
  }

  const { companies, rooms, bookings, users, social, topCompanies } = dashboard;

  // Filtered companies for search
  const filteredCompanies = companies.list.filter((c: any) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.email.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.city?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const tabs = [
    { id: 'overview' as const, label: t('admin.tab_overview'), icon: TrendingUp },
    { id: 'companies' as const, label: t('admin.tab_companies'), icon: Building2 },
    { id: 'bookings' as const, label: t('admin.tab_bookings'), icon: CalendarCheck },
    { id: 'users' as const, label: t('admin.tab_users'), icon: Users },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <div className="bg-brand-surface border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">UNLOCKED Admin</h1>
              <p className="text-xs text-brand-text-secondary">{adminEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> {t('admin.logout')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-brand-surface rounded-xl p-1 border border-white/5 max-w-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-red text-white'
                  : 'text-brand-text-secondary hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════ OVERVIEW TAB ══════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Building2}
                label={t('admin.metric_companies')}
                value={companies.total}
                sub={`${companies.approved} ${t('admin.approved_short')}`}
                color="text-blue-400"
                bg="bg-blue-500/10"
              />
              <StatCard
                icon={DoorOpen}
                label={t('admin.metric_rooms')}
                value={rooms.total}
                sub={`${rooms.active} ${t('admin.active_short')}`}
                color="text-emerald-400"
                bg="bg-emerald-500/10"
              />
              <StatCard
                icon={CalendarCheck}
                label={t('admin.metric_bookings')}
                value={bookings.total}
                sub={`${bookings.upcoming} ${t('admin.upcoming_short')}`}
                color="text-purple-400"
                bg="bg-purple-500/10"
              />
              <StatCard
                icon={Users}
                label={t('admin.metric_users')}
                value={users.total}
                sub={`${users.premium} premium`}
                color="text-amber-400"
                bg="bg-amber-500/10"
              />
            </div>

            {/* Revenue & Bookings row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-2 text-brand-text-secondary text-sm mb-1">
                  <Euro className="w-4 h-4" /> {t('admin.total_revenue')}
                </div>
                <p className="text-3xl font-bold">{bookings.totalRevenue.toFixed(2)}€</p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  {bookings.total - bookings.cancelled} {t('admin.paid_bookings')}
                </p>
              </div>

              <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-2 text-brand-text-secondary text-sm mb-1">
                  <Star className="w-4 h-4" /> {t('admin.avg_rating')}
                </div>
                <p className="text-3xl font-bold">{rooms.avgRating}<span className="text-lg text-brand-text-secondary">/5</span></p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  {rooms.totalReviews} {t('admin.total_reviews')}
                </p>
              </div>

              <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-2 text-brand-text-secondary text-sm mb-1">
                  <MessageSquare className="w-4 h-4" /> {t('admin.social_posts')}
                </div>
                <p className="text-3xl font-bold">{social.totalPosts}</p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  {t('admin.community_activity')}
                </p>
              </div>
            </div>

            {/* Booking Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
                <h3 className="text-sm font-bold text-brand-text-secondary mb-4">{t('admin.booking_sources')}</h3>
                <div className="space-y-3">
                  <ProgressBar
                    label="UNLOCKED"
                    value={bookings.unlocked}
                    total={bookings.total}
                    color="bg-brand-red"
                  />
                  <ProgressBar
                    label={t('admin.external_widget')}
                    value={bookings.external}
                    total={bookings.total}
                    color="bg-blue-500"
                  />
                </div>
              </div>

              <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
                <h3 className="text-sm font-bold text-brand-text-secondary mb-4">{t('admin.booking_status')}</h3>
                <div className="space-y-3">
                  <ProgressBar
                    label={t('admin.status_upcoming')}
                    value={bookings.upcoming}
                    total={bookings.total}
                    color="bg-blue-500"
                  />
                  <ProgressBar
                    label={t('admin.status_completed')}
                    value={bookings.completed}
                    total={bookings.total}
                    color="bg-emerald-500"
                  />
                  <ProgressBar
                    label={t('admin.status_cancelled')}
                    value={bookings.cancelled}
                    total={bookings.total}
                    color="bg-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Plan breakdown */}
            <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-bold text-brand-text-secondary mb-4">{t('admin.company_plans')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PlanCard icon={Rocket} label="Starter" count={companies.plans.starter} color="text-emerald-400" bg="bg-emerald-500/10" />
                <PlanCard icon={Diamond} label="Pro" count={companies.plans.pro} color="text-brand-red" bg="bg-brand-red/10" />
                <PlanCard icon={Crown} label="Enterprise" count={companies.plans.enterprise} color="text-purple-400" bg="bg-purple-500/10" />
                <PlanCard icon={AlertCircle} label={t('admin.no_plan')} count={companies.plans.none} color="text-gray-400" bg="bg-white/5" />
              </div>
            </div>

            {/* Revenue by Month */}
            {Object.keys(bookings.revenueByMonth).length > 0 && (
              <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
                <h3 className="text-sm font-bold text-brand-text-secondary mb-4">{t('admin.revenue_by_month')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(bookings.revenueByMonth)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, rev]) => (
                      <div key={month} className="bg-brand-bg rounded-xl p-4 border border-white/5 text-center">
                        <p className="text-xs text-brand-text-secondary mb-1">{month}</p>
                        <p className="text-lg font-bold">{(rev as number).toFixed(0)}€</p>
                        <p className="text-xs text-brand-text-secondary">
                          {bookings.bookingsByMonth[month]} {t('admin.bookings_short')}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Companies */}
            {topCompanies.length > 0 && (
              <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
                <h3 className="text-sm font-bold text-brand-text-secondary mb-4">{t('admin.top_companies')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-3 py-2">#</th>
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-3 py-2">{t('admin.col_company')}</th>
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-3 py-2">{t('admin.col_city')}</th>
                        <th className="text-right text-xs text-brand-text-secondary font-medium px-3 py-2">{t('admin.col_bookings')}</th>
                        <th className="text-right text-xs text-brand-text-secondary font-medium px-3 py-2">{t('admin.col_revenue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCompanies.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5 text-sm text-brand-text-secondary">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{c.name}</span>
                              {c.plan && <PlanBadgeMini plan={c.plan} />}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-brand-text-secondary">{c.city}</td>
                          <td className="px-3 py-2.5 text-sm font-medium text-right">{c.bookings}</td>
                          <td className="px-3 py-2.5 text-sm font-medium text-right">{c.revenue.toFixed(0)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ COMPANIES TAB ══════════ */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder={t('admin.search_companies')}
                className="w-full bg-brand-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              />
            </div>

            {/* Pending companies first */}
            {companies.pending > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t('admin.pending_review')} ({companies.pending})
                </h3>
                {filteredCompanies
                  .filter((c: any) => c.onboardingStatus === 'pending_review' || c.onboardingStatus === 'pending_terms' || c.onboardingStatus === 'pending_plan')
                  .map((company: any) => (
                    <CompanyDetailCard
                      key={company._id}
                      company={company}
                      expanded={expandedCompany === company._id}
                      onToggle={() => setExpandedCompany(expandedCompany === company._id ? null : company._id)}
                      onApprove={async () => {
                        await approveCompany({ companyId: company._id, userId: company._id });
                      }}
                      onDecline={async (notes: string) => {
                        await declineCompany({ companyId: company._id, notes, userId: company._id });
                      }}
                      t={t}
                      showActions
                    />
                  ))}
              </div>
            )}

            {/* All companies table */}
            <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-bold">{t('admin.all_companies')} ({filteredCompanies.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_company')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_city')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_email')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_status')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_plan')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_registered')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((company: any) => (
                      <tr key={company._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm">{company.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-text-secondary">{company.city}</td>
                        <td className="px-4 py-3 text-sm text-brand-text-secondary">{company.email}</td>
                        <td className="px-4 py-3"><StatusBadge status={company.onboardingStatus} t={t} /></td>
                        <td className="px-4 py-3">{company.platformPlan ? <PlanBadgeMini plan={company.platformPlan} /> : <span className="text-xs text-brand-text-secondary">—</span>}</td>
                        <td className="px-4 py-3 text-sm text-brand-text-secondary">
                          {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ BOOKINGS TAB ══════════ */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MiniStat label={t('admin.metric_bookings')} value={bookings.total} />
              <MiniStat label={t('admin.status_upcoming')} value={bookings.upcoming} color="text-blue-400" />
              <MiniStat label={t('admin.status_completed')} value={bookings.completed} color="text-emerald-400" />
              <MiniStat label={t('admin.status_cancelled')} value={bookings.cancelled} color="text-red-400" />
              <MiniStat label={t('admin.total_revenue')} value={`${bookings.totalRevenue.toFixed(0)}€`} color="text-amber-400" />
            </div>

            {/* Recent bookings */}
            <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-bold">{t('admin.recent_bookings')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_code')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_room')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_company')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_date')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_players')}</th>
                      <th className="text-right text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_total')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_status')}</th>
                      <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">{t('admin.col_source')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.recent.map((b: any) => (
                      <tr key={b._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono bg-brand-bg px-2 py-1 rounded">{b.bookingCode}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{b.roomTitle}</td>
                        <td className="px-4 py-3 text-sm text-brand-text-secondary">{b.companyName}</td>
                        <td className="px-4 py-3 text-sm text-brand-text-secondary">{b.date} {b.time}</td>
                        <td className="px-4 py-3 text-sm text-center">{b.players}</td>
                        <td className="px-4 py-3 text-sm font-medium text-right">{b.total}€</td>
                        <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${b.source === 'external' ? 'bg-blue-500/10 text-blue-400' : 'bg-brand-red/10 text-brand-red'}`}>
                            {b.source === 'external' ? 'Widget' : 'UNLOCKED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ USERS TAB ══════════ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                icon={Users}
                label={t('admin.total_users')}
                value={users.total}
                sub={t('admin.registered_players')}
                color="text-blue-400"
                bg="bg-blue-500/10"
              />
              <StatCard
                icon={Crown}
                label={t('admin.premium_users')}
                value={users.premium}
                sub={users.total > 0 ? `${((users.premium / users.total) * 100).toFixed(1)}%` : '0%'}
                color="text-amber-400"
                bg="bg-amber-500/10"
              />
              <StatCard
                icon={MessageSquare}
                label={t('admin.social_posts')}
                value={social.totalPosts}
                sub={t('admin.community_activity')}
                color="text-purple-400"
                bg="bg-purple-500/10"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ──

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: any; label: string; value: number | string; sub: string; color: string; bg: string;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-brand-text-secondary">{label}</p>
      <p className="text-xs text-brand-text-secondary/60 mt-1">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-brand-surface rounded-xl border border-white/5 p-4 text-center">
      <p className={`text-xl font-bold ${color || 'text-white'}`}>{value}</p>
      <p className="text-xs text-brand-text-secondary mt-1">{label}</p>
    </div>
  );
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-brand-text-secondary">{label}</span>
        <span className="font-medium">{value} <span className="text-brand-text-secondary text-xs">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PlanCard({ icon: Icon, label, count, color, bg }: {
  icon: any; label: string; count: number; color: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
      <p className="text-lg font-bold">{count}</p>
      <p className={`text-xs ${color}`}>{label}</p>
    </div>
  );
}

function PlanBadgeMini({ plan }: { plan: string }) {
  const config: Record<string, { bg: string; text: string; Icon: any }> = {
    starter: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', Icon: Rocket },
    pro: { bg: 'bg-red-500/10', text: 'text-red-400', Icon: Diamond },
    enterprise: { bg: 'bg-purple-500/10', text: 'text-purple-400', Icon: Crown },
  };
  const c = config[plan];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      <c.Icon className="w-3 h-3" /> {plan}
    </span>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const config: Record<string, { bg: string; text: string; key: string }> = {
    approved: { bg: 'bg-green-500/10', text: 'text-green-400', key: 'admin.status_approved' },
    pending_review: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', key: 'admin.status_pending' },
    pending_terms: { bg: 'bg-blue-500/10', text: 'text-blue-400', key: 'admin.status_terms' },
    pending_plan: { bg: 'bg-purple-500/10', text: 'text-purple-400', key: 'admin.status_plan' },
    declined: { bg: 'bg-red-500/10', text: 'text-red-400', key: 'admin.status_declined' },
  };
  const c = config[status] || config.approved;
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.bg} ${c.text}`}>
      {t(c.key)}
    </span>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    upcoming: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Upcoming' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
  };
  const c = config[status] || config.upcoming;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
  );
}

function CompanyDetailCard({ company, expanded, onToggle, onApprove, onDecline, t, showActions }: {
  company: any; expanded: boolean; onToggle: () => void; onApprove: () => void; onDecline: (notes: string) => void; t: (k: string) => string; showActions?: boolean;
}) {
  const [declineNotes, setDeclineNotes] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red font-bold">
            {company.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-sm">{company.name}</h3>
            <p className="text-xs text-brand-text-secondary">{company.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={company.onboardingStatus} t={t} />
          {expanded ? <ChevronUp className="w-4 h-4 text-brand-text-secondary" /> : <ChevronDown className="w-4 h-4 text-brand-text-secondary" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-brand-text-secondary"><Phone className="w-3.5 h-3.5" /> {company.phone}</div>
            <div className="flex items-center gap-2 text-brand-text-secondary"><MapPin className="w-3.5 h-3.5" /> {company.address}, {company.city}</div>
            <div className="flex items-center gap-2 text-brand-text-secondary"><CreditCard className="w-3.5 h-3.5" /> VAT: {company.vatNumber || '—'}</div>
            <div className="flex items-center gap-2 text-brand-text-secondary"><Clock className="w-3.5 h-3.5" /> {company.createdAt ? new Date(company.createdAt).toLocaleString() : '—'}</div>
          </div>
          {company.description && (
            <p className="text-sm bg-brand-bg rounded-lg p-3 border border-white/5 mb-4">{company.description}</p>
          )}
          {showActions && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => { setLoading(true); await onApprove(); setLoading(false); }}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium"
              >
                <Check className="w-3.5 h-3.5" /> {t('admin.approve')}
              </button>
              {!showDeclineForm ? (
                <button
                  onClick={() => setShowDeclineForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium"
                >
                  <X className="w-3.5 h-3.5" /> {t('admin.decline')}
                </button>
              ) : (
                <div className="flex-1 space-y-2">
                  <textarea
                    value={declineNotes}
                    onChange={(e) => setDeclineNotes(e.target.value)}
                    placeholder={t('admin.decline_reason')}
                    rows={2}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => { setLoading(true); await onDecline(declineNotes); setLoading(false); }}
                      disabled={loading || !declineNotes.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> {t('admin.confirm_decline')}
                    </button>
                    <button
                      onClick={() => { setShowDeclineForm(false); setDeclineNotes(''); }}
                      className="text-sm text-brand-text-secondary hover:text-white"
                    >
                      {t('admin.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
