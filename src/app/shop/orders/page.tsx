'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { ArrowLeft, Package, Store, Truck } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { OrderStatusPill } from '@/components/shop/SellerOrders';
import { euro } from '@/components/shop/shopUi';
import { localeFor } from '@/lib/languages';

export default function MyOrdersPage() {
  const { t, language } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const orders = useQuery(api.merch.myOrders, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');

  if (!isAuthenticated) {
    return (
      <section className="pt-32 pb-20 text-center px-4">
        <h1 className="text-3xl font-display font-bold text-brand-bone mb-3">{t('shop.orders.title')}</h1>
        <Link href="/login" className="btn-primary inline-flex">
          {t('book.login_to_book')}
        </Link>
      </section>
    );
  }

  const visible = (orders ?? []).filter((o) => o.status !== 'pending_payment' || Date.now() - o.createdAt < 60 * 60 * 1000);
  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(localeFor(language), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-bone mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('shop.back_to_shop')}
        </Link>
        <h1 className="text-4xl font-display font-black text-brand-bone mb-8">{t('shop.orders.title')}</h1>
        {orders === undefined ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="panel p-10 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-brand-text-muted" />
            <p className="text-brand-text-secondary">{t('shop.orders.empty')}</p>
            <Link href="/shop" className="btn-primary inline-flex mt-5">
              {t('shop.cart.browse')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((o) => (
              <Link key={o._id} href={`/shop/orders/${o._id}`} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-md overflow-hidden bg-black/40 shrink-0 flex items-center justify-center">
                  {o.items[0]?.image ? (
                    <img src={o.items[0].image} alt="" className="w-full h-full object-cover" />
                  ) : o.delivery === 'pickup' ? (
                    <Store className="w-5 h-5 text-brand-red-light" />
                  ) : (
                    <Truck className="w-5 h-5 text-brand-red-light" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-brand-bone">{o.orderCode}</span>
                    <OrderStatusPill status={o.status} />
                  </div>
                  <p className="text-sm text-brand-text-secondary truncate">
                    {o.sellerName} · {o.items.map((i) => `${i.quantity}× ${i.title}`).join(', ')}
                  </p>
                  <p className="text-xs text-brand-text-muted">{fmt(o.createdAt)}</p>
                </div>
                <span className="font-display font-bold text-brand-bone tabular-nums">{euro(o.totalCents)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
