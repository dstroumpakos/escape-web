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
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CompanyBookingsPage() {
  const { company } = useCompanyAuth();
  const companyId = company?.id;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
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
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    await cancelBooking({ companyId: companyId as any, bookingId: bookingId as any });
  };

  const handleComplete = async (bookingId: string) => {
    if (!confirm('Mark this booking as completed?')) return;
    await completeBooking({ companyId: companyId as any, bookingId: bookingId as any });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Bookings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExternalModal(true)}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <Ban className="w-4 h-4" /> Block Slot
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Booking
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
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-brand-text-secondary">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No bookings for this date</p>
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
                          {booking.source === 'external' ? 'External' : 'UNLOCKED'}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            booking.status === 'cancelled'
                              ? 'bg-red-500/10 text-red-400'
                              : booking.status === 'completed'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {booking.playerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {booking.players} players
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
                            <span className="text-brand-text-secondary">Booking Code</span>
                            <p className="font-mono font-semibold">{booking.bookingCode}</p>
                          </div>
                          <div>
                            <span className="text-brand-text-secondary">Payment</span>
                            <p className="font-semibold">{booking.paymentStatus || 'N/A'}</p>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="text-sm">
                            <span className="text-brand-text-secondary">Notes</span>
                            <p>{booking.notes}</p>
                          </div>
                        )}
                        {booking.status === 'upcoming' && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(booking._id);
                              }}
                              className="text-sm px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(booking._id);
                              }}
                              className="text-sm px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              Cancel
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
      setError(err?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">New Booking</h2>
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
            <label className="block text-sm text-brand-text-secondary mb-1.5">Room</label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
              required
            >
              <option value="">Select room...</option>
              {rooms.filter((r) => r.isActive !== false).map((r: any) => (
                <option key={r._id} value={r._id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">Time</label>
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
              <label className="block text-sm text-brand-text-secondary mb-1.5">Players</label>
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
              <label className="block text-sm text-brand-text-secondary mb-1.5">Total (€)</label>
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
            <label className="block text-sm text-brand-text-secondary mb-1.5">Player Name</label>
            <input
              type="text"
              value={form.playerName}
              onChange={(e) => setForm({ ...form, playerName: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              placeholder="Customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">Email</label>
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
            <label className="block text-sm text-brand-text-secondary mb-1.5">Phone</label>
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
            <label className="block text-sm text-brand-text-secondary mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none"
              placeholder="Any special notes..."
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
              'Create Booking'
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
      setError(err?.message || 'Failed to block slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Block Slot (External)</h2>
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
            <label className="block text-sm text-brand-text-secondary mb-1.5">Room</label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
              required
            >
              <option value="">Select room...</option>
              {rooms.filter((r) => r.isActive !== false).map((r: any) => (
                <option key={r._id} value={r._id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">Time</label>
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
                <p className="text-xs text-brand-text-secondary mb-1">Or enter custom time:</p>
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
                  No slots configured for this date. Enter time manually.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">Source</label>
            <select
              value={form.externalSource}
              onChange={(e) => setForm({ ...form, externalSource: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
            >
              <option value="escapeall">EscapeAll</option>
              <option value="phone">Phone Reservation</option>
              <option value="walkin">Walk-In</option>
              <option value="private_event">Private Event</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">Customer Name (optional)</label>
            <input
              type="text"
              value={form.playerName}
              onChange={(e) => setForm({ ...form, playerName: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="block text-sm text-brand-text-secondary mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none"
              placeholder="Additional details..."
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
              'Block Slot'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
