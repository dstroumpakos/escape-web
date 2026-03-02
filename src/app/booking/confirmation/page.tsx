'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
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
  UserPlus,
  Check,
  Send,
} from 'lucide-react';

function ConfirmationContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [inviteSent, setInviteSent] = useState<Record<string, boolean>>({});
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
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

  // Friends for invite
  const friends = useQuery(
    api.friends.listFriends,
    user?.id ? { userId: user.id as any } : 'skip'
  );
  const bookingForInvite = stripeBooking || null;
  const bookingIdForInvite = bookingForInvite?._id ?? null;
  const existingInvites = useQuery(
    api.friends.getBookingInvitesByBooking,
    bookingIdForInvite ? { bookingId: bookingIdForInvite as any } : 'skip'
  );
  const inviteToBooking = useMutation(api.friends.inviteToBooking);

  const handleInviteFriend = async (friendId: string) => {
    if (!bookingIdForInvite || !user?.id) return;
    setInviteLoading(friendId);
    try {
      await inviteToBooking({
        bookingId: bookingIdForInvite as any,
        inviterId: user.id as any,
        inviteeId: friendId as any,
      });
      setInviteSent((prev) => ({ ...prev, [friendId]: true }));
    } catch (err) {
      console.error(err);
    }
    setInviteLoading(null);
  };

  const alreadyInvited = (friendId: string) =>
    inviteSent[friendId] ||
    existingInvites?.some((i: any) => i.inviteeId === friendId);

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

        {/* Invite Friends */}
        {friends && friends.length > 0 && bookingIdForInvite && (
          <div className="card p-6 mb-8 text-left">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-red" />
              {t('friends.invite_to_booking')}
            </h3>
            <p className="text-sm text-brand-text-muted mb-4">
              {t('friends.invite_desc')}
            </p>
            <div className="space-y-2">
              {friends.map((friend: any) => (
                <div
                  key={friend._id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface/50"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border/30 flex items-center justify-center overflow-hidden shrink-0">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-brand-red">
                        {friend.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{friend.name}</span>
                  {alreadyInvited(friend._id) ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Check className="w-3.5 h-3.5" />
                      {t('friends.invited')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInviteFriend(friend._id)}
                      disabled={inviteLoading === friend._id}
                      className="flex items-center gap-1 text-xs bg-brand-red/10 text-brand-red hover:bg-brand-red/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {inviteLoading === friend._id ? (
                        <div className="w-3.5 h-3.5 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {t('friends.invite')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
