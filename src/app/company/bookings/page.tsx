'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  Ban,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Timer,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function CompanyBookingsPage() {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const DAYS = [
    t('common.day_sun'), t('common.day_mon'), t('common.day_tue'),
    t('common.day_wed'), t('common.day_thu'), t('common.day_fri'), t('common.day_sat')
  ];
  const MONTHS = [
    t('common.month_1'), t('common.month_2'), t('common.month_3'),
    t('common.month_4'), t('common.month_5'), t('common.month_6'),
    t('common.month_7'), t('common.month_8'), t('common.month_9'),
    t('common.month_10'), t('common.month_11'), t('common.month_12')
  ];
  const companyId = company?.id;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const bookings = useQuery(
    api.companies.getBookingsByDate,
    companyId ? { companyId: companyId as any, date: selectedDate } : 'skip'
  );

  const rooms = useQuery(
    api.companies.getRooms,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const cancelBooking = useMutation(api.companies.adminCancelBooking);
  const completeBooking = useMutation(api.companies.adminCompleteBooking);
  const submitPerformance = useMutation(api.badges.submitPerformance);
  const updateNotes = useMutation(api.companies.updateBookingNotes);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const handlePrevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const handleSelectDay = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(d);
  };

  const selectedDayNum = parseInt(selectedDate.split('-')[2]);
  const isSelectedMonth =
    selectedDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t('company.bookings.confirm_cancel'))) return;
    await cancelBooking({ companyId: companyId as any, bookingId: bookingId as any });
  };

  const handleComplete = (booking: any) => {
    setShowCompleteModal(booking);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{t('company.bookings.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExternalModal(true)}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <Ban className="w-4 h-4" /> {t('company.bookings.block_slot')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> {t('company.bookings.new_booking')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white/5 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white/5 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs text-brand-text-secondary py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const isSelected = isSelectedMonth && day === selectedDayNum;
              const isToday =
                new Date().toISOString().split('T')[0] ===
                `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectDay(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-brand-red text-white'
                      : isToday
                      ? 'bg-brand-red/20 text-brand-red'
                      : 'hover:bg-white/5 text-brand-text-secondary'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bookings List */}
        <div className="lg:col-span-2">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <h2 className="font-semibold mb-4">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>

            {!bookings ? (
              <div className="text-center py-8 text-brand-text-secondary">
                {t('company.bookings.loading')}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-brand-text-secondary">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('company.bookings.no_bookings')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking: any) => (
                  <div
                    key={booking._id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-brand-red/30 ${
                      selectedBooking?._id === booking._id
                        ? 'bg-brand-red/5 border-brand-red/30'
                        : 'bg-brand-bg border-white/5'
                    }`}
                    onClick={() =>
                      setSelectedBooking(
                        selectedBooking?._id === booking._id ? null : booking
                      )
                    }
                  >
                    {/* Room image header */}
                    {booking.roomImage && (
                      <div className="-mx-4 -mt-4 mb-3 h-28 rounded-t-xl overflow-hidden">
                        <img
                          src={booking.roomImage}
                          alt={booking.roomTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-brand-red">
                          {booking.time}
                        </span>
                        <span className="font-semibold">{booking.roomTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            booking.source === 'external'
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'bg-brand-red/10 text-brand-red'
                          }`}
                        >
                          {booking.source === 'external' ? t('company.bookings.external') : t('company.bookings.unlocked_source')}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            booking.status === 'cancelled'
                              ? 'bg-red-500/10 text-red-400'
                              : booking.status === 'completed'
                              ? 'bg-green-500/10 text-green-400'
                              : booking.status === 'pending_payment'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {booking.status === 'cancelled' ? t('company.bookings.status_cancelled') : booking.status === 'completed' ? t('company.bookings.status_completed') : booking.status === 'pending_payment' ? (t('company.bookings.status_pending_payment') || 'Pending Payment') : booking.status === 'upcoming' ? t('company.bookings.status_upcoming') : booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {booking.playerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {booking.players} {t('company.bookings.players_count')}
                      </span>
                      {booking.total > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> €{booking.total}
                        </span>
                      )}
                    </div>

                    {/* Expanded Detail */}
                    {selectedBooking?._id === booking._id && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-brand-text-secondary">{t('company.bookings.booking_code')}</span>
                            <p className="font-mono font-semibold">{booking.bookingCode}</p>
                          </div>
                          <div>
                            <span className="text-brand-text-secondary">{t('company.bookings.payment')}</span>
                            <p className="font-semibold">{booking.paymentStatus || t('company.bookings.na')}</p>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="text-sm">
                            <span className="text-brand-text-secondary">{t('company.bookings.notes')}</span>
                            <p>{booking.notes}</p>
                          </div>
                        )}
                        {booking.status === 'upcoming' && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(booking);
                              }}
                              className="text-sm px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                              {t('company.bookings.complete')}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(booking._id);
                              }}
                              className="text-sm px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              {t('company.bookings.cancel')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Admin Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal
          companyId={companyId!}
          rooms={rooms || []}
          date={selectedDate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* External Block Modal */}
      {showExternalModal && (
        <ExternalBlockModal
          companyId={companyId!}
          rooms={rooms || []}
          date={selectedDate}
          onClose={() => setShowExternalModal(false)}
        />
      )}

      {/* Complete Booking + Badge Modal */}
      {showCompleteModal && (
        <CompleteBookingModal
          companyId={companyId!}
          booking={showCompleteModal}
          onClose={() => setShowCompleteModal(null)}
          completeBooking={completeBooking}
          submitPerformance={submitPerformance}
        />
      )}
    </div>
  );
}

function CompleteBookingModal({
  companyId,
  booking,
  onClose,
  completeBooking,
  submitPerformance,
}: {
  companyId: string;
  booking: any;
  onClose: () => void;
  completeBooking: any;
  submitPerformance: any;
}) {
  const { t } = useTranslation();
  const [escaped, setEscaped] = useState(true);
  const [escapeTime, setEscapeTime] = useState('');
  const [hintsUsed, setHintsUsed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Mark booking as completed
      await completeBooking({
        companyId: companyId as any,
        bookingId: booking._id as any,
      });

      // 2. Submit performance data for badge verification
      await submitPerformance({
        companyId: companyId as any,
        bookingId: booking._id as any,
        escaped,
        escapeTimeMinutes: escapeTime ? parseInt(escapeTime) : undefined,
        hintsUsed: hintsUsed !== '' ? parseInt(hintsUsed) : undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-gold" />
            {t('company.bookings.complete_verify')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking summary */}
        <div className="bg-brand-bg rounded-xl p-3 mb-5 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-brand-red">{booking.time}</span>
            <span className="font-medium">{booking.roomTitle}</span>
          </div>
          <div className="text-brand-text-muted flex items-center gap-3">
            <span>{booking.playerName}</span>
            <span>{booking.players} {t('company.bookings.players_count')}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Did they escape? */}
        <div className="mb-5">
          <label className="block text-sm text-brand-text-secondary mb-2">
            {t('company.bookings.did_escape')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEscaped(true)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                escaped
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-brand-bg border-white/10 text-brand-text-secondary hover:border-green-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('company.bookings.yes_escaped')}
            </button>
            <button
              type="button"
              onClick={() => setEscaped(false)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                !escaped
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-brand-bg border-white/10 text-brand-text-secondary hover:border-red-500/20'
              }`}
            >
              <XCircle className="w-4 h-4" />
              {t('company.bookings.no_escaped')}
            </button>
          </div>
        </div>

        {/* Escape time (only if escaped) */}
        {escaped && (
          <div className="mb-4">
            <label className="block text-sm text-brand-text-secondary mb-1.5 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              {t('company.bookings.escape_time')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="120"
                value={escapeTime}
                onChange={(e) => setEscapeTime(e.target.value)}
                placeholder={t('company.bookings.escape_time_placeholder')}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-text-muted">min</span>
            </div>
          </div>
        )}

        {/* Hints used */}
        <div className="mb-6">
          <label className="block text-sm text-brand-text-secondary mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            {t('company.bookings.hints_used')}
          </label>
          <input
            type="number"
            min="0"
            max="20"
            value={hintsUsed}
            onChange={(e) => setHintsUsed(e.target.value)}
            placeholder={t('company.bookings.hints_placeholder')}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
          />
        </div>

        {/* Badge info note */}
        <div className="bg-brand-gold/5 border border-brand-gold/10 rounded-xl p-3 mb-5 text-xs text-brand-text-secondary flex items-start gap-2">
          <Award className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
          <span>{t('company.bookings.badge_info')}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full btn-primary !py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {t('company.bookings.complete_and_verify')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function CreateBookingModal({
  companyId,
  rooms,
  date,
  onClose,
}: {
  companyId: string;
  rooms: any[];
  date: string;
  onClose: () => void;
}) {
  const createBooking = useMutation(api.companies.createAdminBooking);
  const { t } = useTranslation();
  const [form, setForm] = useState({
    roomId: rooms[0]?._id || '',
    time: '',
    players: 2,
    playerName: '',
    playerContact: '',
    playerPhone: '',
    notes: '',
    total: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createBooking({
        companyId: companyId as any,
        roomId: form.roomId as any,
        date,
        time: form.time,
        players: form.players,
        playerName: form.playerName,
        playerContact: form.playerContact || undefined,
        playerPhone: form.playerPhone || undefined,
        notes: form.notes || undefined,
        total: form.total,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || t('company.bookings.failed_create'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('company.bookings.new_booking')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.room')}</label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
              required
            >
              <option value="">{t('company.bookings.select_room')}</option>
              {rooms.filter((r) => r.isActive !== false).map((r: any) => (
                <option key={r._id} value={r._id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.time')}</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.players')}</label>
              <input
                type="number"
                min="1"
                value={form.players}
                onChange={(e) => setForm({ ...form, players: parseInt(e.target.value) || 1 })}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.total_eur')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: parseFloat(e.target.value) || 0 })}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.player_name')}</label>
            <input
              type="text"
              value={form.playerName}
              onChange={(e) => setForm({ ...form, playerName: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              placeholder={t('company.bookings.customer_name')}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.email')}</label>
            <input
              type="email"
              value={form.playerContact}
              onChange={(e) => setForm({ ...form, playerContact: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              placeholder="player@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.phone')}</label>
            <input
              type="tel"
              value={form.playerPhone}
              onChange={(e) => setForm({ ...form, playerPhone: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              placeholder="+30 6XX XXX XXXX"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.notes_optional')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none"
              placeholder={t('company.bookings.any_notes')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary !py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('company.bookings.create_booking')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ExternalBlockModal({
  companyId,
  rooms,
  date,
  onClose,
}: {
  companyId: string;
  rooms: any[];
  date: string;
  onClose: () => void;
}) {
  const createBlock = useMutation(api.companies.createExternalBlock);
  const { t } = useTranslation();
  const [form, setForm] = useState({
    roomId: rooms[0]?._id || '',
    time: '',
    externalSource: 'escapeall',
    playerName: '',
    players: 0,
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch available slots for the selected room + date
  const slots = useQuery(
    api.companies.getRoomSlots,
    form.roomId ? { roomId: form.roomId as any, date } : 'skip'
  );

  // Get the selected room's default time slots as fallback
  const selectedRoom = rooms.find((r: any) => r._id === form.roomId);
  const defaultSlots = selectedRoom?.defaultTimeSlots || [];

  // Available slots: use fetched slots if they exist, otherwise show defaults
  const availableSlots = useMemo(() => {
    // Sort treating midnight (00:xx) as end-of-day
    const sort = (a: any, b: any) => {
      const aIsMidnight = a.time.startsWith('00:') || a.time.startsWith('00.');
      const bIsMidnight = b.time.startsWith('00:') || b.time.startsWith('00.');
      if (aIsMidnight && !bIsMidnight) return 1;
      if (!aIsMidnight && bIsMidnight) return -1;
      return a.time.localeCompare(b.time);
    };
    if (slots && slots.length > 0) {
      return slots
        .filter((s: any) => s.available)
        .map((s: any) => ({ time: s.time, price: s.price }))
        .sort(sort);
    }
    // Fallback to room's default operating slots
    if (defaultSlots.length > 0) {
      return [...defaultSlots].sort(sort);
    }
    return [];
  }, [slots, defaultSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createBlock({
        companyId: companyId as any,
        roomId: form.roomId as any,
        date,
        time: form.time,
        externalSource: form.externalSource,
        playerName: form.playerName || undefined,
        players: form.players || undefined,
        notes: form.notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || t('company.bookings.failed_block'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('company.bookings.block_external')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.room')}</label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
              required
            >
              <option value="">{t('company.bookings.select_room')}</option>
              {rooms.filter((r) => r.isActive !== false).map((r: any) => (
                <option key={r._id} value={r._id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.time')}</label>
            {availableSlots.length > 0 ? (
              <div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {availableSlots.map((slot: any) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setForm({ ...form, time: slot.time })}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        form.time === slot.time
                          ? 'bg-brand-red border-brand-red text-white'
                          : 'bg-brand-bg border-white/10 text-brand-text-secondary hover:border-brand-red/40 hover:text-white'
                      }`}
                    >
                      <span>{slot.time}</span>
                      <span className="block text-[10px] opacity-60">€{slot.price}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-brand-text-secondary mb-1">{t('company.bookings.custom_time')}</p>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand-red focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
                  required
                />
                <p className="text-xs text-brand-text-secondary mt-1">
                  {t('company.bookings.no_slots_manual')}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.source')}</label>
            <select
              value={form.externalSource}
              onChange={(e) => setForm({ ...form, externalSource: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
            >
              <option value="escapeall">{t('company.bookings.source_escapeall')}</option>
              <option value="phone">{t('company.bookings.source_phone')}</option>
              <option value="walkin">{t('company.bookings.source_walkin')}</option>
              <option value="private_event">{t('company.bookings.source_private')}</option>
              <option value="other">{t('company.bookings.source_other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.customer_optional')}</label>
            <input
              type="text"
              value={form.playerName}
              onChange={(e) => setForm({ ...form, playerName: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              placeholder={t('company.bookings.customer_name')}
            />
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.bookings.notes_optional')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none"
              placeholder={t('company.bookings.additional_details')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary !py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('company.bookings.block_slot')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
