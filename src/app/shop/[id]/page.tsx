'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { ArrowLeft, Check, Crown, Minus, Plus, ShoppingBag, Store, Truck, Gift } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { PREMIUM_ENABLED } from '@/lib/features';
import { LockNote, PriceTag, ProductCard } from '@/components/shop/ProductCard';
import { ShopHeaderActions } from '@/components/shop/ShopHeaderActions';
import { euro, useCart } from '@/components/shop/shopUi';

export default function ProductPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { add } = useCart();
  const data = useQuery(api.merch.getProduct, { productId: id as any, sessionToken: user?.sessionToken });
  const [img, setImg] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const p = data?.product;
  useEffect(() => {
    if (p && !variantId) {
      const first = p.variants.find((v) => !v.soldOut) ?? p.variants[0];
      setVariantId(first?.id ?? null);
    }
  }, [p, variantId]);

  useEffect(() => {
    if (p) document.title = `${p.title} · ${p.sellerName} | UNLOCKED Shop`;
  }, [p]);

  if (data === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }
  if (!data || !p) {
    return (
      <section className="pt-32 pb-20 text-center px-4">
        <h1 className="text-3xl font-display font-bold text-brand-bone mb-3">{t('shop.not_found')}</h1>
        <Link href="/shop" className="btn-primary inline-flex">
          {t('shop.back_to_shop')}
        </Link>
      </section>
    );
  }

  const variant = p.variants.find((v) => v.id === variantId);
  const canAdd = p.canBuy && !!variant && !variant.soldOut;
  const sellerKey = p.seller === 'platform' ? 'platform' : String(p.companyId);

  const addToCart = (go: boolean) => {
    if (!canAdd || !variant) return;
    add({
      productId: p._id,
      variantId: variant.id,
      quantity: qty,
      title: p.title,
      variantLabel: variant.label,
      image: p.images[0],
      unitPriceCents: p.yourPriceCents,
      sellerKey,
      sellerName: p.sellerName,
    });
    if (go) router.push('/shop/cart');
    else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href={p.seller === 'company' && p.companyId ? `/shop/store/${p.companyId}` : '/shop'}
            className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-bone"
          >
            <ArrowLeft className="w-4 h-4" /> {p.sellerName}
          </Link>
          <ShopHeaderActions />
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div>
            <div className="panel overflow-hidden aspect-square">
              {p.images[img] ? (
                <img src={p.images[img]} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                  <ShoppingBag className="w-14 h-14" />
                </div>
              )}
            </div>
            {p.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {p.images.map((u, i) => (
                  <button
                    key={u + i}
                    onClick={() => setImg(i)}
                    className={`w-16 h-16 shrink-0 rounded-md overflow-hidden border ${
                      i === img ? 'border-brand-red' : 'border-brand-border opacity-70'
                    }`}
                  >
                    <img src={u} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6 min-w-0">
            <div>
              <p className="text-xs font-type tracking-[0.14em] uppercase text-brand-text-muted mb-2">
                {p.sellerName}
                {p.companyCity ? ` · ${p.companyCity}` : ''}
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-black text-brand-bone leading-tight">{p.title}</h1>
              <div className="flex flex-wrap gap-2 mt-3">
                {PREMIUM_ENABLED && p.release === 'early_access' && (
                  <span className="text-[11px] font-type tracking-wider px-2 py-1 rounded-sm bg-brand-gold text-black">
                    {t('shop.badge.early_access')}
                  </span>
                )}
                {PREMIUM_ENABLED && p.premiumOnly && (
                  <span className="text-[11px] font-type tracking-wider px-2 py-1 rounded-sm border border-brand-gold/60 text-brand-gold inline-flex items-center gap-1">
                    <Crown className="w-3 h-3" /> {t('shop.badge.members_only')}
                  </span>
                )}
                {p.unlockRule && (
                  <span className="text-[11px] font-type tracking-wider px-2 py-1 rounded-sm border border-purple-400/50 text-purple-300">
                    {p.unlockRule === 'escaped' ? t('shop.badge.i_escaped') : t('shop.badge.i_played')}
                  </span>
                )}
              </div>
            </div>

            <PriceTag p={p} large />

            {p.variants.length > 1 || p.variants[0]?.label ? (
              <div>
                <p className="text-sm text-brand-text-secondary mb-2">{t('shop.product.choose')}</p>
                <div className="flex flex-wrap gap-2">
                  {p.variants.map((v) => (
                    <button
                      key={v.id}
                      disabled={v.soldOut}
                      onClick={() => setVariantId(v.id)}
                      className={`px-4 py-2 rounded-md border text-sm ${
                        v.soldOut
                          ? 'border-brand-border/40 text-brand-text-muted line-through cursor-not-allowed'
                          : variantId === v.id
                          ? 'border-brand-red-light/60 bg-brand-red text-brand-bone'
                          : 'border-brand-border text-brand-text hover:border-brand-red/60'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                {variant?.stockLeft !== null && variant?.stockLeft !== undefined && !variant.soldOut && (
                  <p className="text-xs text-amber-300 mt-2">{t('shop.product.only_left', { count: String(variant.stockLeft) })}</p>
                )}
              </div>
            ) : null}

            {p.locked ? (
              <div className="panel p-4 space-y-3">
                <LockNote p={p} />
                {PREMIUM_ENABLED && p.locked === 'premium_only' && (
                  <Link href="/premium" className="btn-outline inline-flex text-sm py-2! px-5!">
                    {t('shop.perks.get_premium')}
                  </Link>
                )}
                {(p.locked === 'unlock_played' || p.locked === 'unlock_escaped') && p.unlockRoomId && (
                  <Link href={`/rooms/${p.unlockRoomId}`} className="btn-outline inline-flex text-sm py-2! px-5!">
                    {t('shop.product.book_room')}
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-brand-border rounded-md">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="p-3 text-brand-text-secondary hover:text-brand-bone"
                      aria-label={t('shop.cart.less')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center tabular-nums">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(10, q + 1))}
                      className="p-3 text-brand-text-secondary hover:text-brand-bone"
                      aria-label={t('shop.cart.more')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    disabled={!canAdd}
                    onClick={() => addToCart(false)}
                    className="btn-outline flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    {added ? t('shop.product.added') : t('shop.product.add')}
                  </button>
                </div>
                <button disabled={!canAdd} onClick={() => addToCart(true)} className="btn-primary w-full disabled:opacity-40">
                  {p.soldOut ? t('shop.badge.sold_out') : t('shop.product.buy_now')}
                </button>
              </div>
            )}

            <div className="panel p-4 space-y-2.5 text-sm">
              {p.pickup && (
                <p className="flex items-start gap-2.5">
                  <Store className="w-4 h-4 mt-0.5 text-brand-red-light shrink-0" />
                  <span>
                    {t('shop.product.pickup_line', { shop: p.sellerName })}
                    {p.pickupNote && <span className="block text-xs text-brand-text-muted">{p.pickupNote}</span>}
                  </span>
                </p>
              )}
              {p.shipping && (
                <p className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 mt-0.5 text-brand-red-light shrink-0" />
                  <span>
                    {p.seller === 'platform'
                      ? PREMIUM_ENABLED && data.perks.isPremium
                        ? t('shop.product.ship_official_free')
                        : t('shop.product.ship_official')
                      : p.shippingCents
                      ? t('shop.product.ship_flat', { price: euro(p.shippingCents) })
                      : t('shop.product.ship_free')}
                  </span>
                </p>
              )}
              {p.seller === 'platform' && data.perks.welcomeGiftAvailable && (
                <p className="flex items-start gap-2.5 text-brand-gold">
                  <Gift className="w-4 h-4 mt-0.5 shrink-0" /> {t('shop.perks.gift_waiting')}
                </p>
              )}
            </div>

            {p.description && (
              <div>
                <h2 className="horror-label mb-2">{t('shop.product.about')}</h2>
                <p className="text-brand-text-secondary whitespace-pre-line leading-relaxed">{p.description}</p>
              </div>
            )}
          </div>
        </div>

        {data.more.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-display font-bold text-brand-bone mb-5">
              {t('shop.product.more_from', { shop: p.sellerName })}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {data.more.map((m) => (
                <ProductCard key={m._id} p={m} showSeller={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
