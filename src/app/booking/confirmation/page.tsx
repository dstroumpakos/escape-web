'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  CheckCircle,
  Calendar,
  Clock,
  Users,
  DoorOpen,
  QrCode,
  Share2,
  Ticket,
  CreditCard,
} from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingCode = searchParams.get('bookingCode') || '';
  const roomId = searchParams.get('roomId') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const players = searchParams.get('players') || '2';
  const total = searchParams.get('total') || '0';
  const paymentStatus = searchParams.get('paymentStatus') || 'paid';

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');

  const paymentBadge: Record<string, { label: string; color: string }> = {
    paid: { label: 'Paid in Full', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    deposit: { label: '20% Deposit Paid', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    unpaid: { label: 'Pay on Arrival', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  };

  const badge = paymentBadge[paymentStatus] || paymentBadge.paid;

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Success icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-brand-text-secondary">
            Your escape room adventure is booked. Get ready for an unforgettable experience!
          </p>
        </div>

        {/* Booking Card */}
        <div className="card p-6 md:p-8 text-left mb-8">
          {/* Room title */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">{room?.title || 'Escape Room'}</h2>
              <p className="text-sm text-brand-text-muted">{room?.location}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-brand-surface rounded-xl p-4">
              <Calendar className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">Date</div>
              <div className="text-sm font-medium">
                {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }) : '—'}
              </div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4">
              <Clock className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">Time</div>
              <div className="text-sm font-medium">{time}</div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4">
              <Users className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">Players</div>
              <div className="text-sm font-medium">{players} players</div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4">
              <CreditCard className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">Total</div>
              <div className="text-sm font-medium">€{total}</div>
            </div>
          </div>

          {/* Booking Code */}
          <div className="bg-brand-dark rounded-xl p-6 text-center border border-brand-border">
            <QrCode className="w-12 h-12 text-brand-red mx-auto mb-3" />
            <div className="text-xs text-brand-text-muted mb-1">Booking Code</div>
            <div className="text-2xl font-mono font-bold tracking-wider text-brand-red">
              {bookingCode}
            </div>
            <p className="text-xs text-brand-text-muted mt-2">
              Present this code or your QR ticket at the venue
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tickets"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Ticket className="w-5 h-5" />
            View My Tickets
          </Link>
          <Link
            href="/discover"
            className="btn-outline flex items-center justify-center gap-2"
          >
            <DoorOpen className="w-5 h-5" />
            Explore More Rooms
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
