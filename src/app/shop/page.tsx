'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Search, Package } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { ProductCard, PerksBanner } from '@/components/shop/ProductCard';
import { CATEGORIES } from '@/components/shop/shopUi';
import { PREMIUM_ENABLED } from '@/lib/features';
import { ShopHeaderActions } from '@/components/shop/ShopHeaderActions';

type SellerFilter = 'all' | 'platform' | 'company';

export default function ShopPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const data = useQuery(api.merch.listShop, { sessionToken: user?.sessionToken });
  const [seller, setSeller] = useState<SellerFilter>('all');
  const [category, setCategory] = useState<string>('all');
  const [q, setQ] = useState('');

  const products = useMemo(() => {
    const list = data?.products ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter(
      (p) =>
        (PREMIUM_ENABLED || !p.premiumOnly) &&
        (seller === 'all' || p.seller === seller) &&
        (category === 'all' || p.category === category) &&
        (!needle ||
          p.title.toLowerCase().includes(needle) ||
          p.sellerName.toLowerCase().includes(needle) ||
          (p.companyCity ?? '').toLowerCase().includes(needle))
    );
  }, [data, seller, category, q]);

  const official = products.filter((p) => p.seller === 'platform');
  const rooms = products.filter((p) => p.seller === 'company');

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="horror-label mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-brand-red/60" />
              {t('shop.title_label')}
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black text-brand-bone leading-[1.05]">{t('shop.title')}</h1>
            <p className="text-brand-text-secondary mt-3 max-w-2xl">{t('shop.subtitle')}</p>
          </div>
          <ShopHeaderActions />
        </div>

        {PREMIUM_ENABLED && data?.perks && (
          <div className="mb-8">
            <PerksBanner perks={data.perks} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              className="input-field pl-10!"
              placeholder={t('shop.search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'platform', 'company'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeller(s)}
                className={`shrink-0 px-4 py-2 rounded-md border text-sm ${
                  seller === s
                    ? 'bg-brand-red border-brand-red-light/50 text-brand-bone'
                    : 'border-brand-border text-brand-text-secondary hover:text-brand-bone'
                }`}
              >
                {t(`shop.filter.${s}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-10">
          {(['all', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${
                category === c
                  ? 'border-brand-red/60 bg-brand-red/15 text-brand-red-light'
                  : 'border-brand-border text-brand-text-muted hover:text-brand-bone'
              }`}
            >
              {c === 'all' ? t('shop.category.all') : t(`shop.category.${c}`)}
            </button>
          ))}
        </div>

        {data === undefined ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto mb-4 text-brand-text-muted" />
            <p className="text-brand-bone font-display text-xl">{t('shop.empty_title')}</p>
            <p className="text-brand-text-secondary mt-2">{t('shop.empty_desc')}</p>
          </div>
        ) : (
          <div className="space-y-14">
            {official.length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-brand-bone mb-5">{t('shop.section.official')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {official.map((p) => (
                    <ProductCard key={p._id} p={p} showSeller={false} />
                  ))}
                </div>
              </div>
            )}
            {rooms.length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-brand-bone mb-1">{t('shop.section.rooms')}</h2>
                <p className="text-sm text-brand-text-secondary mb-5">{t('shop.section.rooms_desc')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {rooms.map((p) => (
                    <ProductCard key={p._id} p={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
