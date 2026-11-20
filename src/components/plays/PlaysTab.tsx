'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { Plus, Loader2, Trash2, Upload, UserPlus, Mail, Check, X, Link2, Info } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { AddPlayDialog, ProofPicker } from './AddPlayDialog';
import { LevelChip, formatDay, formatEscape, uploadFile, type Level } from './levels';

type PlaysData = NonNullable<ReturnType<typeof useMyPlays>>;

export function useMyPlays() {
  const { user } = useAuth();
  return useQuery(api.plays.mine, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
}

/** Passport tab "Rooms played": rooms added by hand, their trust level, vouch requests. */
export function PlaysTab({ data, stampCount }: { data: PlaysData | undefined; stampCount: number }) {
  const { t, language } = useTranslation();
  const [adding, setAdding] = useState(false);

  if (!data) return <Loader2 className="w-6 h-6 animate-spin text-brand-red mx-auto my-10" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['confirmed', 'verified', 'vouched', 'declared'] as Level[]).map((l) => (
            <LevelChip key={l} level={l} small />
          ))}
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary py-2! px-4! text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('pl.add.button')}
        </button>
      </div>
      <p className="text-xs text-brand-text-secondary flex gap-2">
        <Info className="w-4 h-4 shrink-0 text-brand-gold" /> {t('pl.levels_hint')}
      </p>

      {data.requests.length > 0 && <VouchRequests requests={data.requests} />}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          [stampCount, t('pl.count.confirmed')],
          [data.counted, t('pl.count.verified')],
          [data.plays.filter((p) => !p.counted && p.status !== 'rejected').length, t('pl.count.waiting')],
        ].map(([v, l]) => (
          <div key={String(l)} className="rounded-md bg-black/40 py-2">
            <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{v}</div>
            <div className="text-[11px] text-brand-text-muted">{l}</div>
          </div>
        ))}
      </div>

      {data.plays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border p-6 text-center text-sm text-brand-text-secondary">
          {t('pl.empty')}
        </div>
      ) : (
        <ul className="space-y-2">
          {data.plays.map((p) => (
            <PlayRow key={p._id} p={p} locale={language} />
          ))}
        </ul>
      )}

      {data.inboundEmail && (
        <p className="text-xs text-brand-text-secondary flex gap-2">
          <Mail className="w-4 h-4 shrink-0 text-brand-gold" />
          <span>{t('pl.email_hint', { email: data.inboundEmail })}</span>
        </p>
      )}

      {adding && <AddPlayDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

function PlayRow({ p, locale }: { p: PlaysData['plays'][number]; locale: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const token = user?.sessionToken ?? '';
  const [open, setOpen] = useState<null | 'proof' | 'team'>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const remove = useMutation(api.plays.removePlay);
  const attach = useMutation(api.plays.attachProof);
  const genUrl = useMutation(api.users.generateUploadUrl);

  const sendProof = async (file: File, kind: 'photo' | 'receipt') => {
    setBusy(true);
    setError('');
    try {
      const storageId = await uploadFile(() => genUrl({ sessionToken: token }), file);
      await attach({ sessionToken: token, logId: p._id, storageId: storageId as any, kind });
      setOpen(null);
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!confirm(t('pl.remove_confirm', { room: p.title }))) return;
    try {
      await remove({ sessionToken: token, logId: p._id });
    } catch (e) {
      setError(friendlyError(e, t));
    }
  };

  const copyClaim = async () => {
    if (!p.communityRoomId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/played/${p.communityRoomId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: nothing to do.
    }
  };

  const title = p.roomId ? (
    <Link href={`/rooms/${p.roomId}`} className="font-semibold text-brand-bone hover:underline">{p.title}</Link>
  ) : (
    <span className="font-semibold text-brand-bone">{p.title}</span>
  );

  return (
    <li className="rounded-xl bg-black/40 border border-white/5 p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {title}
            <LevelChip level={p.status as Level} small />
          </div>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            {[p.company, p.city, formatDay(p.playedOn, locale)].filter(Boolean).join(' · ')}
            {' · '}
            {p.escaped ? t('pl.escaped_in', { time: formatEscape(p.escapeSeconds) }) : t('pl.trapped')}
          </p>
          {p.status === 'vouched' && p.vouchedByName && <p className="text-xs text-violet-300 mt-1">{t('pl.vouched_by', { name: p.vouchedByName })}</p>}
          {p.status === 'pending' && <p className="text-xs text-amber-300/90 mt-1">{p.roomId ? t('pl.pending_company') : t('pl.pending_team')}</p>}
          {p.status === 'rejected' && p.reviewNote && <p className="text-xs text-red-300 mt-1">{p.reviewNote}</p>}
          {p.communityStatus === 'pending' && <p className="text-xs text-brand-text-muted mt-1">{t('pl.community_pending')}</p>}
        </div>
        {p.proofUrl && (
          <a href={p.proofUrl} target="_blank" rel="noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.proofUrl} alt={t('pl.proof.alt')} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
          </a>
        )}
      </div>

      {!p.counted && (
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => setOpen(open === 'proof' ? null : 'proof')} className="text-xs rounded-full px-3 py-1.5 bg-white/5 hover:bg-white/10 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> {p.proofUrl || p.hasEmailProof ? t('pl.change_proof') : t('pl.add_proof')}
          </button>
          <button onClick={() => setOpen(open === 'team' ? null : 'team')} className="text-xs rounded-full px-3 py-1.5 bg-white/5 hover:bg-white/10 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> {t('pl.ask_vouch')}
          </button>
          {p.communityRoomId && (
            <button onClick={copyClaim} className="text-xs rounded-full px-3 py-1.5 bg-white/5 hover:bg-white/10 flex items-center gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />} {copied ? t('pl.copied') : t('pl.invite_room')}
            </button>
          )}
          <button onClick={onRemove} className="text-xs rounded-full px-3 py-1.5 text-brand-text-muted hover:text-red-300 flex items-center gap-1.5 ml-auto">
            <Trash2 className="w-3.5 h-3.5" /> {t('pl.remove')}
          </button>
        </div>
      )}
      {open === 'proof' && (
        <div className="mt-3">
          <ProofPicker busy={busy} error={error} onPick={sendProof} intro={t('pl.proof.intro')} />
        </div>
      )}
      {open === 'team' && <AskVouch logId={p._id} onDone={() => setOpen(null)} />}
      {error && open === null && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </li>
  );
}

function AskVouch({ logId, onDone }: { logId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const token = user?.sessionToken ?? '';
  const friends = useQuery(api.friends.listFriends, token ? { sessionToken: token } : 'skip');
  const ask = useMutation(api.plays.askVouch);
  const [team, setTeam] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (!friends) return <Loader2 className="w-4 h-4 animate-spin mt-3" />;
  if (friends.length === 0) return <p className="text-xs text-brand-text-secondary mt-3">{t('pl.no_friends')} <Link href="/friends" className="text-brand-red-light hover:underline">{t('pl.find_friends')}</Link></p>;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-brand-text-secondary">{t('pl.ask_vouch_hint')}</p>
      <div className="flex flex-wrap gap-2">
        {friends.map((f: any) => {
          const on = team.includes(f._id);
          return (
            <button
              key={f._id}
              onClick={() => setTeam((s) => (on ? s.filter((x) => x !== f._id) : [...s, f._id]))}
              className={`rounded-full px-3 py-1 text-xs border ${on ? 'bg-brand-red/15 border-brand-red/50 text-white' : 'border-white/10 text-brand-text-secondary'}`}
            >
              {f.name}
            </button>
          );
        })}
      </div>
      <button
        disabled={busy || team.length === 0}
        onClick={async () => {
          setBusy(true);
          try {
            await ask({ sessionToken: token, logId: logId as any, teammateIds: team as any });
            setMsg(t('pl.asked'));
            setTimeout(onDone, 1200);
          } catch (e) {
            setMsg(friendlyError(e, t));
          } finally {
            setBusy(false);
          }
        }}
        className="btn-primary py-1.5! px-3! text-xs disabled:opacity-50"
      >
        {t('pl.send_request')}
      </button>
      {msg && <p className="text-xs text-brand-text-secondary">{msg}</p>}
    </div>
  );
}

function VouchRequests({ requests }: { requests: PlaysData['requests'] }) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const answer = useMutation(api.plays.answerVouch);
  const [error, setError] = useState('');
  const go = async (logId: string, accept: boolean) => {
    setError('');
    try {
      await answer({ sessionToken: user?.sessionToken ?? '', logId: logId as any, accept });
    } catch (e) {
      setError(friendlyError(e, t));
    }
  };
  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
      <p className="text-sm font-semibold text-violet-200">{t('pl.requests')}</p>
      {requests.map((r) => (
        <div key={r.logId} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex-1 min-w-[200px]">
            {t('pl.request_line', { name: r.ownerName, room: r.title, date: formatDay(r.playedOn, language) })}
          </span>
          <button onClick={() => go(r.logId, true)} className="text-xs rounded-full px-3 py-1.5 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {t('pl.request_yes')}
          </button>
          <button onClick={() => go(r.logId, false)} className="text-xs rounded-full px-3 py-1.5 bg-white/5 text-brand-text-secondary hover:text-white flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> {t('pl.request_no')}
          </button>
        </div>
      ))}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
