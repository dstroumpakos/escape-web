'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Stamp, Minus, Plus, Loader2, RotateCcw, Trophy, Lock } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth, useCompanyMutation, useCompanyQuery } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';

/**
 * End of game: the company picks the room, players and result, and shows the
 * QR. Each player scans it with their own phone and gets the room's stamp in
 * their UNLOCKED passport (convex/passport.ts).
 */
export default function CompanyPassportPage() {
  const { t } = useTranslation();
  const { company } = useCompanyAuth();
  const rooms = useCompanyQuery(api.companies.getRooms, company ? { companyId: company.id as any } : 'skip');
  const recent = useCompanyQuery(api.passport.recentSessions, company ? {} : 'skip');
  const start = useCompanyMutation(api.passport.startSession);

  const bookable = useMemo(() => (rooms || []).filter((r: any) => !r.photosOnly && r.isActive !== false), [rooms]);
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState(4);
  const [escaped, setEscaped] = useState(true);
  const [minutes, setMinutes] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId && bookable.length) setRoomId(bookable[0]._id);
  }, [bookable, roomId]);

  const go = async () => {
    setError('');
    if (!roomId) return;
    setBusy(true);
    try {
      const m = minutes.trim() ? Number(minutes.replace(',', '.')) : undefined;
      const r = await start({ roomId: roomId as any, players, escaped, escapeMinutes: escaped ? m : undefined });
      setSessionId(r.sessionId);
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (sessionId) return <LiveQr sessionId={sessionId} onNew={() => setSessionId(null)} />;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <Stamp className="w-7 h-7 text-brand-red-light" /> {t('cx.pp.title')}
      </h1>
      <p className="text-brand-text-secondary mt-1 text-sm mb-6">{t('cx.pp.subtitle')}</p>

      <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 space-y-5">
        <label className="block">
          <span className="block text-sm text-brand-text-secondary mb-1.5">{t('cx.pp.room')}</span>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-3 text-white focus:border-brand-red focus:outline-hidden">
            {bookable.map((r: any) => <option key={r._id} value={r._id}>{r.title}</option>)}
          </select>
        </label>

        <div>
          <span className="block text-sm text-brand-text-secondary mb-1.5">{t('cx.pp.players')}</span>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setPlayers((p) => Math.max(1, p - 1))} className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5" aria-label="-"><Minus className="w-4 h-4" /></button>
            <span className="text-3xl font-bold tabular-nums w-10 text-center">{players}</span>
            <button type="button" onClick={() => setPlayers((p) => Math.min(20, p + 1))} className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5" aria-label="+"><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        <div>
          <span className="block text-sm text-brand-text-secondary mb-1.5">{t('cx.pp.result')}</span>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setEscaped(true)} className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${escaped ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'border-white/10 text-brand-text-secondary'}`}>
              <Trophy className="w-4 h-4" /> {t('cx.pp.escaped')}
            </button>
            <button type="button" onClick={() => setEscaped(false)} className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${!escaped ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'border-white/10 text-brand-text-secondary'}`}>
              <Lock className="w-4 h-4" /> {t('cx.pp.trapped')}
            </button>
          </div>
        </div>

        {escaped && (
          <label className="block">
            <span className="block text-sm text-brand-text-secondary mb-1.5">{t('cx.pp.time')}</span>
            <input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" placeholder="52" className="w-32 bg-brand-bg border border-white/10 rounded-xl px-3 py-3 text-white focus:border-brand-red focus:outline-hidden" />
          </label>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={go} disabled={busy || !roomId} className="btn-primary w-full py-3.5! text-base flex items-center justify-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stamp className="w-5 h-5" />} {t('cx.pp.show_qr')}
        </button>
        <p className="text-xs text-brand-text-secondary">{t('cx.pp.rules')}</p>
      </div>

      {recent && recent.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-brand-text-secondary mb-2">{t('cx.pp.recent')}</h2>
          <div className="bg-brand-surface rounded-2xl border border-white/5 divide-y divide-white/5">
            {recent.map((s) => (
              <button key={s._id} onClick={() => setSessionId(s._id)} className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 text-left">
                <span className="truncate">{s.roomTitle} · {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="tabular-nums text-brand-text-secondary">{s.claimed}/{s.players}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveQr({ sessionId, onNew }: { sessionId: string; onNew: () => void }) {
  const { t } = useTranslation();
  const s = useCompanyQuery(api.passport.sessionStatus, { sessionId: sessionId as any });
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const link = s?.token && typeof window !== 'undefined' ? `${window.location.origin}/stamp/${s.token}` : '';
  useEffect(() => {
    if (!link) return;
    let alive = true;
    QRCode.toDataURL(link, { margin: 2, width: 420 }).then((d) => alive && setQr(d));
    return () => {
      alive = false;
    };
  }, [link]);

  if (!s) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  const left = s.expiresAt - now;
  const expired = left <= 0;
  const full = s.claimed >= s.players;
  const mm = String(Math.max(0, Math.floor(left / 60000))).padStart(2, '0');
  const ss = String(Math.max(0, Math.floor((left % 60000) / 1000))).padStart(2, '0');

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
      <p className="text-sm text-brand-text-secondary">{t('cx.pp.scan_now')}</p>
      <h1 className="text-2xl font-bold mt-1 mb-5">{s.roomTitle}</h1>
      <div className="inline-block rounded-2xl bg-white p-3">
        {qr && !expired && !full ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR" width={320} height={320} />
        ) : (
          <div className="w-80 h-80 flex items-center justify-center text-black font-semibold px-6">
            {full ? t('cx.pp.all_done') : t('cx.pp.expired')}
          </div>
        )}
      </div>
      <div className="mt-5 text-4xl font-bold tabular-nums">
        <span className="text-brand-red-light">{s.claimed}</span>
        <span className="text-brand-text-secondary">/{s.players}</span>
      </div>
      <p className="text-sm text-brand-text-secondary">{t('cx.pp.stamped')}</p>
      {!expired && !full && <p className="text-xs text-brand-text-secondary mt-2 tabular-nums">{t('cx.pp.valid_for', { time: `${mm}:${ss}` })}</p>}
      <button onClick={onNew} className="btn-ghost mt-6 inline-flex items-center gap-2 text-sm">
        <RotateCcw className="w-4 h-4" /> {t('cx.pp.new_game')}
      </button>
    </div>
  );
}
