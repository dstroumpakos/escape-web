'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, Plus, Trash2, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { BOOKING_ENABLED, PASSPORT_ENABLED, PREMIUM_ENABLED } from '@/lib/features';
import { friendlyError } from '@/lib/errors';
import { convertToWebFormat } from '@/lib/imageUtils';
import { CATEGORIES, type Category } from './shopUi';

export type ProductInput = {
  title: string;
  description: string;
  category: Category;
  images: string[];
  priceCents: number;
  variants: { id: string; label: string; stock?: number }[];
  pickup: boolean;
  shipping: boolean;
  shippingCents: number;
  roomIds?: string[];
  premiumOnly?: boolean;
  releaseAt?: number;
  unlockRoomId?: string;
  unlockRule?: 'played' | 'escaped';
  status: 'draft' | 'active' | 'archived';
};

export type EditableProduct = ProductInput & { _id: string };

const inputCls =
  'w-full bg-brand-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-brand-red focus:outline-hidden';
const labelCls = 'block text-sm text-brand-text-secondary mb-1.5';
// Stock choices for the variant dropdown: 0–100 one by one, then bigger steps.
const STOCK_OPTIONS = [
  ...Array.from({ length: 101 }, (_, n) => n),
  150, 200, 250, 300, 400, 500, 750, 1000,
];

