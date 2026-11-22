'use client';

import { useState, useMemo } from 'react';
import { isSlotPast, slotClosedReason, useNow } from '@/lib/slotTime';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Bell,
  BellOff,
  Phone,
} from 'lucide-react';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useTranslation();

  const MONTHS = [
    t('common.month_1'), t('common.month_2'), t('common.month_3'), t('common.month_4'),
    t('common.month_5'), t('common.month_6'), t('common.month_7'), t('common.month_8'),
    t('common.month_9'), t('common.month_10'), t('common.month_11'), t('common.month_12'),
  ];
  const DAYS = [
    t('common.day_sun'), t('common.day_mon'), t('common.day_tue'), t('common.day_wed'),
    t('common.day_thu'), t('common.day_fri'), t('common.day_sat'),
  ];

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');

  const today = new Date();
  // ?date=YYYY-MM-DD&time=HH:MM (from an offer card) preselects that slot.
  const searchParams = useSearchParams();
  const qDate = searchParams.get('date');
  const qTime = searchParams.get('time');
  const isDigits = (x: string) => x.length > 0 && [...x].every((c) => c >= '0' && c <= '9');
  const dParts = (qDate || '').split('-');
  const initialDate =
    dParts.length === 3 && dParts[0].length === 4 && dParts[1].length === 2 && dParts[2].length === 2 && dParts.every(isDigits)
      ? qDate
      : null;
  const tParts = (qTime || '').split(':');
  const validTime = tParts.length === 2 && tParts[1].length === 2 && tParts[0].length <= 2 && tParts.every(isDigits);
  const [currentMonth, setCurrentMonth] = useState(initialDate ? parseInt(initialDate.slice(5, 7), 10) - 1 : today.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate ? parseInt(initialDate.slice(0, 4), 10) : today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(
    initialDate && validTime ? qTime : null
  );
  const [playerCount, setPlayerCount] = useState(2);
  const [alertLoading, setAlertLoading] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Fetch user data (to check phone)
  const convexUser = useQuery(
    api.users.getById,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );
  const updateProfile = useMutation(api.users.updateProfile);
  const userHasPhone = !!(convexUser as any)?.phone;

  // Get time slots for selected date
  const timeSlots = useQuery(
    api.timeSlots.getByRoomAndDate,
    selectedDate ? { roomId: roomId as any, date: selectedDate } : 'skip'
  );

  // Get booked times for selected date
  const bookedTimes = useQuery(
    api.bookings.getBookedTimes,
    selectedDate ? { roomId: roomId as any, date: selectedDate } : 'skip'
  );

  // Last-minute offers on this date (the discount itself is applied by the server)
  const offers = useQuery(
    api.slotOffers.forRoomDate,
    selectedDate ? { roomId: roomId as any, date: selectedDate } : 'skip'
  );
  const offerFor = (time: string | null) =>
    (time && (offers ?? []).find((o: { time: string; percent: number }) => o.time === time)?.percent) || 0;

  // Slot alerts for current user + room + date
  const slotAlerts = useQuery(
    api.slotAlerts.getByUserRoomDate,
    user?.sessionToken && roomId && selectedDate
      ? { sessionToken: user.sessionToken, roomId: roomId as any, date: selectedDate }
      : 'skip'
  );
  const toggleSlotAlert = useMutation(api.slotAlerts.toggle);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Nothing to book in the past, so the calendar can't page back before this month
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const handleDayClick = (day: number) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const isPastDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!room) return 0;
    if (room.pricePerGroup && room.pricePerGroup.length > 0) {
      const match = room.pricePerGroup.find((pg: any) => pg.players === playerCount);
      return match ? match.price : room.price * playerCount;
    }
    return room.price * playerCount;
  }, [room, playerCount]);
  const offerPercent = offerFor(selectedTime);
  const finalPrice = offerPercent ? Math.round(totalPrice * (100 - offerPercent)) / 100 : totalPrice;

  // Available time slots: combine default + custom, exclude booked.
  // Times that have already started are dropped, and so are free times inside the
  // last hour unless the time right before them is booked (see slotClosedReason).
  const now = useNow();
  const availableSlots = useMemo(() => {
    const slots = computeSlots();
    if (!selectedDate) return slots;
    const bookedSet = new Set((bookedTimes ?? []) as string[]);
    const allTimes = new Set<string>([
      ...((timeSlots && timeSlots.length > 0 ? timeSlots : room?.defaultTimeSlots || []) as any[]).map((s) => s.time),
      ...slots.map((s: { time: string }) => s.time),
      ...bookedSet,
    ]);
    return slots.filter((s: { time: string; booked: boolean }) =>
      s.booked
        ? !isSlotPast(selectedDate, s.time, now)
        : slotClosedReason(selectedDate, s.time, allTimes, bookedSet, now) === null
    );
  },[timeSlots, bookedTimes, room, selectedDate, now]); // eslint-disable-line react-hooks/exhaustive-deps

  function computeSlots() {
    const bookedSet = new Set((bookedTimes ?? []) as string[]);

    // If there are custom time slots for this date, use those
    if (timeSlots && timeSlots.length > 0) {
      return timeSlots
        .filter((s: any) => s.available)
        .map((s: any) => ({
          time: s.time,
          price: s.price,
          booked: bookedSet.has(s.time),
        }));
    }

    // Otherwise fallback to room's default time slots
    if (room?.defaultTimeSlots && room.defaultTimeSlots.length > 0) {
      return room.defaultTimeSlots.map((s: any) => ({
        time: s.time,
        price: s.price,
        booked: bookedSet.has(s.time),
      }));
    }

    // Fallback: generic slots
    return ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((t) => ({
      time: t,
      price: room?.price ?? 0,
      booked: bookedSet.has(t),
    }));
  }

  const canProceed = selectedDate && selectedTime && isAuthenticated && userHasPhone;

  const alertedTimes = new Set((slotAlerts ?? []).map((a: any) => a.time));

  const handleToggleAlert = async (time: string) => {
    if (!user?.id || !roomId || !selectedDate) return;
    setAlertLoading(time);
    try {
      await toggleSlotAlert({
        sessionToken: user.sessionToken,
        roomId: roomId as any,
        date: selectedDate,
        time,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAlertLoading(null);
    }
  };

  const handleProceed = () => {
    if (!canProceed) return;
    const params = new URLSearchParams({
      roomId,
      date: selectedDate!,
      time: selectedTime!,
      players: String(playerCount),
      total: String(finalPrice),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <section className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href={`/rooms/${roomId}`}
            className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-bone transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('book.back_to_room', { room: room.title })}
          </Link>

          <div className="horror-label mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-brand-red/60" />
            {t('book.title')}
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black leading-[1.05] text-brand-bone text-balance mb-3 [text-shadow:0_2px_0_rgba(0,0,0,0.8),0_0_30px_rgba(var(--glow),0.18)]">
            {room.title}
          </h1>
          <p className="text-brand-text-secondary mb-10">
            {t('book.subtitle')}
          </p>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Left: Calendar + Time */}
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar */}
              <div className="panel p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h3 className="flex items-center gap-2.5 text-lg font-display font-bold text-brand-bone">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-brand-red/50 bg-brand-red/10 font-type text-xs text-brand-red-light">1</span>
                    {t('book.select_date')}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevMonth}
                      disabled={isCurrentMonth}
                      aria-label="Previous month"
                      className="p-2 rounded-md border border-brand-border text-brand-text-secondary hover:border-brand-red/60 hover:text-brand-bone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-brand-bone min-w-[130px] text-center">
                      {MONTHS[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={nextMonth}
                      aria-label="Next month"
                      className="p-2 rounded-md border border-brand-border text-brand-text-secondary hover:border-brand-red/60 hover:text-brand-bone transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center font-type text-[11px] tracking-[0.12em] text-brand-text-muted py-2">
                      {d}
                    </div>
                  ))}
                  {calendarDays.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isPast = isPastDay(day);
                    const isSelected = selectedDate === dateStr;
                    const isToday =
                      day === today.getDate() &&
                      currentMonth === today.getMonth() &&
                      currentYear === today.getFullYear();

                    return (
                      <button
                        key={i}
                        disabled={isPast}
                        onClick={() => handleDayClick(day)}
                        aria-pressed={isSelected}
                        className={`aspect-square sm:aspect-[4/3] rounded-md border text-sm font-medium tabular-nums transition-all duration-200 ${
                          isPast
                            ? 'border-brand-border/30 text-brand-text-muted/50 line-through decoration-brand-border cursor-not-allowed'
                            : isSelected
                            ? 'border-brand-red-light/60 bg-brand-red text-brand-bone shadow-[0_0_18px_rgba(var(--glow),0.6)]'
                            : isToday
                            ? 'border-brand-red/60 bg-brand-red/10 text-brand-red-light hover:bg-brand-red/25 hover:text-brand-bone'
                            : 'border-brand-border/70 bg-black/30 text-brand-text hover:border-brand-red/60 hover:bg-brand-red/10 hover:text-brand-bone'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="panel p-5 sm:p-6">
                  <h3 className="flex items-center gap-2.5 text-lg font-display font-bold text-brand-bone mb-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-brand-red/50 bg-brand-red/10 font-type text-xs text-brand-red-light">2</span>
                    {t('book.select_time')}
                  </h3>
                  {availableSlots.length === 0 && (
                    <p className="text-sm text-brand-text-secondary">{t('cx.book.no_times_left')}</p>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {availableSlots.map((slot: any) => (
                      <div key={slot.time} className="relative">
                        <button
                          disabled={slot.booked}
                          onClick={() => setSelectedTime(slot.time)}
                          aria-pressed={selectedTime === slot.time}
                          className={`w-full py-3 px-2 rounded-md border text-sm font-semibold tabular-nums transition-all duration-200 ${
                            slot.booked
                              ? 'border-brand-border/50 bg-black/20 text-brand-text-muted/60 cursor-not-allowed line-through'
                              : selectedTime === slot.time
                              ? 'border-brand-red-light/60 bg-brand-red text-brand-bone shadow-[0_0_18px_rgba(var(--glow),0.6)]'
                              : 'border-brand-border bg-black/30 text-brand-text hover:border-brand-red/60 hover:bg-brand-red/10 hover:text-brand-bone'
                          }`}
                        >
                          {slot.time}
                          {!slot.booked && offerFor(slot.time) > 0 && (
                            <span className="block text-[11px] font-bold text-brand-gold leading-tight">-{offerFor(slot.time)}%</span>
                          )}
                        </button>
                        {slot.booked && user?.id && (
                          <button
                            onClick={() => handleToggleAlert(slot.time)}
                            disabled={alertLoading === slot.time}
                            title={alertedTimes.has(slot.time) ? t('book.alert_on') : t('book.alert_off')}
                            className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              alertedTimes.has(slot.time)
                                ? 'bg-brand-gold text-black shadow-[0_0_12px_rgba(201,154,46,0.6)]'
                                : 'bg-brand-card border border-brand-border text-brand-text-secondary hover:border-brand-gold/60 hover:text-brand-gold'
                            }`}
                          >
                            {alertLoading === slot.time ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : alertedTimes.has(slot.time) ? (
                              <Bell className="w-3 h-3" />
                            ) : (
                              <BellOff className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Count */}
              {selectedTime && (
                <div className="panel p-5 sm:p-6">
                  <h3 className="flex items-center gap-2.5 text-lg font-display font-bold text-brand-bone mb-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-brand-red/50 bg-brand-red/10 font-type text-xs text-brand-red-light">3</span>
                    {t('book.num_players')}
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      disabled={playerCount <= (room.playersMin || 1)}
                      onClick={() => setPlayerCount((c) => c - 1)}
                      className="w-11 h-11 rounded-md bg-black/30 border border-brand-border flex items-center justify-center font-bold text-lg text-brand-bone hover:border-brand-red/60 hover:bg-brand-red/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      −
                    </button>
                    <span className="text-3xl font-display font-black text-brand-bone tabular-nums min-w-[44px] text-center">
                      {playerCount}
                    </span>
                    <button
                      disabled={playerCount >= (room.playersMax || 10)}
                      onClick={() => setPlayerCount((c) => c + 1)}
                      className="w-11 h-11 rounded-md bg-black/30 border border-brand-border flex items-center justify-center font-bold text-lg text-brand-bone hover:border-brand-red/60 hover:bg-brand-red/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      +
                    </button>
                    <span className="text-sm text-brand-text-muted">
                      {t('book.players_allowed', { range: room.players })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-1">
              <div className="panel p-6 lg:sticky lg:top-28">
                <h3 className="horror-label mb-5">{t('book.summary')}</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0 text-brand-text-muted">{t('book.room')}</span>
                    <span className="font-medium text-brand-bone text-right">{room.title}</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between gap-4">
                      <span className="text-brand-text-muted">{t('book.date')}</span>
                      <span className="font-medium text-brand-bone tabular-nums">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString(language === 'en' ? 'en-GB' : language, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between gap-4">
                      <span className="text-brand-text-muted">{t('book.time')}</span>
                      <span className="font-medium text-brand-bone tabular-nums">{selectedTime}</span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between gap-4">
                      <span className="text-brand-text-muted">{t('book.players')}</span>
                      <span className="font-medium text-brand-bone tabular-nums">{playerCount}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-brand-border mt-4 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-brand-text-muted">{t('book.total')}</span>
                    <span className="text-3xl font-display font-black text-brand-bone tabular-nums">€{finalPrice}</span>
                  </div>
                  {offerPercent > 0 && (
                    <p className="mt-2 text-right text-xs text-brand-gold">
                      <span className="line-through text-brand-text-muted mr-2 tabular-nums">€{totalPrice}</span>
                      {t('offers.badge', { percent: String(offerPercent) })}
                    </p>
                  )}
                </div>

                {!isAuthenticated ? (
                  <Link href="/login" className="btn-primary w-full text-center mt-6 block">
                    {t('book.login_to_book')}
                  </Link>
                ) : !userHasPhone && selectedDate && selectedTime ? (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                      <Phone className="w-4 h-4 text-brand-red-light" />
                      <span>{t('book.phone_required')}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+30 6XX XXX XXXX"
                        className="input-field flex-1 min-w-0 text-sm"
                      />
                      <button
                        disabled={!phoneInput.trim() || savingPhone}
                        onClick={async () => {
                          if (!phoneInput.trim() || !user?.id) return;
                          setSavingPhone(true);
                          try {
                            await updateProfile({ sessionToken: user.sessionToken, phone: phoneInput.trim() });
                          } catch { /* ignore */ }
                          setSavingPhone(false);
                        }}
                        className="btn-primary py-3! px-5! flex items-center justify-center gap-1.5 disabled:opacity-50 text-sm"
                      >
                        {savingPhone ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          t('book.save_phone')
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    disabled={!canProceed}
                    onClick={handleProceed}
                    className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    {t('book.proceed_checkout')}
                    <DoorOpen className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
