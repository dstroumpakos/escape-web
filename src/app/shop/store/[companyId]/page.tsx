'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { ArrowLeft, Crown, MapPin, Package, Store } from 'lucide-react';
import { api } from '../../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { PREMIUM_ENABLED } from '@/lib/features';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopHeaderActions } from '@/components/shop/ShopHeaderActions';

export default function CompanyStorePage() {
  const { companyId } = useParams() as { companyId: string };
  const { t } = useTranslation();
  const { user } = useAuth();
  const data = useQuery(api.merch.companyStore, { companyId: companyId as any, sessionToken: user?.sessionToken });

  useEffect(() => {
    if (data?.company) document.title = `${data.company.name} merch | UNLOCKED Shop`;
  }, [data]);

  if (data === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) {
    return (
      <section className="pt-32 pb-20 text-center px-4">
        <h1 className="text-3xl font-display font-bold text-brand-bone mb-3">{t('shop.not_found')}</h1>
        <Link href="/shop" className="btn-primary inline-flex">
          {t('shop.back_to_shop')}
        </Link>
      </section>
    );
  }

  const c = data.company;
  return (
    <section className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-bone">
            <ArrowLeft className="w-4 h-4" /> {t('shop.back_to_shop')}
          </Link>
          <ShopHeaderActions />
        </div>

        <div className="panel p-6 flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-black/40 shrink-0 flex items-center justify-center">
            {c.logo ? <img src={c.logo} alt="" className="w-full h-full object-cover" /> : <Store className="w-7 h-7 text-brand-red-light" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-display font-black text-brand-bone">{c.name}</h1>
            {(c.address || c.city) && (
              <p className="text-sm text-brand-text-secondary mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {[c.address, c.city].filter(Boolean).join(', ')}
              </p>
            )}
            {c.pickupNote && <p className="text-xs text-brand-text-muted mt-1">{c.pickupNote}</p>}
          </div>
          {PREMIUM_ENABLED && c.premiumDiscountPercent > 0 && (
            <div className="rounded-md border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-sm text-brand-gold flex items-center gap-2">
              <Crown className="w-4 h-4" />
              {t('shop.store.premium_discount', { pct: String(c.premiumDiscountPercent) })}
            </div>
          )}
        </div>

        {data.products.filter((p) => PREMIUM_ENABLED || !p.premiumOnly).length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto mb-4 text-brand-text-muted" />
            <p className="text-brand-text-secondary">{t('shop.store.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {data.products.filter((p) => PREMIUM_ENABLED || !p.premiumOnly).map((p) => (
              <ProductCard key={p._id} p={p} showSeller={false} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
