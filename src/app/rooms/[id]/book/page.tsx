'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(2);

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

  const canProceed = selectedDate && selectedTime && isAuthenticated;

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
            Back to {room.title}
          </Link>

          <h1 className="section-heading mb-2">
            Book <span className="text-gradient">{room.title}</span>
          </h1>
          <p className="text-brand-text-secondary mb-10">
            Select your preferred date, time, and number of players.
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Calendar + Time */}
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Calendar className="w-5 h-5 text-brand-red" />
                    Select Date
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
                    Select Time
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot: any) => (
                      <button
                        key={slot.time}
                        disabled={slot.booked}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                          slot.booked
                            ? 'bg-brand-surface/50 text-brand-border cursor-not-allowed line-through'
                            : selectedTime === slot.time
                            ? 'bg-brand-red text-white'
                            : 'bg-brand-surface text-brand-text-secondary hover:text-white hover:bg-brand-surface/80 border border-brand-border hover:border-brand-red/30'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Count */}
              {selectedTime && (
                <div className="card p-6">
                  <h3 className="flex items-center gap-2 font-semibold mb-4">
                    <Users className="w-5 h-5 text-brand-red" />
                    Number of Players
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
                      ({room.players} allowed)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="font-semibold mb-4">Booking Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Room</span>
                    <span className="font-medium text-right max-w-[160px] truncate">{room.title}</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">Date</span>
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
                      <span className="text-brand-text-muted">Time</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">Players</span>
                      <span className="font-medium">{playerCount}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-brand-border mt-4 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-brand-text-muted">Total</span>
                    <span className="text-2xl font-display font-bold">€{totalPrice}</span>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <Link href="/login" className="btn-primary w-full text-center mt-6 block">
                    Log in to Book
                  </Link>
                ) : (
                  <button
                    disabled={!canProceed}
                    onClick={handleProceed}
                    className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    Proceed to Checkout
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
