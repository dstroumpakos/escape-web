'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
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
  const { t } = useTranslation();

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
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [alertLoading, setAlertLoading] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Fetch user data (to check phone)
  const convexUser = useQuery(
    api.users.getById,
    user?.id ? { userId: user.id as any } : 'skip'
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

  // Slot alerts for current user + room + date
  const slotAlerts = useQuery(
    api.slotAlerts.getByUserRoomDate,
    user?.id && roomId && selectedDate
      ? { userId: user.id as any, roomId: roomId as any, date: selectedDate }
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

  // Available time slots: combine default + custom, exclude booked
  const availableSlots = useMemo(() => {
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
  }, [timeSlots, bookedTimes, room]);

  const canProceed = selectedDate && selectedTime && isAuthenticated && userHasPhone;

  const alertedTimes = new Set((slotAlerts ?? []).map((a: any) => a.time));

  const handleToggleAlert = async (time: string) => {
    if (!user?.id || !roomId || !selectedDate) return;
    setAlertLoading(time);
    try {
      await toggleSlotAlert({
        userId: user.id as any,
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
      total: String(totalPrice),
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href={`/rooms/${roomId}`}
            className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('book.back_to_room', { room: room.title })}
          </Link>

          <h1 className="section-heading mb-2">
            {t('book.title')} <span className="text-gradient">{room.title}</span>
          </h1>
          <p className="text-brand-text-secondary mb-10">
            {t('book.subtitle')}
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Calendar + Time */}
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Calendar className="w-5 h-5 text-brand-red" />
                    {t('book.select_date')}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-brand-surface transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium min-w-[140px] text-center">
                      {MONTHS[currentMonth]} {currentYear}
                    </span>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-brand-surface transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs text-brand-text-muted py-2 font-medium">
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
                        className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                          isPast
                            ? 'text-brand-border cursor-not-allowed'
                            : isSelected
                            ? 'bg-brand-red text-white'
                            : isToday
                            ? 'bg-brand-red/20 text-brand-red hover:bg-brand-red hover:text-white'
                            : 'hover:bg-brand-surface text-brand-text-secondary hover:text-white'
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
                <div className="card p-6">
                  <h3 className="flex items-center gap-2 font-semibold mb-4">
                    <Clock className="w-5 h-5 text-brand-red" />
                    {t('book.select_time')}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot: any) => (
                      <div key={slot.time} className="relative">
                        <button
                          disabled={slot.booked}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                            slot.booked
                              ? 'bg-brand-surface/50 text-brand-border cursor-not-allowed line-through'
                              : selectedTime === slot.time
                              ? 'bg-brand-red text-white'
                              : 'bg-brand-surface text-brand-text-secondary hover:text-white hover:bg-brand-surface/80 border border-brand-border hover:border-brand-red/30'
                          }`}
                        >
                          {slot.time}
                        </button>
                        {slot.booked && user?.id && (
                          <button
                            onClick={() => handleToggleAlert(slot.time)}
                            disabled={alertLoading === slot.time}
                            title={alertedTimes.has(slot.time) ? t('book.alert_on') : t('book.alert_off')}
                            className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              alertedTimes.has(slot.time)
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                                : 'bg-brand-surface border border-white/10 text-brand-text-secondary hover:border-yellow-500/50 hover:text-yellow-400'
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
                <div className="card p-6">
                  <h3 className="flex items-center gap-2 font-semibold mb-4">
                    <Users className="w-5 h-5 text-brand-red" />
                    {t('book.num_players')}
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      disabled={playerCount <= (room.playersMin || 1)}
                      onClick={() => setPlayerCount((c) => c - 1)}
                      className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-lg hover:border-brand-red/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      −
                    </button>
                    <span className="text-2xl font-display font-bold min-w-[40px] text-center">
                      {playerCount}
                    </span>
                    <button
                      disabled={playerCount >= (room.playersMax || 10)}
                      onClick={() => setPlayerCount((c) => c + 1)}
                      className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-lg hover:border-brand-red/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
              <div className="card p-6 sticky top-24">
                <h3 className="font-semibold mb-4">{t('book.summary')}</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">{t('book.room')}</span>
                    <span className="font-medium text-right max-w-[160px] truncate">{room.title}</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">{t('book.date')}</span>
                      <span className="font-medium">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">{t('book.time')}</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">{t('book.players')}</span>
                      <span className="font-medium">{playerCount}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-brand-border mt-4 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-brand-text-muted">{t('book.total')}</span>
                    <span className="text-2xl font-display font-bold">€{totalPrice}</span>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <Link href="/login" className="btn-primary w-full text-center mt-6 block">
                    {t('book.login_to_book')}
                  </Link>
                ) : !userHasPhone && selectedDate && selectedTime ? (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                      <Phone className="w-4 h-4 text-brand-red" />
                      <span>{t('book.phone_required')}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+30 6XX XXX XXXX"
                        className="flex-1 bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
                      />
                      <button
                        disabled={!phoneInput.trim() || savingPhone}
                        onClick={async () => {
                          if (!phoneInput.trim() || !user?.id) return;
                          setSavingPhone(true);
                          try {
                            await updateProfile({ userId: user.id as any, phone: phoneInput.trim() });
                          } catch { /* ignore */ }
                          setSavingPhone(false);
                        }}
                        className="btn-primary !py-3 !px-5 flex items-center justify-center gap-1.5 disabled:opacity-50 text-sm"
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
