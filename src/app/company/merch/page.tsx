'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { useCompanyAuth, useCompanyMutation, useCompanyPath, useCompanyQuery } from '@/lib/companyAuth';
import { api } from '../../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { BOOKING_ENABLED, PREMIUM_ENABLED } from '@/lib/features';
import { useToast } from '@/components/company/Toast';
import { friendlyError } from '@/lib/errors';
import { ProductEditor, type EditableProduct, type ProductInput } from '@/components/shop/ProductEditor';
import { SellerOrders } from '@/components/shop/SellerOrders';
import { euro } from '@/components/shop/shopUi';
import {
  Crown,
  ExternalLink,
  EyeOff,
  Loader2,
  Package,
  Pencil,
  Plus,
  Save,
  ShoppingBag,
  Store,
  Trash2,
  Wallet,
} from 'lucide-react';

type Tab = 'orders' | 'items' | 'settings';

export default function CompanyMerchPage() {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const p = useCompanyPath();
  const companyId = company?.id as any;
  const args = companyId ? { companyId } : 'skip';

  const [tab, setTab] = useState<Tab>('orders');
  const summary = useCompanyQuery(api.merch.companyMerchSummary, args);
  const products = useCompanyQuery(api.merch.companyProducts, args);
  const orders = useCompanyQuery(api.merch.companyOrders, args);
  const settings = useCompanyQuery(api.merch.companyMerchSettings, args);
  const rooms = useCompanyQuery(api.companies.getRooms, args);

  const saveProduct = useCompanyMutation(api.merch.saveProduct);
  const setStatus = useCompanyMutation(api.merch.setProductStatus);
  const deleteProduct = useCompanyMutation(api.merch.deleteProduct);
  const updateOrder = useCompanyMutation(api.merch.companyUpdateOrder);
  const saveSettings = useCompanyMutation(api.merch.saveCompanyMerchSettings);
  const generateUploadUrl = useCompanyMutation(api.companies.generateUploadUrl);
  const getUrl = useCompanyMutation(api.companies.getUrlMutation);

  const [editing, setEditing] = useState<EditableProduct | null | 'new'>(null);
  const [discount, setDiscount] = useState('0');
  const [pickupNote, setPickupNote] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [storeUrl, setStoreUrl] = useState('https://unlocked.gr/shop/store/');

  // The public shop lives on the main site, never on business.
  useEffect(() => {
    setStoreUrl(window.location.origin.replace('://business.', '://') + '/shop/store/');
  }, []);

  useEffect(() => {
    if (settings && !loaded) {
      setDiscount(String(settings.premiumDiscountPercent));
      setPickupNote(settings.pickupNote);
      setLoaded(true);
    }
  }, [settings, loaded]);

  const upload = async (file: File) => {
    const uploadUrl = await generateUploadUrl({});
    const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const { storageId } = await res.json();
    const url = await getUrl({ storageId });
    if (!url) throw new Error('Upload failed');
    return url;
  };

  if (!company) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-text-secondary" />
      </div>
    );
  }

  const roomOptions = (rooms ?? []).map((r: any) => ({ _id: r._id as string, title: r.title as string }));
  const roomTitle = (id: string) => roomOptions.find((r) => r._id === id)?.title ?? '';

  const onSave = async (input: ProductInput) => {
    await saveProduct({
      companyId,
      productId: editing && editing !== 'new' ? (editing._id as any) : undefined,
      ...input,
      roomIds: input.roomIds as any,
      unlockRoomId: input.unlockRoomId as any,
    });
    toast({ kind: 'success', message: t('shop.portal.saved') });
  };

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'orders', label: t('shop.portal.tab_orders'), badge: summary?.openOrders },
    { id: 'items', label: t('shop.portal.tab_items'), badge: undefined },
    { id: 'settings', label: t('shop.portal.tab_settings') },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-brand-red-light" />
            {t('shop.portal.title')}
          </h1>
          <p className="text-brand-text-secondary mt-1">{t('shop.portal.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`${storeUrl}${company.id}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl text-sm border border-white/10 text-brand-text-secondary hover:text-white inline-flex items-center gap-2"
          >
            <Store className="w-4 h-4" /> {t('shop.portal.view_store')} <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setEditing('new')}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-red text-white inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('shop.portal.add_item')}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('shop.portal.open_orders'), value: summary?.openOrders ?? '…' },
          { label: t('shop.portal.pickups_today'), value: summary?.pickupsToday ?? '…' },
          { label: t('shop.portal.month_sales'), value: summary ? euro(summary.monthSalesCents) : '…' },
          { label: t('shop.portal.live_items'), value: summary?.activeProducts ?? '…' },
        ].map((c) => (
          <div key={c.label} className="bg-brand-surface rounded-xl border border-white/5 p-4">
            <p className="text-xs text-brand-text-secondary">{c.label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {settings && !settings.onlinePayment && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm flex items-start gap-3">
          <Wallet className="w-5 h-5 text-amber-300 shrink-0" />
          <p>
            {t('shop.portal.no_online')}{' '}
            <Link href={p('/company/payments')} className="underline text-amber-200">
              {t('shop.portal.connect_payments')}
            </Link>
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6">
        {tabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px inline-flex items-center gap-2 ${
              tab === x.id ? 'border-brand-red text-white' : 'border-transparent text-brand-text-secondary hover:text-white'
            }`}
          >
            {x.label}
            {!!x.badge && <span className="text-[11px] bg-brand-red rounded-full px-1.5 py-0.5 text-white">{x.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <SellerOrders
          orders={orders}
          onUpdate={(orderId, status, extra) => updateOrder({ companyId, orderId: orderId as any, status, ...extra })}
        />
      )}

      {tab === 'items' &&
        (products === undefined ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-text-secondary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-14 bg-brand-surface rounded-2xl border border-white/5">
            <Package className="w-12 h-12 mx-auto mb-3 text-brand-text-secondary opacity-50" />
            <p className="font-semibold mb-1">{t('shop.portal.empty_title')}</p>
            <p className="text-sm text-brand-text-secondary max-w-md mx-auto mb-5">{t('shop.portal.empty_desc')}</p>
            <button
              onClick={() => setEditing('new')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-red text-white inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t('shop.portal.add_item')}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {products.map((prod) => {
              const stock = prod.variants.some((x) => x.stock === undefined)
                ? null
                : prod.variants.reduce((s, x) => s + (x.stock ?? 0), 0);
              return (
                <div key={prod._id} className="bg-brand-surface rounded-xl border border-white/5 p-3 flex gap-3">
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white/5">
                    {prod.images[0] ? (
                      <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 m-7 opacity-40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold truncate">{prod.title}</p>
                      <span className="text-sm font-semibold tabular-nums">{euro(prod.priceCents)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ${
                          prod.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/5 text-brand-text-secondary'
                        }`}
                      >
                        {t(`shop.status.${prod.status}`)}
                      </span>
                      {prod.hiddenByAdmin && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 inline-flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> {t('shop.portal.hidden_by_admin')}
                        </span>
                      )}
                      {PREMIUM_ENABLED && prod.premiumOnly && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold inline-flex items-center gap-1">
                          <Crown className="w-3 h-3" /> {t('shop.badge.members_only')}
                        </span>
                      )}
                      {prod.unlockRoomId && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
                          {t('shop.portal.unlock_for', { room: roomTitle(prod.unlockRoomId) })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-secondary mt-1.5">
                      {t('shop.portal.sold', { count: String(prod.sold) })}
                      {' · '}
                      {stock === null ? t('shop.portal.stock_unlimited') : t('shop.portal.stock_left', { count: String(stock) })}
                    </p>
                    {prod.hiddenByAdmin && prod.adminNote && (
                      <p className="text-xs text-red-300 mt-1">{prod.adminNote}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => setEditing({ ...(prod as any), roomIds: prod.roomIds ?? [] })}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-brand-text-secondary"
                        aria-label={t('shop.portal.edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await setStatus({
                              companyId,
                              productId: prod._id,
                              status: prod.status === 'active' ? 'draft' : 'active',
                            });
                          } catch (e) {
                            toast({ kind: 'error', message: friendlyError(e, t) });
                          }
                        }}
                        className="px-2 py-1 rounded-lg hover:bg-white/5 text-xs text-brand-text-secondary"
                      >
                        {prod.status === 'active' ? t('shop.portal.unpublish') : t('shop.portal.publish')}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(t('shop.portal.confirm_delete'))) return;
                          try {
                            const r = await deleteProduct({ companyId, productId: prod._id });
                            toast({
                              kind: 'success',
                              message: r.archived ? t('shop.portal.archived') : t('shop.portal.deleted'),
                            });
                          } catch (e) {
                            toast({ kind: 'error', message: friendlyError(e, t) });
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-300 ml-auto"
                        aria-label={t('shop.portal.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === 'settings' && settings && (
        <div className="space-y-5 max-w-2xl">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingSettings(true);
              try {
                await saveSettings({ companyId, premiumDiscountPercent: Number(discount) || 0, pickupNote });
                toast({ kind: 'success', message: t('shop.portal.saved') });
              } catch (err) {
                toast({ kind: 'error', message: friendlyError(err, t) });
              } finally {
                setSavingSettings(false);
              }
            }}
            className="bg-brand-surface rounded-2xl border border-white/5 p-5 space-y-5"
          >
            {PREMIUM_ENABLED && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-1">
                <Crown className="w-4 h-4 text-brand-gold" /> {t('shop.portal.premium_discount')}
              </label>
              <p className="text-xs text-brand-text-secondary mb-3">{t('shop.portal.premium_discount_hint')}</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="flex-1 accent-brand-red"
                />
                <span className="w-14 text-right font-bold tabular-nums">{discount}%</span>
              </div>
            </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-1">{t('shop.portal.pickup_note')}</label>
              <p className="text-xs text-brand-text-secondary mb-2">{t('shop.portal.pickup_note_hint')}</p>
              <input
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-sm"
                value={pickupNote}
                maxLength={200}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder={t('shop.portal.pickup_note_placeholder')}
              />
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-red text-white inline-flex items-center gap-2 disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('shop.editor.save')}
            </button>
          </form>

          <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 text-sm space-y-2">
            {BOOKING_ENABLED && (<>
            <p className="font-semibold">{t('shop.portal.fees_title')}</p>
            <p className="text-brand-text-secondary">
              {settings.plan === 'unlimited' ? t('shop.portal.fees_unlimited') : t('shop.portal.fees_payg')}
            </p>
            {settings.plan !== 'unlimited' && summary && (
              <p className="text-brand-text-secondary">
                {t('shop.portal.fees_month', { fee: euro(summary.monthFeeCents), sales: euro(summary.monthSalesCents) })}
              </p>
            )}
            </>)}
            <p className="text-brand-text-secondary">{t('shop.portal.seller_duties')}</p>
          </div>
        </div>
      )}

      {editing && (
        <ProductEditor
          initial={editing === 'new' ? null : editing}
          seller="company"
          rooms={roomOptions}
          onSave={onSave}
          onClose={() => setEditing(null)}
          upload={upload}
        />
      )}
    </div>
  );
}
