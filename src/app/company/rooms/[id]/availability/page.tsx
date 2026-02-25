'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Check,
  X,
  Clock,
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function RoomAvailabilityPage() {
  const params = useParams();
  const { company } = useCompanyAuth();
  const roomId = params.id as string;

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const slots = useQuery(
    api.companies.getRoomSlots,
    roomId && selectedDate ? { roomId: roomId as any, date: selectedDate } : 'skip'
  );

  const setSlotsMutation = useMutation(api.companies.setSlots);

  const [editSlots, setEditSlots] = useState<
    { time: string; price: number; available: boolean }[]
  >([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync slots when data loads
  const slotsKey = JSON.stringify(slots);
  useMemo(() => {
    if (slots && !editing) {
      setEditSlots(
        slots.map((s: any) => ({
          time: s.time,
          price: s.price,
          available: s.available,
        }))
      );
    }
  }, [slotsKey, editing]);

  // Calendar
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

  const selectedDayNum = parseInt(selectedDate.split('-')[2]);
  const isSelectedMonth = selectedDate.startsWith(
    `${year}-${String(month + 1).padStart(2, '0')}`
  );

  const handleSelectDay = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(d);
    setEditing(false);
  };

  const handleStartEdit = () => {
    setEditing(true);
    // If no slots and room has defaults, prefill from defaults
    if (editSlots.length === 0 && room && (room as any).defaultTimeSlots) {
      setEditSlots(
        ((room as any).defaultTimeSlots as { time: string; price: number }[]).map(
          (s) => ({ time: s.time, price: s.price, available: true })
        )
      );
    }
  };

  const addSlot = () => {
    setEditSlots((prev) => [
      ...prev,
      { time: '', price: room?.price || 15, available: true },
    ]);
  };

  const updateSlot = (idx: number, field: string, value: any) => {
    setEditSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const removeSlot = (idx: number) => {
    setEditSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setSlotsMutation({
        roomId: roomId as any,
        date: selectedDate,
        slots: editSlots.filter((s) => s.time),
      });
      setEditing(false);
    } catch (err) {
      alert('Failed to save slots');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/company/rooms"
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Availability</h1>
          <p className="text-brand-text-secondary mt-1">
            {room?.title || 'Loading...'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-white/5 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-white/5 rounded-lg"
            >
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

        {/* Slot Editor */}
        <div className="lg:col-span-2">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                    'en-US',
                    { weekday: 'long', month: 'long', day: 'numeric' }
                  )}
                </h2>
                <p className="text-sm text-brand-text-secondary">
                  {editSlots.length} time slots
                </p>
              </div>
              {!editing ? (
                <button
                  onClick={handleStartEdit}
                  className="btn-primary text-sm"
                >
                  Edit Slots
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary text-sm flex items-center gap-1.5"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {editSlots.length === 0 && !editing ? (
              <div className="text-center py-12 text-brand-text-secondary">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No slots configured for this date</p>
                <button
                  onClick={handleStartEdit}
                  className="mt-4 text-sm text-brand-red hover:underline"
                >
                  Set up time slots
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {editSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      slot.available
                        ? 'bg-brand-bg border-white/5'
                        : 'bg-red-900/10 border-red-500/10'
                    }`}
                  >
                    {editing ? (
                      <>
                        <input
                          type="time"
                          value={slot.time}
                          onChange={(e) =>
                            updateSlot(idx, 'time', e.target.value)
                          }
                          className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white focus:border-brand-red focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-brand-text-secondary text-sm">€</span>
                          <input
                            type="number"
                            value={slot.price}
                            onChange={(e) =>
                              updateSlot(
                                idx,
                                'price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white focus:border-brand-red focus:outline-none"
                            min={0}
                            step={0.5}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateSlot(idx, 'available', !slot.available)
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            slot.available
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {slot.available ? 'Open' : 'Closed'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlot(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold min-w-[60px]">
                          {slot.time}
                        </span>
                        <span className="text-brand-text-secondary">
                          €{slot.price}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ml-auto ${
                            slot.available
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {slot.available ? 'Available' : 'Unavailable'}
                        </span>
                      </>
                    )}
                  </div>
                ))}

                {editing && (
                  <button
                    type="button"
                    onClick={addSlot}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/10 text-sm text-brand-text-secondary hover:text-white hover:border-white/20 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Time Slot
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
