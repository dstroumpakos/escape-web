'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, MapPin, Package, Truck, Store, Mail, Phone, CalendarDays } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import type { SellerOrderView } from '../../../convex/merch';
import { ORDER_STATUS_CLS, countryName, euro } from './shopUi';
import { localeFor } from '@/lib/languages';

type Status = SellerOrderView['status'];
type Update = (
  orderId: string,
  status: Status,
  extra: { trackingCode?: string; trackingUrl?: string; sellerNote?: string }
) => Promise<unknown>;

export function OrderStatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${ORDER_STATUS_CLS[status] ?? ''}`}>
      {t(`shop.order_status.${status}`)}
    </span>
  );
}

function OrderCard({ o, onUpdate }: { o: SellerOrderView; onUpdate: Update }) {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [tracking, setTracking] = useState(o.trackingCode ?? '');
  const [trackingUrl, setTrackingUrl] = useState(o.trackingUrl ?? '');
  const [note, setNote] = useState(o.sellerNote ?? '');
  const dateFmt = (ts: number) =>
    new Date(ts).toLocaleString(localeFor(language), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const act = async (status: Status) => {
    if ((status === 'cancelled' || status === 'refunded') && !confirm(t(`shop.seller.confirm_${status}`))) return;
    setBusy(status);
    setErr('');
    try {
      await onUpdate(o._id, status, { trackingCode: tracking, trackingUrl, sellerNote: note });
    } catch (e) {
      setErr(friendlyError(e, t));
    } finally {
      setBusy(null);
    }
  };

  const units = o.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="bg-brand-surface rounded-xl border border-white/5">
      <button onClick={() => setOpen((x) => !x)} className="w-full text-left p-4 flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
          {o.delivery === 'pickup' ? <Store className="w-5 h-5 text-brand-red-light" /> : <Truck className="w-5 h-5 text-sky-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{o.orderCode}</span>
            <OrderStatusPill status={o.status} />
            {o.payment === 'at_pickup' && !o.paidAt && (
              <span className="text-[11px] text-amber-300">{t('shop.seller.collect_payment', { amount: euro(o.totalCents) })}</span>
            )}
          </div>
          <p className="text-sm text-brand-text-secondary truncate mt-0.5">
            {o.buyer.name} · {t('shop.seller.items_count', { count: String(units) })} · {euro(o.totalCents)}
          </p>
          {o.booking && (
            <p className="text-xs text-brand-text-secondary mt-0.5 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {t('shop.seller.at_game', { date: o.booking.date, time: o.booking.time, room: o.booking.roomTitle })}
              {o.booking.status === 'cancelled' && <span className="text-red-300 ml-1">({t('shop.seller.game_cancelled')})</span>}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-brand-text-secondary">{dateFmt(o.createdAt)}</p>
          {open ? <ChevronUp className="w-4 h-4 ml-auto mt-1" /> : <ChevronDown className="w-4 h-4 ml-auto mt-1" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          <div className="space-y-2">
            {o.items.map((i, k) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                {i.image ? (
                  <img src={i.image} alt="" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    {i.quantity}× {i.title}
                  </p>
                  <p className="text-xs text-brand-text-secondary">{i.variantLabel}</p>
                </div>
                <span className="tabular-nums">{euro(i.unitPriceCents * i.quantity)}</span>
              </div>
            ))}
            <div className="text-sm border-t border-white/5 pt-2 space-y-1">
              {o.discountCents > 0 && (
                <div className="flex justify-between text-brand-text-secondary">
                  <span>{t('shop.cart.premium_discount')}</span>
                  <span>−{euro(o.discountCents)}</span>
                </div>
              )}
              {o.delivery === 'shipping' && (
                <div className="flex justify-between text-brand-text-secondary">
                  <span>{t('shop.cart.shipping')}</span>
                  <span>{o.shippingCents ? euro(o.shippingCents) : t('shop.cart.free')}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>{t('shop.cart.total')}</span>
                <span>{euro(o.totalCents)}</span>
              </div>
              <p className="text-xs text-brand-text-secondary">
                {o.paidAt
                  ? t('shop.seller.paid_on', { date: dateFmt(o.paidAt) })
                  : o.payment === 'at_pickup'
                  ? t('shop.seller.pays_at_pickup')
                  : t('shop.seller.not_paid')}
                {o.welcomeGift && ` · ${t('shop.seller.welcome_gift')}`}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white/5 p-3 space-y-1">
              <p className="font-semibold">{o.buyer.name}</p>
              {o.buyer.email && (
                <a href={`mailto:${o.buyer.email}`} className="flex items-center gap-1.5 text-brand-text-secondary hover:text-white">
                  <Mail className="w-3.5 h-3.5" /> {o.buyer.email}
                </a>
              )}
              {o.buyer.phone && (
                <a href={`tel:${o.buyer.phone}`} className="flex items-center gap-1.5 text-brand-text-secondary hover:text-white">
                  <Phone className="w-3.5 h-3.5" /> {o.buyer.phone}
                </a>
              )}
              {o.buyerNote && <p className="text-xs text-brand-text-secondary italic mt-1">“{o.buyerNote}”</p>}
            </div>
            {o.shippingAddress && (
              <div className="rounded-lg bg-white/5 p-3">
                <p className="flex items-center gap-1.5 font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5" /> {t('shop.seller.ship_to')}
                </p>
                <p className="text-brand-text-secondary whitespace-pre-line">
                  {[
                    o.shippingAddress.name,
                    o.shippingAddress.line1,
                    o.shippingAddress.line2,
                    `${o.shippingAddress.postalCode} ${o.shippingAddress.city}`,
                    countryName(o.shippingAddress.country, language),
                    o.shippingAddress.phone,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </p>
              </div>
            )}
          </div>

          {o.delivery === 'shipping' && (o.status === 'paid' || o.status === 'shipped') && (
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm"
                placeholder={t('shop.seller.tracking_code')}
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
              <input
                className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm"
                placeholder={t('shop.seller.tracking_url')}
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
            </div>
          )}
          <textarea
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[60px]"
            placeholder={t('shop.seller.note_placeholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {o.nextStatuses.map((s) => (
              <button
                key={s}
                disabled={!!busy}
                onClick={() => act(s)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50 ${
                  s === 'cancelled' || s === 'refunded'
                    ? 'border border-red-500/30 text-red-300 hover:bg-red-500/10'
                    : 'bg-brand-red text-white'
                }`}
              >
                {busy === s && <Loader2 className="w-4 h-4 animate-spin" />}
                {t(`shop.seller.action_${s}`)}
              </button>
            ))}
            <button
              disabled={!!busy}
              onClick={() => act(o.status)}
              className="px-3.5 py-2 rounded-xl text-sm border border-white/10 text-brand-text-secondary hover:text-white inline-flex items-center gap-1.5"
            >
              {busy === o.status && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('shop.seller.save_notes')}
            </button>
          </div>
          {(o.status === 'paid' || o.status === 'collected' || o.status === 'shipped') && o.payment === 'online' && (
            <p className="text-xs text-brand-text-secondary">{t('shop.seller.refund_hint')}</p>
          )}
          {err && <p className="text-sm text-red-300">{err}</p>}
        </div>
      )}
    </div>
  );
}

/** Order list for a seller: the business portal (company) and the admin (Official). */
export function SellerOrders({ orders, onUpdate }: { orders: SellerOrderView[] | undefined; onUpdate: Update }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'open' | 'pickup' | 'shipping' | 'all'>('open');
  const list = useMemo(() => {
    const all = orders ?? [];
    const open = (o: SellerOrderView) => o.status === 'reserved' || o.status === 'paid' || o.status === 'ready';
    if (filter === 'open') return all.filter(open);
    if (filter === 'pickup') return all.filter((o) => open(o) && o.delivery === 'pickup');
    if (filter === 'shipping') return all.filter((o) => open(o) && o.delivery === 'shipping');
    return all;
  }, [orders, filter]);

  if (orders === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['open', 'pickup', 'shipping', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-sm ${
              filter === f ? 'bg-brand-red text-white' : 'bg-white/5 text-brand-text-secondary hover:text-white'
            }`}
          >
            {t(`shop.seller.filter_${f}`)}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="text-center py-12 text-brand-text-secondary">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{t('shop.seller.no_orders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <OrderCard key={o._id} o={o} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
