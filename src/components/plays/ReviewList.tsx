'use client';

import { useState } from 'react';
import { Check, X, Loader2, Camera, Receipt, Mail, MapPin, CalendarCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { LevelChip, formatDay, formatEscape, type Level } from './levels';

export type ReviewRow = {
  _id: string;
  playerName: string;
  playerAvatar: string;
  playerPlayed: number;
  title: string;
  company: string;
  city: string;
  playedOn: string;
  escaped: boolean;
  escapeSeconds: number | null;
  hintsUsed: number | null;
  teammates: number;
  status: string;
  proofKind: string | null;
  proofUrl: string | null;
  proofText: string | null;
  photoTakenAt: string | null;
  photoKm: number | null;
  proofCheck: string | null;
  reviewNote: string | null;
};

/**
 * Review queue of Rooms Played entries (company portal and admin).
 * `onReview` approves or rejects the given ids.
 */
export function ReviewList({
  rows,
  onReview,
  readOnly,
  showCompany,
}: {
  rows: ReviewRow[] | undefined;
  onReview: (ids: string[], approve: boolean, note?: string) => Promise<unknown>;
  readOnly?: boolean;
  showCompany?: boolean;
}) {
  const { t, language } = useTranslation();
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  const [note, setNote] = useState('');

  if (!rows) return <Loader2 className="w-6 h-6 animate-spin mx-auto my-10 text-brand-text-secondary" />;
  if (rows.length === 0) return <p className="text-sm text-brand-text-secondary text-center py-10">{t('pl.review.empty')}</p>;

  const run = async (ids: string[], approve: boolean, n?: string) => {
    setBusy(true);
    setError('');
    try {
      await onReview(ids, approve, n);
      setSel((s) => s.filter((x) => !ids.includes(x)));
      setRejecting(null);
      setNote('');
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 text-brand-text-secondary">
            <input type="checkbox" checked={sel.length === rows.length} onChange={(e) => setSel(e.target.checked ? rows.map((r) => r._id) : [])} />
            {t('pl.review.select_all')}
          </label>
          {sel.length > 0 && (
            <>
              <button disabled={busy} onClick={() => run(sel, true)} className="rounded-full px-3 py-1.5 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1.5 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" /> {t('pl.review.approve_n', { n: String(sel.length) })}
              </button>
              <button disabled={busy} onClick={() => setRejecting(sel)} className="rounded-full px-3 py-1.5 bg-red-500/10 text-red-300 hover:bg-red-500/20 flex items-center gap-1.5 text-xs font-semibold">
                <X className="w-3.5 h-3.5" /> {t('pl.review.reject_n', { n: String(sel.length) })}
              </button>
            </>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {rows.map((r) => (
        <div key={r._id} className="bg-brand-surface rounded-2xl border border-white/5 p-4 flex gap-4">
          {!readOnly && (
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              aria-label={r.playerName}
              checked={sel.includes(r._id)}
              onChange={(e) => setSel((s) => (e.target.checked ? [...s, r._id] : s.filter((x) => x !== r._id)))}
            />
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {r.playerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.playerAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">{r.playerName.charAt(0)}</span>
              )}
              <span className="font-semibold">{r.playerName}</span>
              <span className="text-xs text-brand-text-muted">{t('pl.review.played_count', { n: String(r.playerPlayed) })}</span>
              <LevelChip level={r.status as Level} small />
            </div>
            <p className="text-sm">
              <strong>{r.title}</strong>
              {showCompany && r.company ? ` · ${r.company}` : ''}
              {r.city ? ` · ${r.city}` : ''}
            </p>
            <p className="text-xs text-brand-text-secondary flex flex-wrap gap-x-3 gap-y-1">
              <span className="flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5" /> {formatDay(r.playedOn, language)}</span>
              <span>{r.escaped ? t('pl.escaped_in', { time: formatEscape(r.escapeSeconds) }) : t('pl.trapped')}</span>
              {r.hintsUsed !== null && <span>{t('pl.review.hints', { n: String(r.hintsUsed) })}</span>}
              {r.teammates > 0 && <span>{t('pl.review.teammates', { n: String(r.teammates) })}</span>}
            </p>
            {r.proofKind && (
              <p className="text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 text-brand-text-secondary">
                  {r.proofKind === 'photo' ? <Camera className="w-3.5 h-3.5" /> : r.proofKind === 'receipt' ? <Receipt className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                  {t(`pl.review.proof_${r.proofKind}`)}
                </span>
                {r.photoTakenAt && <span className="text-brand-text-secondary">{t('pl.review.taken', { date: formatDay(r.photoTakenAt, language) })}</span>}
                {r.photoKm !== null && <span className="flex items-center gap-1 text-brand-text-secondary"><MapPin className="w-3.5 h-3.5" /> {t('pl.review.km', { km: String(r.photoKm) })}</span>}
                {r.proofCheck === 'match' && <span className="flex items-center gap-1 text-emerald-300"><ShieldCheck className="w-3.5 h-3.5" /> {t('pl.review.check_match')}</span>}
                {r.proofCheck === 'mismatch' && <span className="flex items-center gap-1 text-amber-300"><AlertTriangle className="w-3.5 h-3.5" /> {t('pl.review.check_mismatch')}</span>}
              </p>
            )}
            {r.proofText && (
              <details className="text-xs">
                <summary className="cursor-pointer text-brand-text-secondary flex items-center gap-1"><Mail className="w-3.5 h-3.5 inline" /> {t('pl.review.email')}</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words bg-black/40 rounded-lg p-3 max-h-60 overflow-y-auto font-sans text-brand-text-secondary">{r.proofText}</pre>
              </details>
            )}
            {!r.proofKind && !r.proofText && r.status === 'declared' && <p className="text-xs text-brand-text-muted">{t('pl.review.no_proof')}</p>}
            {r.reviewNote && <p className="text-xs text-red-300">{r.reviewNote}</p>}

            {!readOnly && (r.status === 'pending' || r.status === 'declared') && (
              <div className="flex gap-2 pt-1">
                <button disabled={busy} onClick={() => run([r._id], true)} className="rounded-full px-3 py-1.5 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1.5 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" /> {t('pl.review.approve')}
                </button>
                <button disabled={busy} onClick={() => setRejecting([r._id])} className="rounded-full px-3 py-1.5 bg-red-500/10 text-red-300 hover:bg-red-500/20 flex items-center gap-1.5 text-xs font-semibold">
                  <X className="w-3.5 h-3.5" /> {t('pl.review.reject')}
                </button>
              </div>
            )}
          </div>
          {r.proofUrl && (
            <a href={r.proofUrl} target="_blank" rel="noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.proofUrl} alt={t('pl.proof.alt')} className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border border-white/10" />
            </a>
          )}
        </div>
      ))}

      {rejecting && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-brand-surface border border-white/10 rounded-2xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">{t('pl.review.reject_title', { n: String(rejecting.length) })}</h3>
            <label className="block">
              <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.review.note')}</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={t('pl.review.note_ph')} className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-brand-red focus:outline-hidden" />
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejecting(null)} className="btn-ghost text-sm">{t('pl.review.cancel')}</button>
              <button disabled={busy} onClick={() => run(rejecting, false, note.trim() || undefined)} className="btn-primary py-2! px-4! text-sm disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t('pl.review.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
