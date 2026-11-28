'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Eye, EyeOff, Loader2, Package, Pencil, Plus, ShoppingBag, Store } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { PREMIUM_ENABLED } from '@/lib/features';
import { friendlyError } from '@/lib/errors';
import { ProductEditor, type EditableProduct, type ProductInput } from '@/components/shop/ProductEditor';
import { SellerOrders } from '@/components/shop/SellerOrders';
import { euro } from '@/components/shop/shopUi';

type View = 'orders' | 'official' | 'companies';

/** Admin: UNLOCKED Official store, its orders, and moderation of company items. */
export function AdminShop({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('orders');
  const stats = useQuery(api.merch.adminMerchStats, { sessionToken });
  const official = useQuery(api.merch.adminProducts, view === 'official' ? { sessionToken, seller: 'platform' } : 'skip');
  const companyItems = useQuery(api.merch.adminProducts, view === 'companies' ? { sessionToken, seller: 'company' } : 'skip');
  const orders = useQuery(api.merch.adminOrders, view === 'orders' ? { sessionToken, seller: 'platform' } : 'skip');
  const save = useMutation(api.merch.adminSaveProduct);
  const setStatus = useMutation(api.merch.adminSetProductStatus);
  const moderate = useMutation(api.merch.adminModerateProduct);
  const updateOrder = useMutation(api.merch.adminUpdateOrder);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const getUrl = useMutation(api.companies.getUrlMutation);
  const [editing, setEditing] = useState<EditableProduct | 'new' | null>(null);
  const [err, setErr] = useState('');

  const upload = async (file: File) => {
    const uploadUrl = await generateUploadUrl({ adminToken: sessionToken });
    const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const { storageId } = await res.json();
    const url = await getUrl({ storageId, adminToken: sessionToken });
    if (!url) throw new Error('Upload failed');
    return url;
  };

  const onSave = async (input: ProductInput) => {
    const { roomIds: _r, unlockRoomId: _u, unlockRule: _x, ...rest } = input;
    await save({ sessionToken, productId: editing && editing !== 'new' ? (editing._id as any) : undefined, ...rest });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('shop.admin.official_sales'), value: stats ? euro(stats.officialSalesCents) : '…' },
          { label: t('shop.admin.company_sales'), value: stats ? euro(stats.companySalesCents) : '…' },
          { label: t('shop.admin.open_official'), value: stats?.openOfficialOrders ?? '…' },
          { label: t('shop.admin.shops'), value: stats ? `${stats.shops} · ${stats.companyProducts}` : '…' },
        ].map((c) => (
          <div key={c.label} className="bg-brand-surface rounded-xl border border-white/5 p-4">
            <p className="text-xs text-brand-text-secondary">{c.label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['orders', 'official', 'companies'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
              view === v ? 'bg-brand-red text-white' : 'bg-brand-surface border border-white/5 text-brand-text-secondary hover:text-white'
            }`}
          >
            {v === 'orders' ? <Package className="w-4 h-4" /> : v === 'official' ? <ShoppingBag className="w-4 h-4" /> : <Store className="w-4 h-4" />}
            {t(`shop.admin.view_${v}`)}
          </button>
        ))}
        {view === 'official' && (
          <button
            onClick={() => setEditing('new')}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold bg-brand-red text-white inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('shop.portal.add_item')}
          </button>
        )}
      </div>
      {err && <p className="text-sm text-red-300">{err}</p>}

      {view === 'orders' && (
        <SellerOrders
          orders={orders}
          onUpdate={(orderId, status, extra) => updateOrder({ sessionToken, orderId: orderId as any, status, ...extra })}
        />
      )}

      {view === 'official' &&
        (official === undefined ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        ) : official.length === 0 ? (
          <p className="text-center text-brand-text-secondary py-10">{t('shop.admin.no_official')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {official.map((p) => (
              <div key={p._id} className="bg-brand-surface rounded-xl border border-white/5 p-3 flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold truncate">{p.title}</p>
                    <span className="text-sm tabular-nums">{euro(p.priceCents)}</span>
                  </div>
                  <p className="text-xs text-brand-text-secondary">
                    {t(`shop.status.${p.status}`)} · {t('shop.portal.sold', { count: String(p.sold) })}
                    {p.releaseAt ? ` · ${t('shop.admin.drop', { date: new Date(p.releaseAt).toLocaleString() })}` : ''}
                    {PREMIUM_ENABLED && p.premiumOnly ? ` · ${t('shop.badge.members_only')}` : ''}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditing(p as any)} className="p-1.5 rounded-lg hover:bg-white/5" aria-label={t('shop.portal.edit')}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setStatus({ sessionToken, productId: p._id, status: p.status === 'active' ? 'draft' : 'active' }).catch((e) =>
                          setErr(friendlyError(e, t))
                        )
                      }
                      className="px-2 py-1 rounded-lg hover:bg-white/5 text-xs text-brand-text-secondary"
                    >
                      {p.status === 'active' ? t('shop.portal.unpublish') : t('shop.portal.publish')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      {view === 'companies' &&
        (companyItems === undefined ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        ) : companyItems.length === 0 ? (
          <p className="text-center text-brand-text-secondary py-10">{t('shop.admin.no_company_items')}</p>
        ) : (
          <div className="space-y-2">
            {companyItems.map((p) => (
              <div key={p._id} className="bg-brand-surface rounded-xl border border-white/5 p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {p.title} <span className="text-brand-text-secondary font-normal">· {p.companyName}</span>
                  </p>
                  <p className="text-xs text-brand-text-secondary">
                    {euro(p.priceCents)} · {t(`shop.status.${p.status}`)} · {t('shop.portal.sold', { count: String(p.sold) })}
                    {p.hiddenByAdmin && <span className="text-red-300"> · {t('shop.portal.hidden_by_admin')}</span>}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const note = p.hiddenByAdmin ? undefined : prompt(t('shop.admin.hide_reason')) ?? undefined;
                    if (!p.hiddenByAdmin && note === undefined) return;
                    try {
                      await moderate({ sessionToken, productId: p._id, hidden: !p.hiddenByAdmin, note });
                    } catch (e) {
                      setErr(friendlyError(e, t));
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 ${
                    p.hiddenByAdmin ? 'bg-white/5 text-brand-text-secondary' : 'border border-red-500/30 text-red-300'
                  }`}
                >
                  {p.hiddenByAdmin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {p.hiddenByAdmin ? t('shop.admin.show') : t('shop.admin.hide')}
                </button>
              </div>
            ))}
          </div>
        ))}

      {editing && (
        <ProductEditor
          initial={editing === 'new' ? null : editing}
          seller="platform"
          onSave={onSave}
          onClose={() => setEditing(null)}
          upload={upload}
        />
      )}
    </div>
  );
}
