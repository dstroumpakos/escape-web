'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useAction, useMutation, useQuery } from 'convex/react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Crown, Gift, Loader2, MapPin, Store, Truck, XCircle } from 'lucide-react';
import { api } from '../../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { OrderStatusPill } from '@/components/shop/SellerOrders';
import { countryName, euro } from '@/components/shop/shopUi';
import { localeFor } from '@/lib/languages';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function OrderContent() {
  const { id } = useParams() as { id: string };
  const params = useSearchParams();
  const { t, language } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const order = useQuery(api.merch.getMyOrder, user?.sessionToken ? { sessionToken: user.sessionToken, orderId: id as any } : 'skip');
  const confirmReturn = useAction(api.merchPayments.confirmReturn);
  const retry = useAction(api.merchPayments.retryCheckout);
  const cancel = useMutation(api.merch.cancelMyOrder);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const checked = useRef(false);

  const fromPayment = params.get('paid') === '1';
  const isNew = params.get('new') === '1' || fromPayment;

  // Back from Stripe: ask the provider a few times (the webhook isn't needed).
  useEffect(() => {
    if (!fromPayment || checked.current || !order || order.paidAt) return;
    checked.current = true;
    (async () => {
      setChecking(true);
      for (let i = 0; i < 5; i++) {
        try {
          const r = await confirmReturn({ orderId: id as any });
          if (r.state === 'paid') break;
        } catch {}
        await sleep(3000);
      }
      setChecking(false);
    })();
  }, [fromPayment, order, confirmReturn, id]);

  if (!isAuthenticated) {
    return (
      <section className="pt-32 pb-20 text-center px-4">
        <Link href="/login" className="btn-primary inline-flex">
          {t('book.login_to_book')}
        </Link>
      </section>
    );
  }
  if (order === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }
  if (!order) {
    return (
      <section className="pt-32 pb-20 text-center px-4">
        <h1 className="text-3xl font-display font-bold text-brand-bone mb-3">{t('shop.not_found')}</h1>
        <Link href="/shop/orders" className="btn-primary inline-flex">
          {t('shop.orders.title')}
        </Link>
      </section>
    );
  }

  const fmt = (ts: number) =>
    new Date(ts).toLocaleString(localeFor(language), {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

  const payAgain = async () => {
    setBusy(true);
    setErr('');
    try {
      const origin = window.location.origin;
      const { url } = await retry({
        sessionToken: user!.sessionToken,
        orderId: order._id as any,
        successUrl: `${origin}/shop/orders/{ORDER_ID}?paid=1`,
        cancelUrl: `${origin}/shop/orders/{ORDER_ID}?cancelled=1`,
      });
      window.location.href = url;
    } catch (e) {
      setErr(friendlyError(e, t));
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm(t('shop.orders.confirm_cancel'))) return;
    setBusy(true);
    setErr('');
    try {
      await cancel({ sessionToken: user!.sessionToken, orderId: order._id as any });
    } catch (e) {
      setErr(friendlyError(e, t));
    } finally {
      setBusy(false);
    }
  };

  const waiting = order.status === 'pending_payment';
  const headline =
    order.status === 'pending_payment'
      ? checking
        ? t('shop.orders.checking')
        : t('shop.orders.waiting_payment')
      : order.status === 'cancelled'
      ? t('shop.orders.cancelled')
      : isNew
      ? t('shop.orders.thanks')
      : t('shop.orders.order_title', { code: order.orderCode });

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/shop/orders" className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-bone mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('shop.orders.title')}
        </Link>

        <div className="panel p-6 mb-6 text-center">
          {waiting ? (
            checking ? <Loader2 className="w-10 h-10 mx-auto text-brand-red-light animate-spin" /> : <Clock className="w-10 h-10 mx-auto text-amber-300" />
          ) : order.status === 'cancelled' || order.status === 'refunded' ? (
            <XCircle className="w-10 h-10 mx-auto text-brand-text-muted" />
          ) : (
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
          )}
          <h1 className="text-2xl md:text-3xl font-display font-black text-brand-bone mt-3">{headline}</h1>
          <div className="flex justify-center items-center gap-2 mt-2">
            <span className="font-mono text-brand-text-secondary">{order.orderCode}</span>
            <OrderStatusPill status={order.status} />
          </div>
          {order.testMode && <p className="text-xs text-amber-300 mt-2">{t('shop.orders.test_mode')}</p>}
          {waiting && !checking && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button onClick={payAgain} disabled={busy} className="btn-primary text-sm">
                {t('shop.orders.pay_now')}
              </button>
              <button onClick={cancelOrder} disabled={busy} className="btn-ghost text-sm">
                {t('shop.orders.cancel')}
              </button>
            </div>
          )}
          {err && <p className="text-sm text-red-300 mt-3">{err}</p>}
        </div>

        {/* Delivery */}
        <div className="panel p-5 mb-6 text-sm space-y-2">
          {order.delivery === 'pickup' ? (
            <>
              <p className="flex items-start gap-2.5 text-brand-bone">
                <Store className="w-4 h-4 mt-0.5 text-brand-red-light shrink-0" />
                <span>
                  {order.status === 'ready' ? t('shop.orders.ready_at', { shop: order.sellerName }) : t('shop.orders.pickup_at', { shop: order.sellerName })}
                </span>
              </p>
              {(order.companyAddress || order.companyCity) && (
                <p className="flex items-start gap-2.5 text-brand-text-secondary">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {[order.companyAddress, order.companyCity].filter(Boolean).join(', ')}
                </p>
              )}
              {order.booking && (
                <p className="flex items-start gap-2.5 text-brand-text-secondary">
                  <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" />
                  {t('shop.orders.at_your_game', { room: order.booking.roomTitle, date: order.booking.date, time: order.booking.time })}
                </p>
              )}
              {order.pickupNote && <p className="text-xs text-brand-text-muted pl-6">{order.pickupNote}</p>}
              <p className="text-xs text-brand-text-muted pl-6">
                {order.paidAt ? t('shop.orders.paid_on', { date: fmt(order.paidAt) }) : order.payment === 'at_pickup' ? t('shop.orders.pay_at_pickup', { amount: euro(order.totalCents) }) : ''}
              </p>
            </>
          ) : (
            <>
              <p className="flex items-start gap-2.5 text-brand-bone">
                <Truck className="w-4 h-4 mt-0.5 text-brand-red-light shrink-0" />
                {order.status === 'shipped' ? t('shop.orders.shipped_by', { shop: order.sellerName }) : t('shop.orders.ships_from', { shop: order.sellerName })}
              </p>
              {order.shippingAddress && (
                <p className="text-brand-text-secondary pl-6 whitespace-pre-line">
                  {[
                    order.shippingAddress.name,
                    order.shippingAddress.line1,
                    order.shippingAddress.line2,
                    `${order.shippingAddress.postalCode} ${order.shippingAddress.city}`,
                    countryName(order.shippingAddress.country, language),
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </p>
              )}
              {order.trackingCode && (
                <p className="pl-6 text-brand-text-secondary">
                  {t('shop.orders.tracking')}:{' '}
                  {order.trackingUrl ? (
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="underline text-brand-red-light">
                      {order.trackingCode}
                    </a>
                  ) : (
                    <span className="font-mono">{order.trackingCode}</span>
                  )}
                </p>
              )}
            </>
          )}
          {order.sellerNote && <p className="text-xs text-brand-text-secondary italic pl-6">“{order.sellerNote}”</p>}
          {order.status === 'reserved' && (
            <div className="pl-6 pt-1">
              <button onClick={cancelOrder} disabled={busy} className="text-xs underline text-brand-text-muted hover:text-brand-bone">
                {t('shop.orders.cancel')}
              </button>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="panel p-5 space-y-3">
          {order.items.map((i, k) => (
            <div key={k} className="flex items-center gap-3 text-sm">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-black/40 shrink-0 flex items-center justify-center">
                {i.image ? <img src={i.image} alt="" className="w-full h-full object-cover" /> : <Gift className="w-5 h-5 text-brand-gold" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-brand-bone truncate">
                  {i.quantity}× {i.title}
                </p>
                <p className="text-xs text-brand-text-muted">{i.variantLabel}</p>
              </div>
              <span className="tabular-nums text-brand-bone">{i.unitPriceCents ? euro(i.unitPriceCents * i.quantity) : '€0'}</span>
            </div>
          ))}
          <div className="border-t border-brand-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-brand-text-secondary">
              <span>{t('shop.cart.subtotal')}</span>
              <span>{euro(order.subtotalCents)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-brand-gold">
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> {t('shop.cart.premium_discount')}
                </span>
                <span>−{euro(order.discountCents)}</span>
              </div>
            )}
            {order.delivery === 'shipping' && (
              <div className="flex justify-between text-brand-text-secondary">
                <span>{t('shop.cart.shipping')}</span>
                <span>{order.shippingCents ? euro(order.shippingCents) : t('shop.cart.free')}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-lg text-brand-bone pt-1">
              <span>{t('shop.cart.total')}</span>
              <span>{euro(order.totalCents)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-brand-text-muted mt-4">{t('shop.orders.returns_note', { shop: order.sellerName })}</p>
      </div>
    </section>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
