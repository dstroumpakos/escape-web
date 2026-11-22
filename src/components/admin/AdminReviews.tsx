'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Check, X, Star, Stamp } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

/** Reviews held because a room got many at once (convex/reviews.ts): publish or reject. */
export function AdminReviews({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const rows = useQuery(api.reviews.adminPending, { sessionToken });
  const decide = useMutation(api.reviews.adminDecide);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (reviewId: string, approve: boolean) => {
    setBusy(reviewId);
    try {
      await decide({ sessionToken, reviewId: reviewId as any, approve });
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
                <Stamp className="w-3 h-3" /> {r.stampAt ? `${t('admin.rv.stamp')} ${fmt(r.stampAt)}` : t('admin.rv.booking')} · {t('admin.rv.written')} {fmt(r.createdAt)}
              </p>
            </div>
            <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
              ))}
            </div>
          </div>
          {r.text && <p className="text-sm text-brand-text-secondary mt-3 whitespace-pre-line">{r.text}</p>}
          <div className="flex gap-2 mt-4">
            <button disabled={busy === r._id} onClick={() => act(r._id, true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-300 hover:bg-green-500/25 flex items-center gap-1.5 disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> {t('admin.rv.publish')}
            </button>
            <button disabled={busy === r._id} onClick={() => act(r._id, false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-300 hover:bg-red-500/25 flex items-center gap-1.5 disabled:opacity-50">
              <X className="w-3.5 h-3.5" /> {t('admin.rv.reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
