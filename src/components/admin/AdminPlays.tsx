'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ListChecks, MapPinned, Check, X, GitMerge, Copy, ExternalLink, Pencil, Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { ReviewList } from '@/components/plays/ReviewList';

type CStatus = 'pending' | 'approved' | 'rejected' | 'merged';

/**
 * Rooms Played for the UNLOCKED team: plays nobody else can review (community
 * rooms, companies not live, a company silent for a week) and the community
 * rooms, which are sales leads (convex/plays.ts).
 */
export function AdminPlays({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const [view, setView] = useState<'queue' | 'rooms'>('queue');
  const queue = useQuery(api.plays.adminQueue, view === 'queue' ? { sessionToken } : 'skip');
  const review = useMutation(api.plays.adminReview);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(['queue', 'rooms'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${view === v ? 'bg-brand-red text-white' : 'bg-brand-surface border border-white/5 text-brand-text-secondary hover:text-white'}`}
          >
            {v === 'queue' ? <ListChecks className="w-4 h-4" /> : <MapPinned className="w-4 h-4" />}
            {t(`admin.pl.view_${v}`)}
          </button>
        ))}
      </div>
      {view === 'queue' ? (
        <>
          <p className="text-xs text-brand-text-secondary">{t('admin.pl.queue_hint')}</p>
          <ReviewList rows={queue as any} showCompany onReview={(ids, approve, note) => review({ sessionToken, logIds: ids as any, approve, note })} />
        </>
      ) : (
        <CommunityRooms sessionToken={sessionToken} />
      )}
    </div>
  );
}

function CommunityRooms({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<CStatus>('pending');
  const rows = useQuery(api.plays.adminCommunityRooms, { sessionToken, status });
  const setRoom = useMutation(api.plays.adminSetCommunityRoom);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [merging, setMerging] = useState<any>(null);
  const [copied, setCopied] = useState('');

  const act = async (fn: () => Promise<unknown>) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e, t));
    }
  };

  const pitch = (r: any) =>
    t('admin.pl.pitch', {
      company: r.companyName || r.name,
      n: String(r.players),
      room: r.name,
      link: `${window.location.origin}/played/${r._id}`,
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(['pending', 'approved', 'merged', 'rejected'] as CStatus[]).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${status === s ? 'bg-white/15 text-white' : 'bg-white/5 text-brand-text-secondary hover:text-white'}`}>
            {t(`admin.pl.status_${s}`)}
          </button>
        ))}
      </div>
      <p className="text-xs text-brand-text-secondary">{t('admin.pl.rooms_hint')}</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!rows ? (
        <Loader2 className="w-6 h-6 animate-spin mx-auto my-10 text-brand-text-secondary" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-brand-text-secondary text-center py-10">{t('pl.review.empty')}</p>
      ) : (
        <div className="bg-brand-surface rounded-2xl border border-white/5 divide-y divide-white/5">
          {rows.map((r) => (
            <div key={r._id} className="p-4 flex flex-wrap items-start gap-3">
              <div className="w-12 text-center shrink-0">
                <div className="text-xl font-bold tabular-nums">{r.players}</div>
                <div className="text-[10px] text-brand-text-muted">{t('admin.pl.players')}</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-brand-text-secondary">{[r.companyName, r.city, r.country].filter(Boolean).join(' · ')}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {t('admin.pl.added_by', { name: r.createdByName })}
                  {r.latitude !== null ? ' · 📍' : ''}
                </p>
                {r.website && (
                  <a href={r.website} target="_blank" rel="noreferrer" className="text-xs text-brand-red-light hover:underline inline-flex items-center gap-1 mt-0.5">
                    {r.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {status === 'pending' && (
                  <button onClick={() => act(() => setRoom({ sessionToken, id: r._id, status: 'approved' }))} className="rounded-full px-3 py-1.5 bg-emerald-500/15 text-emerald-300 text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {t('admin.pl.approve')}
                  </button>
                )}
                {(status === 'pending' || status === 'approved') && (
                  <>
                    <button onClick={() => setEditing({ ...r, website: r.website ?? '' })} className="rounded-full px-3 py-1.5 bg-white/5 text-xs flex items-center gap-1">
                      <Pencil className="w-3.5 h-3.5" /> {t('admin.pl.edit')}
                    </button>
                    <button onClick={() => setMerging(r)} className="rounded-full px-3 py-1.5 bg-white/5 text-xs flex items-center gap-1">
                      <GitMerge className="w-3.5 h-3.5" /> {t('admin.pl.merge')}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(pitch(r));
                          setCopied(r._id);
                          setTimeout(() => setCopied(''), 2000);
                        } catch {
                          /* clipboard blocked */
                        }
                      }}
                      className="rounded-full px-3 py-1.5 bg-white/5 text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> {copied === r._id ? t('pl.copied') : t('admin.pl.copy_pitch')}
                    </button>
                    <button
                      onClick={() => confirm(t('admin.pl.reject_confirm', { room: r.name })) && act(() => setRoom({ sessionToken, id: r._id, status: 'rejected' }))}
                      className="rounded-full px-3 py-1.5 bg-red-500/10 text-red-300 text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> {t('admin.pl.reject')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <EditRoom sessionToken={sessionToken} room={editing} onClose={() => setEditing(null)} />}
      {merging && <MergeRoom sessionToken={sessionToken} room={merging} onClose={() => setMerging(null)} />}
    </div>
  );
}

const field = 'w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-red focus:outline-hidden';

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-brand-surface border border-white/10 rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function EditRoom({ sessionToken, room, onClose }: { sessionToken: string; room: any; onClose: () => void }) {
  const { t } = useTranslation();
  const save = useMutation(api.plays.adminSetCommunityRoom);
  const [f, setF] = useState({ name: room.name, companyName: room.companyName, city: room.city, country: room.country, website: room.website });
  const [error, setError] = useState('');
  return (
    <Modal title={t('admin.pl.edit_title')} onClose={onClose}>
      {(['name', 'companyName', 'city', 'country', 'website'] as const).map((k) => (
        <label key={k} className="block">
          <span className="block text-xs text-brand-text-secondary mb-1">{t(`admin.pl.f_${k}`)}</span>
          <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={field} />
        </label>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost text-sm">{t('pl.review.cancel')}</button>
        <button
          onClick={async () => {
            try {
              await save({ sessionToken, id: room._id, status: 'approved', ...f });
              onClose();
            } catch (e) {
              setError(friendlyError(e, t));
            }
          }}
          className="btn-primary py-2! px-4! text-sm"
        >
          {t('admin.pl.save_approve')}
        </button>
      </div>
    </Modal>
  );
}

/** Move a community room's plays into a real room, or into a duplicate community room. */
function MergeRoom({ sessionToken, room, onClose }: { sessionToken: string; room: any; onClose: () => void }) {
  const { t } = useTranslation();
  const [q, setQ] = useState(room.name);
  const results = useQuery(api.plays.searchPlaces, q.trim().length >= 2 ? { q: q.trim() } : 'skip');
  const merge = useMutation(api.plays.adminMergeCommunityRoom);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const options = useMemo(() => (results ?? []).filter((r) => r.id !== room._id), [results, room._id]);

  const go = async (r: { kind: string; id: string; title: string }) => {
    if (!confirm(t('admin.pl.merge_confirm', { from: room.name, to: r.title }))) return;
    setBusy(true);
    setError('');
    try {
      await merge({ sessionToken, id: room._id, into: r.kind === 'room' ? { roomId: r.id as any } : { communityRoomId: r.id as any } });
      onClose();
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t('admin.pl.merge_title', { room: room.name })} onClose={onClose}>
      <p className="text-xs text-brand-text-secondary">{t('admin.pl.merge_hint')}</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} className={field} autoFocus />
      <div className="space-y-1.5">
        {options.map((r) => (
          <button key={`${r.kind}${r.id}`} disabled={busy} onClick={() => go(r)} className="w-full text-left rounded-xl px-3 py-2 bg-black/30 hover:bg-white/5 text-sm">
            <span className="font-semibold">{r.title}</span>
            <span className="text-xs text-brand-text-secondary"> · {[r.company, r.city].filter(Boolean).join(' · ')}</span>
            {r.kind === 'community' && <span className="ml-2 text-[10px] uppercase text-brand-text-muted">{t('pl.add.community')}</span>}
          </button>
        ))}
        {results && options.length === 0 && <p className="text-xs text-brand-text-secondary">{t('pl.add.none')}</p>}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end">
        <button onClick={onClose} className="btn-ghost text-sm">{t('pl.review.cancel')}</button>
      </div>
    </Modal>
  );
}
