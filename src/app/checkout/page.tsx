'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  CreditCard,
  Shield,
  Lock,
  ArrowLeft,
  DoorOpen,
  CheckCircle,
  Tag,
} from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const roomId = searchParams.get('roomId') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const players = parseInt(searchParams.get('players') || '2');
  const total = parseFloat(searchParams.get('total') || '0');

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');
  const createBooking = useMutation(api.bookings.create);
  const createBookingCheckout = useAction(api.stripe.createBookingCheckout);

  const [paymentTerms, setPaymentTerms] = useState<'full' | 'deposit_20' | 'pay_on_arrival'>('full');
  const [promoCode, setPromoCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const serviceFee = 3.99;
  const deposit = paymentTerms === 'deposit_20' ? Math.round(total * 0.2 * 100) / 100 : 0;
  const payNow =
    paymentTerms === 'full'
      ? total + serviceFee
      : paymentTerms === 'deposit_20'
      ? deposit + serviceFee
      : serviceFee;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async () => {
    if (!user || !roomId || !date || !time) return;
    setIsLoading(true);
    setError('');

    try {
      if (paymentTerms === 'pay_on_arrival') {
        // No Stripe needed — create booking directly
        const result = await createBooking({
          userId: user.id as any,
          roomId: roomId as any,
          date,
          time,
          players,
          total,
          paymentTerms,
        });

        const params = new URLSearchParams({
          bookingCode: (result as any).bookingCode,
          roomId,
          date,
          time,
          players: String(players),
          total: String(total),
          paymentStatus: 'unpaid',
        });
        router.push(`/booking/confirmation?${params.toString()}`);
      } else {
        // Stripe checkout for full or deposit_20
        const baseUrl = window.location.origin;
        const confirmParams = new URLSearchParams({
          roomId,
          date,
          time,
          players: String(players),
          total: String(total),
        });
        const successUrl = `${baseUrl}/booking/confirmation?${confirmParams.toString()}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/checkout?${new URLSearchParams({ roomId, date, time, players: String(players), total: String(total) }).toString()}`;

        const { url } = await createBookingCheckout({
          userId: user.id as any,
          roomId: roomId as any,
          date,
          time,
          players,
          total,
          paymentTerms,
          successUrl,
          cancelUrl,
        });

        // Redirect to Stripe Checkout
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err?.message || t('checkout.error'));
      setIsLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  // Determine available payment terms from room
  const roomPaymentTerms = room.paymentTerms;
  const availableTerms = Array.isArray(roomPaymentTerms)
    ? roomPaymentTerms
    : roomPaymentTerms
    ? [roomPaymentTerms]
    : ['full', 'deposit_20', 'pay_on_arrival'];

  // Auto-select first available term if default isn't available
  useEffect(() => {
    if (availableTerms.length && !availableTerms.includes(paymentTerms)) {
      setPaymentTerms(availableTerms[0] as any);
    }
  }, [availableTerms.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/rooms/${roomId}/book`}
          className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('checkout.back')}
        </Link>

        <h1 className="section-heading mb-2">
          {t('checkout.title')}
        </h1>
        <p className="text-brand-text-secondary mb-10">
          {t('checkout.subtitle')}
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Payment options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking details */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-brand-red" />
                {t('checkout.booking_details')}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-brand-text-muted block mb-1">{t('checkout.room')}</span>
                  <span className="font-medium">{room.title}</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">{t('checkout.location')}</span>
                  <span className="font-medium">{room.location}</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">{t('checkout.date')}</span>
                  <span className="font-medium">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">{t('checkout.time')}</span>
                  <span className="font-medium">{time}</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">{t('checkout.players', { count: String(players) })}</span>
                  <span className="font-medium">{t('checkout.players', { count: String(players) })}</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">{t('checkout.duration')}</span>
                  <span className="font-medium">{t('checkout.minutes', { count: String(room.duration) })}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-red" />
                {t('checkout.payment_option')}
              </h3>
              <div className="space-y-3">
                {(availableTerms as string[]).includes('full') && (
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentTerms === 'full'
                        ? 'border-brand-red bg-brand-red/5'
                        : 'border-brand-border hover:border-brand-red/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={paymentTerms === 'full'}
                      onChange={() => setPaymentTerms('full')}
                      className="accent-[#FF1E1E]"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{t('checkout.pay_full')}</div>
                      <div className="text-xs text-brand-text-muted">{t('checkout.pay_full_desc')}</div>
                    </div>
                    <span className="font-bold">€{(total + serviceFee).toFixed(2)}</span>
                  </label>
                )}
                {(availableTerms as string[]).includes('deposit_20') && (
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentTerms === 'deposit_20'
                        ? 'border-brand-red bg-brand-red/5'
                        : 'border-brand-border hover:border-brand-red/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={paymentTerms === 'deposit_20'}
                      onChange={() => setPaymentTerms('deposit_20')}
                      className="accent-[#FF1E1E]"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{t('checkout.pay_deposit')}</div>
                      <div className="text-xs text-brand-text-muted">{t('checkout.pay_deposit_desc')}</div>
                    </div>
                    <span className="font-bold">€{(deposit + serviceFee).toFixed(2)}</span>
                  </label>
                )}
                {(availableTerms as string[]).includes('pay_on_arrival') && (
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentTerms === 'pay_on_arrival'
                        ? 'border-brand-red bg-brand-red/5'
                        : 'border-brand-border hover:border-brand-red/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={paymentTerms === 'pay_on_arrival'}
                      onChange={() => setPaymentTerms('pay_on_arrival')}
                      className="accent-[#FF1E1E]"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{t('checkout.pay_arrival')}</div>
                      <div className="text-xs text-brand-text-muted">{t('checkout.pay_arrival_desc')}</div>
                    </div>
                    <span className="font-bold">€{serviceFee.toFixed(2)}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Promo Code */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-red" />
                {t('checkout.promo_code')}
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={t('checkout.promo_placeholder')}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="input-field flex-1"
                />
                <button className="btn-outline !py-3 !px-6">{t('checkout.promo_apply')}</button>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="font-semibold mb-4">{t('checkout.order_summary')}</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">
                    {players}x {t('checkout.tickets')}
                  </span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">{t('checkout.service_fee')}</span>
                  <span>€{serviceFee.toFixed(2)}</span>
                </div>
                {paymentTerms === 'deposit_20' && (
                  <div className="flex justify-between text-brand-text-muted">
                    <span>{t('checkout.deposit_label')}</span>
                    <span>€{deposit.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-border mt-4 pt-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-brand-text-muted">{t('checkout.pay_now')}</span>
                  <span className="text-2xl font-display font-bold">
                    €{payNow.toFixed(2)}
                  </span>
                </div>
                {paymentTerms !== 'full' && (
                  <div className="flex justify-between text-xs text-brand-text-muted">
                    <span>{t('checkout.remaining')}</span>
                    <span>€{(total + serviceFee - payNow).toFixed(2)} {t('checkout.on_arrival')}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-xl px-4 py-3 mt-4">
                  {error}
                </div>
              )}

              <button
                disabled={isLoading}
                onClick={handleSubmit}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {t('checkout.confirm_pay')}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-text-muted">
                <Shield className="w-3.5 h-3.5" />
                {t('checkout.secure_payment')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
