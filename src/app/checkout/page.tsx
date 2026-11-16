'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';
import {
  CreditCard,
  Shield,
  Lock,
  ArrowLeft,
  DoorOpen,
  Tag,
  AlertTriangle,
  FileText,
} from 'lucide-react';

type Terms = 'full' | 'deposit_20' | 'pay_on_arrival';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const roomId = searchParams.get('roomId') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const players = parseInt(searchParams.get('players') || '2');
  const urlTotal = parseFloat(searchParams.get('total') || '0');

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');
  // Price, deposit % and booking fee come from the server. Online options only
  // appear when the escape room has connected its own Stripe or Viva account.
  const options = useQuery(
    api.companyPaymentsData.getCheckoutOptions,
    roomId ? { roomId: roomId as any, players, date, time } : 'skip'
  );
  const createBooking = useMutation(api.bookings.create);
  const startCheckout = useAction(api.companyPayments.startCheckout);

  const [paymentTerms, setPaymentTerms] = useState<Terms>('pay_on_arrival');
  const [promoCode, setPromoCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // "Pay on arrival" needs a confirmed email (convex/emailVerify.ts)
  const [needsVerify, setNeedsVerify] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const resendLink = useMutation(api.emailVerify.resend);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const companyTerms = (room?.termsOfUse || '').trim();
  const mustAcceptTerms = companyTerms.length > 0;

  const total = options?.total ?? urlTotal;
  const bookingFee = options?.bookingFee ?? 0;
  const depositPercent = options?.depositPercent ?? 20;
  const depositAmount = options?.depositAmount ?? 0;
  const availableTerms: Terms[] = (options?.terms as Terms[] | undefined) ?? ['pay_on_arrival'];
  const feeNow = paymentTerms === 'pay_on_arrival' ? 0 : bookingFee;
  const partNow = paymentTerms === 'full' ? total : paymentTerms === 'deposit_20' ? depositAmount : 0;
  const payNow = partNow + feeNow;
  const remaining = Math.max(0, Math.round((total - partNow) * 100) / 100);

  // Wait for the saved session to load: a full page load (e.g. coming back
  // from the payment page) would otherwise bounce a signed-in player to /login.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Select the first option the room offers (online options come first)
  useEffect(() => {
    if (availableTerms.length && !availableTerms.includes(paymentTerms)) {
      setPaymentTerms(availableTerms[0]);
    }
  }, [availableTerms.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!user || !roomId || !date || !time) return;
    if (mustAcceptTerms && !termsAccepted) {
      setError(t('checkout.terms_required'));
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      if (paymentTerms === 'pay_on_arrival') {
        const result = await createBooking({
          sessionToken: user.sessionToken,
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
        // Pay online into the escape room's own Stripe / Viva account
        const baseUrl = window.location.origin;
        const back = new URLSearchParams({ roomId, date, time, players: String(players), total: String(total) });
        const { url } = await startCheckout({
          sessionToken: user.sessionToken,
          roomId: roomId as any,
          date,
          time,
          players,
          paymentTerms,
          // The server fills in {BOOKING_ID}; Stripe fills in {CHECKOUT_SESSION_ID}
          successUrl: `${baseUrl}/booking/confirmation?booking={BOOKING_ID}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/checkout?${back.toString()}`,
        });
        window.location.href = url;
      }
    } catch (err) {
      const msg = cleanError(err);
      if (msg === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerify(true);
        setError(t('checkout.email_not_verified'));
        setIsLoading(false);
        return;
      }
      setError(msg && !/Server Error|Called by client|Request ID/i.test(msg) ? msg : t('checkout.error'));
      setIsLoading(false);
    }
  };

  if (!room || options === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  const optionClass = (term: Terms) =>
    `flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
      paymentTerms === term ? 'border-brand-red bg-brand-red/5' : 'border-brand-border hover:border-brand-red/30'
    }`;

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
                <DoorOpen className="w-5 h-5 text-brand-red-light" />
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

            {options?.testMode && (
              <div className="card p-4 border-yellow-500/30 bg-yellow-500/5 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                <p className="text-sm text-yellow-300">{t('checkout.test_payments')}</p>
              </div>
            )}

            {/* Payment Terms */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-red-light" />
                {t('checkout.payment_option')}
              </h3>
              <div className="space-y-3">
                {availableTerms.includes('full') && (
                  <label className={optionClass('full')}>
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={paymentTerms === 'full'}
                      onChange={() => setPaymentTerms('full')}
                      className="accent-brand-red"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{t('checkout.pay_full')}</div>
                      <div className="text-xs text-brand-text-muted">{t('checkout.pay_full_desc')}</div>
                    </div>
                    <span className="font-bold">€{(total + bookingFee).toFixed(2)}</span>
                  </label>
                )}
                {availableTerms.includes('deposit_20') && (
                  <label className={optionClass('deposit_20')}>
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={paymentTerms === 'deposit_20'}
                      onChange={() => setPaymentTerms('deposit_20')}
                      className="accent-brand-red"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{t('checkout.pay_deposit', { percent: String(depositPercent) })}</div>
                      <div className="text-xs text-brand-text-muted">{t('checkout.pay_deposit_desc')}</div>
                    </div>
                    <span className="font-bold">€{(depositAmount + bookingFee).toFixed(2)}</span>
                  </label>
                )}
                {availableTerms.includes('pay_on_arrival') && (
                  <label className={optionClass('pay_on_arrival')}>
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={paymentTerms === 'pay_on_arrival'}
                      onChange={() => setPaymentTerms('pay_on_arrival')}
                      className="accent-brand-red"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{t('checkout.pay_arrival')}</div>
                      <div className="text-xs text-brand-text-muted">{t('checkout.pay_arrival_desc')}</div>
                    </div>
                    <span className="font-bold text-emerald-400">€0.00</span>
                  </label>
                )}
              </div>
            </div>

            {/* The escape room's own terms & conditions */}
            {mustAcceptTerms && (
              <div className="card p-6">
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-red-light" />
                  {t('checkout.terms_title')}
                </h3>
                {room.companyName && (
                  <p className="text-xs text-brand-text-muted mb-4">
                    {t('checkout.terms_from', { company: room.companyName })}
                  </p>
                )}
                <div
                  tabIndex={0}
                  className="max-h-56 overflow-y-auto rounded-xl border border-brand-border bg-black/30 p-4 text-sm text-brand-text-secondary whitespace-pre-line wrap-break-word leading-relaxed"
                >
                  {companyTerms}
                </div>
                <label className="flex items-start gap-3 mt-4 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setError('');
                    }}
                    className="accent-brand-red mt-0.5 w-4 h-4 shrink-0"
                  />
                  <span>{t('checkout.terms_accept')}</span>
                </label>
              </div>
            )}

            {/* Promo Code */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-red-light" />
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
                <button className="btn-outline py-3! px-6!">{t('checkout.promo_apply')}</button>
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
                  <span>
                    {!!options?.offerPercent && (
                      <span className="line-through text-brand-text-muted mr-2">€{options.fullPrice.toFixed(2)}</span>
                    )}
                    €{total.toFixed(2)}
                  </span>
                </div>
                {!!options?.offerPercent && (
                  <div className="flex justify-between text-brand-gold">
                    <span>{t('offers.badge', { percent: String(options.offerPercent) })}</span>
                    <span>-€{(options.fullPrice - total).toFixed(2)}</span>
                  </div>
                )}
                {paymentTerms === 'deposit_20' && (
                  <div className="flex justify-between text-brand-text-muted">
                    <span>{t('checkout.deposit_label', { percent: String(depositPercent) })}</span>
                    <span>€{depositAmount.toFixed(2)}</span>
                  </div>
                )}
                {feeNow > 0 && (
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">{t('checkout.booking_fee')}</span>
                    <span>€{feeNow.toFixed(2)}</span>
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
                    <span>€{remaining.toFixed(2)} {t('checkout.on_arrival')}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-xl px-4 py-3 mt-4">
                  {error}
                  {needsVerify && user?.sessionToken && (
                    <div className="mt-2">
                      {linkSent ? (
                        <span className="text-emerald-400">{t('checkout.link_sent')}</span>
                      ) : (
                        <button
                          type="button"
                          className="underline font-semibold text-white"
                          onClick={async () => {
                            try {
                              await resendLink({ sessionToken: user.sessionToken });
                              setLinkSent(true);
                            } catch {
                              setError(t('checkout.error'));
                            }
                          }}
                        >
                          {t('checkout.resend_link')}
                        </button>
                      )}
                    </div>
                  )}
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
                    {paymentTerms === 'pay_on_arrival' ? t('checkout.confirm_booking') : t('checkout.confirm_pay')}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-text-muted text-center">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                {paymentTerms !== 'pay_on_arrival' && options?.provider
                  ? t('checkout.secure_payment_via', { provider: options.provider === 'viva' ? 'Viva' : 'Stripe' })
                  : t('checkout.secure_payment')}
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
