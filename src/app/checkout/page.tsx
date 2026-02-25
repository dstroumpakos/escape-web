'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
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

  const roomId = searchParams.get('roomId') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const players = parseInt(searchParams.get('players') || '2');
  const total = parseFloat(searchParams.get('total') || '0');

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');
  const createBooking = useMutation(api.bookings.create);

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
        paymentStatus: paymentTerms === 'full' ? 'paid' : paymentTerms === 'deposit_20' ? 'deposit' : 'unpaid',
      });
      router.push(`/booking/confirmation?${params.toString()}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create booking. Please try again.');
    } finally {
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

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/rooms/${roomId}/book`}
          className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to date selection
        </Link>

        <h1 className="section-heading mb-2">
          Check<span className="text-gradient">out</span>
        </h1>
        <p className="text-brand-text-secondary mb-10">
          Review your booking and complete payment.
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Payment options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking details */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-brand-red" />
                Booking Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-brand-text-muted block mb-1">Room</span>
                  <span className="font-medium">{room.title}</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">Location</span>
                  <span className="font-medium">{room.location}</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">Date</span>
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
                  <span className="text-brand-text-muted block mb-1">Time</span>
                  <span className="font-medium">{time}</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">Players</span>
                  <span className="font-medium">{players} players</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">Duration</span>
                  <span className="font-medium">{room.duration} minutes</span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-red" />
                Payment Option
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
                      <div className="font-medium">Pay in Full</div>
                      <div className="text-xs text-brand-text-muted">Complete payment now</div>
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
                      <div className="font-medium">20% Deposit</div>
                      <div className="text-xs text-brand-text-muted">Pay the rest on arrival</div>
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
                      <div className="font-medium">Pay on Arrival</div>
                      <div className="text-xs text-brand-text-muted">Only service fee now</div>
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
                Promo Code
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="input-field flex-1"
                />
                <button className="btn-outline !py-3 !px-6">Apply</button>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">
                    {players}x Tickets
                  </span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">Service fee</span>
                  <span>€{serviceFee.toFixed(2)}</span>
                </div>
                {paymentTerms === 'deposit_20' && (
                  <div className="flex justify-between text-brand-text-muted">
                    <span>Deposit (20%)</span>
                    <span>€{deposit.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-border mt-4 pt-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-brand-text-muted">Pay now</span>
                  <span className="text-2xl font-display font-bold">
                    €{payNow.toFixed(2)}
                  </span>
                </div>
                {paymentTerms !== 'full' && (
                  <div className="flex justify-between text-xs text-brand-text-muted">
                    <span>Remaining</span>
                    <span>€{(total + serviceFee - payNow).toFixed(2)} on arrival</span>
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
                    Confirm & Pay
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-text-muted">
                <Shield className="w-3.5 h-3.5" />
                Secure payment processing
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