function toLocalInput(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function cents(text: string): number {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/**
 * Add / edit one merch item. Used by the business portal (seller "company")
 * and the admin page (seller "platform", always shipped by UNLOCKED).
 */
export function ProductEditor({
  initial,
  seller,
  rooms = [],
  onSave,
  onClose,
  upload,
}: {
  initial?: EditableProduct | null;
  seller: 'platform' | 'company';
  rooms?: { _id: string; title: string }[];
  onSave: (input: ProductInput) => Promise<unknown>;
  onClose: () => void;
  upload: (file: File) => Promise<string>;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'apparel');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [price, setPrice] = useState(initial ? String(initial.priceCents / 100) : '');
  const [variants, setVariants] = useState(
    (initial?.variants ?? [{ id: '', label: t('shop.editor.one_size') }]).map((x) => ({
      id: x.id,
      label: x.label,
      stock: x.stock === undefined ? '' : String(x.stock),
    }))
  );
  const [pickup, setPickup] = useState(seller === 'company' ? initial?.pickup ?? true : false);
  const [shipping, setShipping] = useState(seller === 'platform' ? true : initial?.shipping ?? false);
  const [shippingPrice, setShippingPrice] = useState(initial?.shippingCents ? String(initial.shippingCents / 100) : '');
  const [roomIds, setRoomIds] = useState<string[]>(initial?.roomIds ?? []);
  const [premiumOnly, setPremiumOnly] = useState(!!initial?.premiumOnly);
  const [releaseAt, setReleaseAt] = useState(toLocalInput(initial?.releaseAt));
  const [unlockRoomId, setUnlockRoomId] = useState(initial?.unlockRoomId ?? '');
  const [unlockRule, setUnlockRule] = useState<'played' | 'escaped'>(initial?.unlockRule ?? 'played');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>(initial?.status ?? 'active');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setErr('');
    try {
      for (const f of Array.from(files).slice(0, 6 - images.length)) {
        if (!f.type.startsWith('image/') || f.size > 10 * 1024 * 1024) {
          setErr(t('shop.editor.photo_rules'));
          continue;
        }
        const url = await upload(await convertToWebFormat(f));
        setImages((cur) => [...cur, url].slice(0, 6));
      }
    } catch (e) {
      setErr(friendlyError(e, t));
    } finally {
      setUploading(false);
    }
  };

  const move = (i: number, d: -1 | 1) =>
    setImages((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const priceCents = cents(price);
    if (!Number.isFinite(priceCents)) return setErr(t('shop.editor.bad_price'));
    const shippingCents = seller === 'company' && shipping ? cents(shippingPrice || '0') : 0;
    if (!Number.isFinite(shippingCents)) return setErr(t('shop.editor.bad_price'));
    const cleanVariants = variants.map((x) => {
      const stock = x.stock.trim() === '' ? undefined : Number(x.stock);
      return { id: x.id, label: x.label, stock: stock !== undefined && Number.isFinite(stock) ? stock : undefined };
    });
    setSaving(true);
    try {
      await onSave({
        title,
        description,
        category,
        images,
        priceCents,
        variants: cleanVariants,
        pickup: seller === 'company' && pickup,
        shipping: seller === 'platform' ? true : shipping,
        shippingCents,
        roomIds: seller === 'company' ? roomIds : undefined,
        premiumOnly,
        releaseAt: releaseAt ? new Date(releaseAt).getTime() : undefined,
        unlockRoomId: seller === 'company' && unlockRoomId ? unlockRoomId : undefined,
        unlockRule: seller === 'company' && unlockRoomId ? unlockRule : undefined,
        status,
      });
      onClose();
    } catch (e2) {
      setErr(friendlyError(e2, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-surface w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10"
      >
        <div className="sticky top-0 z-10 bg-brand-surface border-b border-white/5 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? t('shop.editor.edit_title') : t('shop.editor.new_title')}</h2>
          <button type="button" onClick={onClose} className="p-2 -mr-2" aria-label={t('cx.common.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Photos */}
          <div>
            <label className={labelCls}>{t('shop.editor.photos')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {images.map((url, i) => (
                <div key={url + i} className="relative aspect-square rounded-lg overflow-hidden bg-black/40 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] bg-black/70 rounded px-1.5 py-0.5">
                      {t('shop.editor.cover')}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1">
                    <button type="button" onClick={() => move(i, -1)} aria-label={t('shop.editor.move_left')} className="p-1">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))}
                      aria-label={t('shop.editor.remove_photo')}
                      className="p-1 text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} aria-label={t('shop.editor.move_right')} className="p-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {images.length < 6 && (
                <label className="aspect-square rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-xs text-brand-text-secondary cursor-pointer hover:border-brand-red/60">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                  {t('shop.editor.add_photo')}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      addPhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('shop.editor.name')}</label>
              <input className={inputCls} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('shop.editor.description')}</label>
              <textarea
                className={`${inputCls} min-h-[90px]`}
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>{t('shop.editor.category')}</label>
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`shop.category.${c}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('shop.editor.price')}</label>
              <input
                className={inputCls}
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25"
                required
              />
            </div>
          </div>

          {/* Variants */}
          <div>
            <label className={labelCls}>{t('shop.editor.variants')}</label>
            <p className="text-xs text-brand-text-secondary mb-2">{t('shop.editor.variants_hint')}</p>
            <div className="space-y-2">
              {variants.map((x, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${inputCls} flex-1 min-w-0`}
                    value={x.label}
                    maxLength={40}
                    placeholder={t('shop.editor.variant_placeholder')}
                    onChange={(e) => setVariants((cur) => cur.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))}
                  />
                  <select
                    className={`${inputCls.replace('w-full ', '')} w-36 shrink-0`}
                    value={x.stock}
                    aria-label={t('shop.editor.stock')}
                    onChange={(e) => setVariants((cur) => cur.map((y, j) => (j === i ? { ...y, stock: e.target.value } : y)))}
                  >
                    <option value="">{t('shop.editor.stock_unlimited')}</option>
                    {x.stock !== '' && !STOCK_OPTIONS.includes(Number(x.stock)) && (
                      <option value={x.stock}>{x.stock}</option>
                    )}
                    {STOCK_OPTIONS.map((n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={variants.length <= 1}
                    onClick={() => setVariants((cur) => cur.filter((_, j) => j !== i))}
                    className="p-2.5 rounded-xl border border-white/10 text-brand-text-secondary disabled:opacity-30"
                    aria-label={t('shop.editor.remove_variant')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {variants.length < 20 && (
              <button
                type="button"
                onClick={() => setVariants((cur) => [...cur, { id: '', label: '', stock: '' }])}
                className="mt-2 text-sm text-brand-red-light inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> {t('shop.editor.add_variant')}
              </button>
            )}
          </div>

          {/* Delivery */}
          {seller === 'company' ? (
            <div className="space-y-3">
              <label className={labelCls}>{t('shop.editor.delivery')}</label>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="mt-1" />
                <span>
                  {t('shop.editor.pickup')}
                  <span className="block text-xs text-brand-text-secondary">{t('shop.editor.pickup_hint')}</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={shipping} onChange={(e) => setShipping(e.target.checked)} className="mt-1" />
                <span>{t('shop.editor.shipping')}</span>
              </label>
              {shipping && (
                <div className="pl-7">
                  <label className={labelCls}>{t('shop.editor.shipping_price')}</label>
                  <input
                    className={`${inputCls} max-w-[160px]`}
                    inputMode="decimal"
                    value={shippingPrice}
                    placeholder="4.50"
                    onChange={(e) => setShippingPrice(e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary">{t('shop.editor.official_shipping')}</p>
          )}

          {/* Rooms */}
          {seller === 'company' && rooms.length > 0 && (
            <div>
              <label className={labelCls}>{t('shop.editor.rooms')}</label>
              <p className="text-xs text-brand-text-secondary mb-2">{t('shop.editor.rooms_hint')}</p>
              <div className="flex flex-wrap gap-2">
                {rooms.map((r) => {
                  const on = roomIds.includes(r._id);
                  return (
                    <button
                      type="button"
                      key={r._id}
                      onClick={() => setRoomIds((cur) => (on ? cur.filter((x) => x !== r._id) : [...cur, r._id]))}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        on ? 'bg-brand-red/15 border-brand-red/50 text-brand-red-light' : 'border-white/10 text-brand-text-secondary'
                      }`}
                    >
                      {r.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special */}
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <p className="text-sm font-semibold">{t('shop.editor.special')}</p>
            {PREMIUM_ENABLED && (
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={premiumOnly} onChange={(e) => setPremiumOnly(e.target.checked)} className="mt-1" />
              <span>
                {t('shop.editor.premium_only')}
                <span className="block text-xs text-brand-text-secondary">{t('shop.editor.premium_only_hint')}</span>
              </span>
            </label>
            )}
            <div>
              <label className={labelCls}>{t('shop.editor.release')}</label>
              <input
                type="datetime-local"
                className={`${inputCls} max-w-[260px]`}
                value={releaseAt}
                onChange={(e) => setReleaseAt(e.target.value)}
              />
              <p className="text-xs text-brand-text-secondary mt-1.5">{t('shop.editor.release_hint')}</p>
            </div>
            {(BOOKING_ENABLED || PASSPORT_ENABLED) && seller === 'company' && rooms.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('shop.editor.unlock_room')}</label>
                  <select className={inputCls} value={unlockRoomId} onChange={(e) => setUnlockRoomId(e.target.value)}>
                    <option value="">{t('shop.editor.unlock_none')}</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
                {unlockRoomId && (
                  <div>
                    <label className={labelCls}>{t('shop.editor.unlock_rule')}</label>
                    <select
                      className={inputCls}
                      value={unlockRule}
                      onChange={(e) => setUnlockRule(e.target.value as 'played' | 'escaped')}
                    >
                      <option value="played">{t('shop.editor.unlock_played')}</option>
                      <option value="escaped">{t('shop.editor.unlock_escaped')}</option>
                    </select>
                  </div>
                )}
                <p className="sm:col-span-2 text-xs text-brand-text-secondary">{t('shop.editor.unlock_hint')}</p>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>{t('shop.editor.status')}</label>
            <select
              className={`${inputCls} max-w-[220px]`}
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
            >
              <option value="active">{t('shop.status.active')}</option>
              <option value="draft">{t('shop.status.draft')}</option>
              <option value="archived">{t('shop.status.archived')}</option>
            </select>
          </div>

          {err && <p className="text-sm text-red-300">{err}</p>}
        </div>

        <div className="sticky bottom-0 bg-brand-surface border-t border-white/5 px-5 py-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-brand-text-secondary hover:text-white">
            {t('cx.common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-red text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('shop.editor.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
