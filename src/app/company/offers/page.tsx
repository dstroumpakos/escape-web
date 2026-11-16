'use client';

import { useState } from 'react';
import { useCompanyQuery, useCompanyMutation, useCompanyAuth } from '@/lib/companyAuth';
import { api } from '../../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { useToast } from '@/components/company/Toast';
import { Flame, Info, X, Loader2, DoorOpen } from 'lucide-react';

const PRESETS = [10, 15, 20, 25, 30, 40, 50];

type Slot = { time: string; percent: number; offerId?: string };
type Picked = { roomId: string; date: string; slot: Slot } | null;

export default function OffersPage() {
  const { t } = useTranslation();
  const { company } = useCompanyAuth();
  const toast = useToast();
  const board = useCompanyQuery(api.slotOffers.companyBoard, company ? {} : 'skip');
  const setOffer = useCompanyMutation(api.slotOffers.set);
  const removeOffer = useCompanyMutation(api.slotOffers.remove);
  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<Picked>(null);
  const [busy, setBusy] = useState(false);

  const date = board?.days[dayIdx];
  const activeCount = (d: string) =>
    (board?.rooms || []).reduce((n, r) => n + (r.days[d] || []).filter((s) => s.percent > 0).length, 0);

  const save = async (percent: number) => {
    if (!picked) return;
    setBusy(true);
    try {
      await setOffer({ roomId: picked.roomId as any, date: picked.date, time: picked.slot.time, percent });
      toast({ kind: 'success', message: t('cx.offers.saved', { percent: String(percent), time: picked.slot.time }) });
      setPicked(null);
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!picked?.slot.offerId) return;
    setBusy(true);
    try {
      await removeOffer({ offerId: picked.slot.offerId as any });
      toast({ kind: 'success', message: t('cx.offers.removed') });
      setPicked(null);
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Flame className="w-7 h-7 text-brand-red-light" /> {t('cx.offers.title')}
        </h1>
        <p className="text-brand-text-secondary mt-1 text-sm">{t('cx.offers.subtitle')}</p>
      </div>

      <div className="flex gap-2 text-xs text-brand-text-secondary bg-brand-surface border border-white/5 rounded-xl px-3 py-2.5 mb-5">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{t('cx.offers.info')}</span>
      </div>

      {board === undefined ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-brand-surface border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : board.rooms.length === 0 ? (
        <div className="text-center py-16 bg-brand-surface rounded-2xl border border-white/5">
          <DoorOpen className="w-12 h-12 mx-auto mb-3 text-brand-text-secondary/30" />
          <p className="text-sm text-brand-text-secondary">{t('cx.slots.no_rooms_desc')}</p>
        </div>
      ) : (
        <>
          <div className="flex bg-brand-surface border border-white/5 rounded-xl p-1 mb-4 w-fit" role="tablist">
            {board.days.map((d, i) => {
              const n = activeCount(d);
              return (
                <button
                  key={d}
                  role="tab"
                  aria-selected={dayIdx === i}
                  onClick={() => setDayIdx(i)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dayIdx === i ? 'bg-brand-red text-white' : 'text-brand-text-secondary hover:text-white'
                  }`}
                >
                  {t(i === 0 ? 'cx.offers.today' : 'cx.offers.tomorrow')}
                  {n > 0 && <span className="ml-1.5 text-xs opacity-80">· {t('cx.offers.active', { count: String(n) })}</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-brand-text-secondary mb-3 px-1">{t('cx.offers.tap_hint')}</p>

          <div className="space-y-3">
            {board.rooms.map((room) => {
              const slots = (date && room.days[date]) || [];
              return (
                <div key={room._id} className="bg-brand-surface rounded-2xl border border-white/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {room.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={room.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <p className="font-semibold truncate">{room.title}</p>
                  </div>
                  {slots.length === 0 ? (
                    <p className="text-sm text-brand-text-secondary">{t('cx.offers.no_free')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          onClick={() => setPicked({ roomId: room._id, date: date!, slot: s })}
                          className={`px-3 py-2 rounded-xl border text-sm font-semibold tabular-nums transition-all ${
                            s.percent > 0
                              ? 'bg-brand-red/15 border-brand-red/50 text-brand-red-light'
                              : 'border-white/10 hover:border-brand-red/40 hover:bg-white/5'
                          }`}
                        >
                          {s.time}
                          {s.percent > 0 && <span className="ml-1.5">-{s.percent}%</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {picked && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:px-4"
          onClick={busy ? undefined : () => setPicked(null)}
        >
          <div
            className="bg-brand-surface rounded-t-2xl sm:rounded-2xl border border-white/5 p-6 w-full sm:max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('cx.offers.pick', { time: picked.slot.time })}</h2>
              <button onClick={() => setPicked(null)} disabled={busy} className="p-1 hover:bg-white/5 rounded-lg" aria-label={t('cx.common.close')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRESETS.map((pct) => (
                <button
                  key={pct}
                  disabled={busy}
                  onClick={() => save(pct)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
                    picked.slot.percent === pct
                      ? 'bg-brand-red border-brand-red text-white'
                      : 'border-white/10 hover:border-brand-red/50 hover:bg-brand-red/10'
                  }`}
                >
                  -{pct}%
                </button>
              ))}
            </div>
            {picked.slot.offerId && (
              <button
                onClick={remove}
                disabled={busy}
                className="w-full btn-ghost text-sm py-2.5! flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} {t('cx.offers.remove')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
