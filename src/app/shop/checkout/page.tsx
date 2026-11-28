'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction, useQuery } from 'convex/react';
import { ArrowLeft, CreditCard, Crown, Gift, Loader2, Store, Truck, Wallet } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { PREMIUM_ENABLED } from '@/lib/features';
import { friendlyError } from '@/lib/errors';
import { SHIP_COUNTRIES, platformShippingCents } from '../../../../convex/merchRules';
import { countryName, euro, useCart } from '@/components/shop/shopUi';

function CheckoutContent() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const sellerKey = params.get('seller') || '';
  const presetBooking = params.get('booking') || '';
  const { user, isAuthenticated } = useAuth();
  const { lines, clearSeller } = useCart();
  const shop = useQuery(api.merch.listShop, { sessionToken: user?.sessionToken });
  const me = useQuery(api.users.getById, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
  const checkout = useAction(api.merchPayments.checkout);

  const myLines = lines.filter((l) => l.sellerKey === sellerKey);
  const products = useMemo(() => {
    const map = new Map((shop?.products ?? []).map((p) => [p._id as string, p]));
    return myLines.map((l) => ({ line: l, product: map.get(l.productId) }));
  }, [shop, myLines]);
  const missing = products.some((x) => !x.product || !x.product.canBuy);
  const isPlatform = sellerKey === 'platform';
  const canPickup = !isPlatform && products.length > 0 && products.every((x) => x.product?.pickup);
  const canShip = products.length > 0 && products.every((x) => x.product?.shipping);
  const online = products[0]?.product?.onlinePayment ?? false;
  const sellerName = myLines[0]?.sellerName ?? '';

  const bookings = useQuery(
    api.merch.pickupBookings,
    user?.sessionToken && canPickup ? { sessionToken: user.sessionToken, companyId: sellerKey as any } : 'skip'
  );

  const [delivery, setDelivery] = useState<'pickup' | 'shipping'>('pickup');
  const [payment, setPayment] = useState<'online' | 'at_pickup'>('online');
  const [bookingId, setBookingId] = useState(presetBooking);
  const [addr, setAddr] = useState({ name: '', line1: '', line2: '', city: '', postalCode: '', country: 'GR', phone: '' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!canPickup && canShip) setDelivery('shipping');
    if (canPickup && !canShip) setDelivery('pickup');
  }, [canPickup, canShip]);
  useEffect(() => {
    if (delivery === 'shipping' || !online) setPayment(delivery === 'shipping' ? 'online' : online ? 'online' : 'at_pickup');
  }, [delivery, online]);
  useEffect(() => {
    if (me && !addr.name) setAddr((a) => ({ ...a, name: (me as any).name || '', phone: (me as any).phone || '' }));
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPremium = !!shop?.perks.isPremium;
  const subtotal = products.reduce((s, x) => s + (x.product?.priceCents ?? x.line.unitPriceCents) * x.line.quantity, 0);
  const total0 = products.reduce((s, x) => s + (x.product?.yourPriceCents ?? x.line.unitPriceCents) * x.line.quantity, 0);
  const discount = subtotal - total0;
  const shipping =
    delivery === 'pickup'
      ? 0
      : isPlatform
      ? platformShippingCents(addr.country, isPremium)
      : Math.max(0, ...products.map((x) => x.product?.shippingCents ?? 0));
  const total = total0 + shipping;
  const gift = isPlatform && !!shop?.perks.welcomeGiftAvailable;

  if (!isAuthenticated) {
    return (
      <section className="pt-32 pb-20 text-center px-4">
        <h1 className="text-3xl font-display font-bold text-brand-bone mb-3">{t('shop.checkout.login_title')}</h1>
        <p className="text-brand-text-secondary mb-6">{t('shop.checkout.login_desc')}</p>
        <Link href="/login" className="btn-primary inline-flex">
          {t('book.login_to_book')}
        </Link>
      </section>
    );
  }
  if (shop === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }
  if (myLines.length === 0) {
    return (
      <section className="pt-32 pb-20 text-center px-4">
        <h1 className="text-3xl font-display font-bold text-brand-bone mb-3">{t('shop.cart.empty')}</h1>
        <Link href="/shop" className="btn-primary inline-flex">
          {t('shop.cart.browse')}
        </Link>
      </section>
    );
  }

  const place = async () => {
    setBusy(true);
    setErr('');
    try {
      const origin = window.location.origin;
      const res = await checkout({
        sessionToken: user!.sessionToken,
        items: myLines.map((l) => ({ productId: l.productId as any, variantId: l.variantId, quantity: l.quantity })),
        delivery,
        payment: delivery === 'shipping' ? 'online' : payment,
        bookingId: delivery === 'pickup' && bookingId ? (bookingId as any) : undefined,
        shippingAddress:
          delivery === 'shipping'
            ? {
                name: addr.name,
                line1: addr.line1,
                line2: addr.line2 || undefined,
                city: addr.city,
                postalCode: addr.postalCode,
                country: addr.country,
                phone: addr.phone || undefined,
              }
            : undefined,
        buyerNote: note || undefined,
        successUrl: `${origin}/shop/orders/{ORDER_ID}?paid=1`,
        cancelUrl: `${origin}/shop/orders/{ORDER_ID}?cancelled=1`,
      });
      clearSeller(sellerKey);
      if (res.url) window.location.href = res.url;
      else router.push(`/shop/orders/${res.orderId}?new=1`);
    } catch (e) {
      setErr(friendlyError(e, t, 'shop.checkout.failed'));
      setBusy(false);
    }
  };

  const Choice = ({
    active,
    onClick,
    icon: Icon,
    title,
    desc,
    disabled,
  }: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    title: string;
    desc: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`text-left p-4 rounded-md border flex gap-3 transition-colors disabled:opacity-40 ${
        active ? 'border-brand-red-light/60 bg-brand-red/10' : 'border-brand-border hover:border-brand-red/50'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0 text-brand-red-light mt-0.5" />
      <span>
        <span className="block text-brand-bone font-medium">{title}</span>
        <span className="block text-xs text-brand-text-secondary mt-0.5">{desc}</span>
      </span>
    </button>
  );

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Link href="/shop/cart" className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-bone mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('shop.cart.title')}
        </Link>
        <h1 className="text-4xl font-display font-black text-brand-bone mb-1">{t('shop.checkout.title')}</h1>
        <p className="text-brand-text-secondary mb-8">{sellerName}</p>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery */}
            <div className="panel p-5 space-y-3">
              <h2 className="font-display font-bold text-brand-bone">{t('shop.checkout.delivery')}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Choice
                  active={delivery === 'pickup'}
                  disabled={!canPickup}
                  onClick={() => setDelivery('pickup')}
                  icon={Store}
                  title={t('shop.checkout.pickup')}
                  desc={isPlatform ? t('shop.checkout.pickup_official_no') : t('shop.checkout.pickup_desc', { shop: sellerName })}
                />
                <Choice
                  active={delivery === 'shipping'}
                  disabled={!canShip}
                  onClick={() => setDelivery('shipping')}
                  icon={Truck}
                  title={t('shop.checkout.shipping')}
                  desc={canShip ? t('shop.checkout.shipping_desc') : t('shop.checkout.shipping_no')}
                />
              </div>

              {delivery === 'pickup' && (
                <div className="pt-2">
                  <label className="block text-sm text-brand-text-secondary mb-1.5">{t('shop.checkout.pickup_when')}</label>
                  <select className="input-field" value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                    <option value="">{t('shop.checkout.pickup_any')}</option>
                    {(bookings ?? []).map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.roomTitle} · {b.date} {b.time}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {delivery === 'shipping' && (
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <input className="input-field sm:col-span-2" placeholder={t('shop.addr.name')} value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} autoComplete="name" />
                  <input className="input-field sm:col-span-2" placeholder={t('shop.addr.line1')} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} autoComplete="address-line1" />
                  <input className="input-field sm:col-span-2" placeholder={t('shop.addr.line2')} value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} autoComplete="address-line2" />
                  <input className="input-field" placeholder={t('shop.addr.postal')} value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} autoComplete="postal-code" />
                  <input className="input-field" placeholder={t('shop.addr.city')} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} autoComplete="address-level2" />
                  <select className="input-field" value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} autoComplete="country">
                    {SHIP_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {countryName(c, language)}
                      </option>
                    ))}
                  </select>
                  <input className="input-field" placeholder={t('shop.addr.phone')} value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} autoComplete="tel" />
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="panel p-5 space-y-3">
              <h2 className="font-display font-bold text-brand-bone">{t('shop.checkout.payment')}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Choice
                  active={payment === 'online' || delivery === 'shipping'}
                  disabled={!online}
                  onClick={() => setPayment('online')}
                  icon={CreditCard}
                  title={t('shop.checkout.pay_online')}
                  desc={online ? t('shop.checkout.pay_online_desc') : t('shop.checkout.pay_online_no')}
                />
                <Choice
                  active={delivery === 'pickup' && payment === 'at_pickup'}
                  disabled={delivery !== 'pickup'}
                  onClick={() => setPayment('at_pickup')}
                  icon={Wallet}
                  title={t('shop.checkout.pay_pickup')}
                  desc={t('shop.checkout.pay_pickup_desc')}
                />
              </div>
              <textarea
                className="input-field min-h-[70px]"
                placeholder={t('shop.checkout.note')}
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="panel p-5 lg:sticky lg:top-28 space-y-3">
            <h3 className="horror-label">{t('book.summary')}</h3>
            {products.map(({ line, product }) => (
              <div key={line.productId + line.variantId} className="flex justify-between gap-3 text-sm">
                <span className="text-brand-text-secondary">
                  {line.quantity}× {line.title} <span className="text-brand-text-muted">({line.variantLabel})</span>
                  {!product?.canBuy && <span className="block text-red-300 text-xs">{t('shop.checkout.unavailable')}</span>}
                </span>
                <span className="tabular-nums text-brand-bone">
                  {euro((product?.priceCents ?? line.unitPriceCents) * line.quantity)}
                </span>
              </div>
            ))}
            {gift && (
              <div className="flex justify-between text-sm text-brand-gold">
                <span className="inline-flex items-center gap-1.5">
                  <Gift className="w-4 h-4" /> {t('shop.checkout.gift')}
                </span>
                <span>€0</span>
              </div>
            )}
            <div className="border-t border-brand-border pt-3 space-y-1.5 text-sm">
              {discount > 0 && (
                <div className="flex justify-between text-brand-gold">
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" /> {t('shop.cart.premium_discount')}
                  </span>
                  <span>−{euro(discount)}</span>
                </div>
              )}
              {delivery === 'shipping' && (
                <div className="flex justify-between text-brand-text-secondary">
                  <span>{t('shop.cart.shipping')}</span>
                  <span>{shipping ? euro(shipping) : t('shop.cart.free')}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-brand-text-muted">{t('shop.cart.total')}</span>
                <span className="text-3xl font-display font-black text-brand-bone tabular-nums">{euro(total)}</span>
              </div>
              {PREMIUM_ENABLED && isPlatform && !isPremium && (
                <p className="text-xs text-brand-gold">{t('shop.checkout.premium_would_save')}</p>
              )}
            </div>
            {err && <p className="text-sm text-red-300">{err}</p>}
            <button onClick={place} disabled={busy || missing} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {delivery === 'pickup' && payment === 'at_pickup' ? t('shop.checkout.reserve') : t('shop.checkout.pay', { amount: euro(total) })}
            </button>
            <p className="text-[11px] text-brand-text-muted">
              {isPlatform ? t('shop.checkout.terms_official') : t('shop.checkout.terms_company', { shop: sellerName })}{' '}
              <Link href="/terms#merch" className="underline">
                {t('shop.checkout.terms_link')}
              </Link>
            </p>
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
