'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket,
  Calendar,
  Clock,
  Users,
  MapPin,
  QrCode,
  X as XIcon,
  Navigation,
  DoorOpen,
  Camera,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

type TabType = 'upcoming' | 'past';

export default function TicketsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [expandedPhotos, setExpandedPhotos] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [payingBooking, setPayingBooking] = useState<string | null>(null);

  const bookings = useQuery(
    api.bookings.getByUser,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const cancelBooking = useMutation(api.bookings.cancel);
  const retryPayment = useAction(api.stripe.retryBookingPayment);

  // Photos for completed bookings
  const bookingsWithPhotos = useQuery(
    api.bookingPhotos.getBookingsWithPhotos,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  const upcoming = (bookings ?? []).filter((b: any) => b.status === 'upcoming' || b.status === 'pending_payment');
  const past = (bookings ?? []).filter((b: any) => b.status !== 'upcoming' && b.status !== 'pending_payment');
  const displayed = activeTab === 'upcoming' ? upcoming : past;

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await cancelBooking({ id: bookingId as any });
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setCancelling(null);
    }
  };

  const handleRetryPayment = async (bookingId: string) => {
    setPayingBooking(bookingId);
    try {
      const result = await retryPayment({
        bookingId: bookingId as any,
        successUrl: `${window.location.origin}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/tickets`,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Failed to retry payment:', err);
      alert('Failed to create payment session. The booking may have expired.');
    } finally {
      setPayingBooking(null);
    }
  };

  const paymentBadge: Record<string, { label: string; color: string }> = {
    paid: { label: t('tickets.paid'), color: 'bg-green-500/20 text-green-400' },
    deposit: { label: t('tickets.deposit'), color: 'bg-yellow-500/20 text-yellow-400' },
    unpaid: { label: t('tickets.pay_on_arrival'), color: 'bg-orange-500/20 text-orange-400' },
    na: { label: '', color: '' },
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-6">
            <Ticket className="w-8 h-8 text-brand-red" />
          </div>
          <h1 className="section-heading mb-4">
            {t('tickets.title')}
          </h1>
          <p className="text-lg text-brand-text-secondary max-w-xl mx-auto">
            {t('tickets.subtitle')}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-card border border-brand-border text-brand-text-secondary hover:text-white'
              }`}
            >
              {t('tickets.upcoming', { count: String(upcoming.length) })}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'past'
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-card border border-brand-border text-brand-text-secondary hover:text-white'
              }`}
            >
              {t('tickets.past', { count: String(past.length) })}
            </button>
          </div>

          {!bookings ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
              <p className="text-brand-text-muted">{t('tickets.loading')}</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20">
              <Ticket className="w-16 h-16 text-brand-border mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {activeTab === 'upcoming' ? t('tickets.no_upcoming') : t('tickets.no_past')}
              </h3>
              <p className="text-brand-text-muted mb-6">
                {activeTab === 'upcoming'
                  ? 'You don\'t have any upcoming bookings yet.'
                  : 'Your past bookings will appear here.'}
              </p>
              <Link href="/discover" className="btn-primary inline-flex items-center gap-2">
                <DoorOpen className="w-5 h-5" />
                {t('tickets.discover_rooms')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((booking: any) => {
                const badge = paymentBadge[booking.paymentStatus] || paymentBadge.na;
                return (
                  <div
                    key={booking._id}
                    className={`card p-5 md:p-6 ${
                      booking.status === 'cancelled' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Room info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold truncate">
                            {booking.room?.title || 'Unknown Room'}
                          </h3>
                          {booking.status === 'cancelled' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                              {t('tickets.cancelled')}
                            </span>
                          )}
                          {booking.status === 'pending_payment' && (
                            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                              <AlertCircle className="w-3 h-3" />
                              {t('tickets.pending_payment')}
                            </span>
                          )}
                          {badge.label && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        {booking.room?.location && (
                          <div className="flex items-center gap-1.5 text-sm text-brand-text-muted mb-3">
                            <MapPin className="w-3.5 h-3.5" />
                            {booking.room.location}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-brand-text-secondary">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {booking.time}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {booking.players} {t('tickets.players')}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {booking.status === 'pending_payment' && (
                          <>
                            <button
                              disabled={payingBooking === booking._id}
                              onClick={() => handleRetryPayment(booking._id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-all disabled:opacity-50 animate-pulse hover:animate-none"
                            >
                              {payingBooking === booking._id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CreditCard className="w-4 h-4" />
                              )}
                              {t('tickets.pay_now')}
                            </button>
                            <button
                              disabled={cancelling === booking._id}
                              onClick={() => handleCancel(booking._id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm font-medium hover:bg-red-900/30 transition-all disabled:opacity-50"
                            >
                              {cancelling === booking._id ? (
                                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                              ) : (
                                <XIcon className="w-4 h-4" />
                              )}
                              {t('tickets.cancel')}
                            </button>
                          </>
                        )}
                        {booking.status === 'upcoming' && (
                          <>
                            <button
                              onClick={() =>
                                setShowQR(showQR === booking._id ? null : booking._id)
                              }
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-sm font-medium hover:border-brand-red/30 transition-all"
                            >
                              <QrCode className="w-4 h-4" />
                              {t('tickets.qr')}
                            </button>
                            <button
                              disabled={cancelling === booking._id}
                              onClick={() => handleCancel(booking._id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm font-medium hover:bg-red-900/30 transition-all disabled:opacity-50"
                            >
                              {cancelling === booking._id ? (
                                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                              ) : (
                                <XIcon className="w-4 h-4" />
                              )}
                              {t('tickets.cancel')}
                            </button>
                          </>
                        )}
                        {booking.status === 'completed' && (
                          <Link
                            href={`/rooms/${booking.roomId}`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-all"
                          >
                            <Star className="w-4 h-4" />
                            {t('tickets.write_review')}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* QR Code section */}
                    {showQR === booking._id && (
                      <div className="mt-4 pt-4 border-t border-brand-border text-center">
                        <div className="inline-block bg-white p-4 rounded-xl">
                          <QRCodeSVG
                            value={booking.bookingCode || 'UNLOCKED'}
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
                        <div className="mt-3">
                          <div className="text-xs text-brand-text-muted">{t('tickets.booking_code')}</div>
                          <div className="text-lg font-mono font-bold tracking-wider text-brand-red">
                            {booking.bookingCode}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══ Your Escape Moments (Photo Gallery) ═══ */}
      {bookingsWithPhotos && bookingsWithPhotos.length > 0 && (
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('tickets.escape_moments')}</h2>
                <p className="text-xs text-brand-text-muted">{t('tickets.escape_moments_desc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {bookingsWithPhotos.map((booking: any) => {
                const isExpanded = expandedPhotos === booking._id;
                return (
                  <div key={booking._id} className="card overflow-hidden">
                    {/* Header */}
                    <div
                      className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedPhotos(isExpanded ? null : booking._id)}
                    >
                      {/* Thumbnail */}
                      {booking.photos[0] && (
                        <img
                          src={booking.photos[0].processedUrl || booking.photos[0].originalUrl}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{booking.room?.title || 'Escape Room'}</h3>
                        <div className="flex items-center gap-3 text-xs text-brand-text-muted mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {booking.photoCount} {t('tickets.photos')}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-brand-text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-brand-text-muted shrink-0" />
                      )}
                    </div>

                    {/* Photo Grid */}
                    {isExpanded && (
                      <div className="border-t border-brand-border p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {booking.photos.map((photo: any) => (
                            <div
                              key={photo._id}
                              className="relative group rounded-xl overflow-hidden aspect-square bg-brand-bg cursor-pointer"
                              onClick={() => setPhotoPreviewUrl(photo.processedUrl || photo.originalUrl)}
                            >
                              <img
                                src={photo.processedUrl || photo.originalUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <a
                                  href={photo.processedUrl || photo.originalUrl}
                                  download
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                                >
                                  <Download className="w-5 h-5 text-white" />
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.share) {
                                      navigator.share({
                                        title: booking.room?.title || 'Escape Moments',
                                        url: photo.processedUrl || photo.originalUrl,
                                      });
                                    }
                                  }}
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                                >
                                  <Share2 className="w-5 h-5 text-white" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Photo Preview Modal */}
      {photoPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPhotoPreviewUrl(null)}
        >
          <button
            onClick={() => setPhotoPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <XIcon className="w-6 h-6 text-white" />
          </button>
          <img
            src={photoPreviewUrl}
            alt=""
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 flex gap-3">
            <a
              href={photoPreviewUrl}
              download
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" /> {t('tickets.download')}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
