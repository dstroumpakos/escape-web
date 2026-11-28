'use client';

import { useState } from 'react';
import { PASSPORT_ENABLED } from '@/lib/features';
import { useMutation, useQuery } from 'convex/react';
import { Check, X, Star, CalendarCheck } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';

/**
 * Every new review waits here (convex/reviews.ts): approve it and it shows on
 * the room, or decline it with a reason that the player gets by email.
 */
export function AdminReviews({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const rows = useQuery(api.reviews.adminPending, { sessionToken });
  const decide = useMutation(api.reviews.adminDecide);
  const [busy, setBusy] = useState<string | null>(null);
  // The review being declined and its reason
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const act = async (reviewId: string, approve: boolean) => {
    setErr('');
    if (!approve && !reason.trim()) {
      setErr(t('admin.rv.reason_needed'));
      return;
    }
    setBusy(reviewId);
    try {
      await decide({ sessionToken, reviewId: reviewId as any, approve, reason: approve ? undefined : reason.trim() });
      setDeclining(null);
      setReason('');
    } catch (e) {
      setErr(cleanError(e));
    } finally {
      setBusy(null);
    }
  };
  const fmt = (ms: number) => new Date(ms).toLocaleString('el-GR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (rows === undefined) return <p className="text-sm text-brand-text-secondary">…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-text-secondary">{t('admin.rv.desc')}</p>
      {rows.length === 0 && <p className="text-sm text-brand-text-muted">{t('admin.rv.none')}</p>}
      {rows.map((r) => (
        <div key={r._id} className="bg-brand-surface rounded-2xl border border-white/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{r.roomTitle} <span className="text-brand-text-secondary font-normal">· {r.companyName}</span></p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                {r.userName} ({r.userEmail}) · {t('admin.rv.member_since')} {fmt(r.userSince)}
              </p>
              <p className="text-xs text-brand-text-muted mt-0.5 flex items-center gap-1">
                <CalendarCheck className="w-3 h-3" />
                {PASSPORT_ENABLED && r.stampAt ? `${t('admin.rv.stamp')} ${fmt(r.stampAt)}` : r.hasBooking ? t('admin.rv.booking') : t('admin.rv.none_badge')} · {t('admin.rv.written')} {fmt(r.createdAt)}
              </p>
            </div>
            <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
              ))}
            </div>
          </div>
          {r.text && <p className="text-sm text-brand-text-secondary mt-3 whitespace-pre-line">{r.text}</p>}

          {declining === r._id ? (
            <div className="mt-4 space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('admin.rv.reason_ph')}
                rows={3}
                maxLength={1000}
                autoFocus
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-red focus:outline-hidden resize-none"
              />
              {err && <p className="text-xs text-brand-red-light">{err}</p>}
              <div className="flex gap-2">
                <button disabled={busy === r._id} onClick={() => act(r._id, false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-200 hover:bg-red-500/30 flex items-center gap-1.5 disabled:opacity-50">
                  <X className="w-3.5 h-3.5" /> {t('admin.rv.confirm_reject')}
                </button>
                <button disabled={busy === r._id} onClick={() => { setDeclining(null); setReason(''); setErr(''); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-brand-text-secondary hover:bg-white/10">
                  {t('admin.rv.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button disabled={busy === r._id} onClick={() => act(r._id, true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-300 hover:bg-green-500/25 flex items-center gap-1.5 disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> {t('admin.rv.publish')}
              </button>
              <button disabled={busy === r._id} onClick={() => { setDeclining(r._id); setReason(''); setErr(''); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-300 hover:bg-red-500/25 flex items-center gap-1.5 disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> {t('admin.rv.reject')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
