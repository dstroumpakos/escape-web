'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle,
  Calendar,
  Clock,
  Users,
  DoorOpen,
  Ticket,
  CreditCard,
} from 'lucide-react';

function ConfirmationContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const bookingCode = searchParams.get('bookingCode') || '';
  const roomId = searchParams.get('roomId') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const players = searchParams.get('players') || '2';
  const total = searchParams.get('total') || '0';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const sessionId = searchParams.get('session_id') || '';

  // If returning from Stripe, fetch booking by session ID
  const stripeBooking = useQuery(
    api.bookings.getByStripeSession,
    sessionId ? { stripeSessionId: sessionId } : 'skip'
  );

  // Determine values — Stripe return takes priority over URL params
  const finalBookingCode = stripeBooking?.bookingCode || bookingCode;
  const finalRoomId = stripeBooking?.roomId || roomId;
  const finalDate = stripeBooking?.date || date;
  const finalTime = stripeBooking?.time || time;
  const finalPlayers = stripeBooking?.players?.toString() || players;
  const finalTotal = stripeBooking?.total?.toString() || total;
  const finalPaymentStatus =
    stripeBooking?.paymentStatus ||
    paymentStatus ||
    (sessionId ? 'paid' : 'paid');

  const room = useQuery(
    api.rooms.getById,
    stripeBooking?.room ? 'skip' : (finalRoomId ? { id: finalRoomId as any } : 'skip')
  );
  const roomData = stripeBooking?.room || room;

  const paymentBadge: Record<string, { label: string; color: string }> = {
    paid: { label: t('confirmation.paid_full'), color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    deposit: { label: t('confirmation.deposit_paid'), color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    unpaid: { label: t('confirmation.pay_arrival'), color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    na: { label: t('confirmation.pay_arrival'), color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  };

  const badge = paymentBadge[finalPaymentStatus] || paymentBadge.paid;

  // Show loading if we're waiting for Stripe booking data
  if (sessionId && !stripeBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Success icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">{t('confirmation.title')}</h1>
          <p className="text-brand-text-secondary">
            {t('confirmation.subtitle')}
          </p>
        </div>

        {/* Booking Card */}
        <div className="card p-6 md:p-8 text-left mb-8">
          {/* Room title */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">{roomData?.title || 'Escape Room'}</h2>
              <p className="text-sm text-brand-text-muted">{roomData?.location}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-brand-surface rounded-xl p-4">
              <Calendar className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">{t('confirmation.date')}</div>
              <div className="text-sm font-medium">
                {finalDate ? new Date(finalDate + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }) : '—'}
              </div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4">
              <Clock className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">{t('confirmation.time')}</div>
              <div className="text-sm font-medium">{finalTime}</div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4">
              <Users className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">{t('confirmation.players')}</div>
              <div className="text-sm font-medium">{finalPlayers} players</div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4">
              <CreditCard className="w-4 h-4 text-brand-red mb-1" />
              <div className="text-xs text-brand-text-muted">{t('confirmation.total')}</div>
              <div className="text-sm font-medium">€{finalTotal}</div>
            </div>
          </div>

          {/* Booking Code + QR */}
          <div className="bg-brand-dark rounded-xl p-6 text-center border border-brand-border">
            <div className="inline-block bg-white p-4 rounded-xl mb-4">
              <QRCodeSVG
                value={finalBookingCode || 'UNLOCKED'}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
                imageSettings={{
                  src: '/favicon.svg',
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>
            <div className="text-xs text-brand-text-muted mb-1">{t('confirmation.booking_code')}</div>
            <div className="text-2xl font-mono font-bold tracking-wider text-brand-red">
              {finalBookingCode}
            </div>
            <p className="text-xs text-brand-text-muted mt-2">
              {t('confirmation.code_hint')}
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
            {t('confirmation.view_tickets')}
          </Link>
          <Link
            href="/discover"
            className="btn-outline flex items-center justify-center gap-2"
          >
            <DoorOpen className="w-5 h-5" />
            {t('confirmation.explore_more')}
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
