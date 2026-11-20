'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery } from 'convex/react';
import { X, Search, Loader2, Plus, MapPin, Trophy, Lock, Camera, Receipt, Check, ChevronLeft } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { todayKey, uploadFile } from './levels';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-black/40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>,
});

type Picked =
  | { kind: 'room' | 'community'; id: string; title: string; company: string; city: string }
  | { kind: 'new'; title: string; company: string; city: string };

const input = 'w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-brand-red focus:outline-hidden';

/** Add a room I played: find it (or add a new one), the result, teammates, then a proof. */
export function AddPlayDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const token = user?.sessionToken ?? '';
  const [step, setStep] = useState<'find' | 'new' | 'details' | 'proof'>('find');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);
  const results = useQuery(api.plays.searchPlaces, debounced.length >= 2 ? { q: debounced, sessionToken: token } : 'skip');
  const friends = useQuery(api.friends.listFriends, token ? { sessionToken: token } : 'skip');

  const [picked, setPicked] = useState<Picked | null>(null);
  // New room
  const [nr, setNr] = useState({ name: '', companyName: '', city: '', country: '', website: '', address: '', lat: undefined as number | undefined, lng: undefined as number | undefined });
  const [showMap, setShowMap] = useState(false);
  // Details
  const [playedOn, setPlayedOn] = useState(todayKey());
  const [escaped, setEscaped] = useState(true);
  const [minutes, setMinutes] = useState('');
  const [hints, setHints] = useState('');
  const [team, setTeam] = useState<string[]>([]);
  const [logId, setLogId] = useState<string | null>(null);

  const addPlay = useMutation(api.plays.addPlay);
  const attachProof = useMutation(api.plays.attachProof);
  const genUrl = useMutation(api.users.generateUploadUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async () => {
    if (!picked) return;
    setError('');
    setBusy(true);
    try {
      const m = escaped && minutes.trim() ? Number(minutes.replace(',', '.')) : undefined;
      const h = hints.trim() ? Number(hints) : undefined;
      const base = { sessionToken: token, playedOn, escaped, escapeMinutes: m, hintsUsed: h, teammateIds: team as any };
      const r =
        picked.kind === 'room'
          ? await addPlay({ ...base, roomId: picked.id as any })
          : picked.kind === 'community'
            ? await addPlay({ ...base, communityRoomId: picked.id as any })
            : await addPlay({
                ...base,
                community: {
                  name: nr.name,
                  companyName: nr.companyName,
                  city: nr.city,
                  country: nr.country,
                  website: nr.website || undefined,
                  latitude: nr.lat,
                  longitude: nr.lng,
                },
              });
      setLogId(r.logId);
      setStep('proof');
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setBusy(false);
    }
  };

  const sendProof = async (file: File, kind: 'photo' | 'receipt') => {
    if (!logId) return;
    setError('');
    setBusy(true);
    try {
      const storageId = await uploadFile(() => genUrl({ sessionToken: token }), file);
      await attachProof({ sessionToken: token, logId: logId as any, storageId: storageId as any, kind });
      onClose();
    } catch (e) {
      setError(friendlyError(e, t));
    } finally {
      setBusy(false);
    }
  };

  const newOk = nr.name.trim().length >= 2 && nr.city.trim().length >= 2 && nr.country.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('pl.add.title')}
        className="bg-brand-surface border border-white/10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {(step === 'new' || step === 'details') && (
              <button onClick={() => setStep('find')} className="p-1 -ml-1 text-brand-text-secondary hover:text-white" aria-label={t('pl.back')}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold">{step === 'proof' ? t('pl.proof.title') : t('pl.add.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-brand-text-secondary hover:text-white" aria-label={t('pl.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'find' && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('pl.add.search')} className={`${input} pl-9`} />
            </div>
            <div className="mt-3 space-y-1.5 min-h-[120px]">
              {debounced.length >= 2 && results === undefined && <Loader2 className="w-5 h-5 animate-spin mx-auto mt-6 text-brand-text-secondary" />}
              {results?.map((r) => (
                <button
                  key={`${r.kind}${r.id}`}
                  onClick={() => {
                    setPicked({ kind: r.kind, id: r.id, title: r.title, company: r.company, city: r.city });
                    setStep('details');
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 bg-black/30 hover:bg-white/5 text-left"
                >
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-brand-text-muted" /></div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{r.title}</p>
                    <p className="text-xs text-brand-text-secondary truncate">{[r.company, r.city].filter(Boolean).join(' · ')}</p>
                  </div>
                  {r.kind === 'community' && <span className="ml-auto text-[10px] uppercase tracking-wide text-brand-text-muted shrink-0">{t('pl.add.community')}</span>}
                </button>
              ))}
              {results && results.length === 0 && <p className="text-sm text-brand-text-secondary text-center pt-4">{t('pl.add.none')}</p>}
            </div>
            <button
              onClick={() => {
                setNr((s) => ({ ...s, name: s.name || q.trim() }));
                setStep('new');
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm text-brand-text-secondary hover:text-white hover:border-white/40"
            >
              <Plus className="w-4 h-4" /> {t('pl.add.not_found')}
            </button>
          </>
        )}

        {step === 'new' && (
          <div className="space-y-3">
            <p className="text-sm text-brand-text-secondary">{t('pl.new.hint')}</p>
            <label className="block">
              <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.new.name')} *</span>
              <input value={nr.name} onChange={(e) => setNr({ ...nr, name: e.target.value })} maxLength={80} className={input} />
            </label>
            <label className="block">
              <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.new.company')}</span>
              <input value={nr.companyName} onChange={(e) => setNr({ ...nr, companyName: e.target.value })} maxLength={80} className={input} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.new.city')} *</span>
                <input value={nr.city} onChange={(e) => setNr({ ...nr, city: e.target.value })} maxLength={60} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.new.country')} *</span>
                <input value={nr.country} onChange={(e) => setNr({ ...nr, country: e.target.value })} maxLength={60} className={input} />
              </label>
            </div>
            <label className="block">
              <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.new.website')}</span>
              <input value={nr.website} onChange={(e) => setNr({ ...nr, website: e.target.value })} inputMode="url" placeholder="https://" maxLength={300} className={input} />
            </label>
            {showMap ? (
              <LocationPicker
                location={nr.address}
                latitude={nr.lat}
                longitude={nr.lng}
                onLocationChange={(address, lat, lng) => setNr((s) => ({ ...s, address, lat, lng }))}
                placeholder={t('pl.new.address')}
                searchLabel={t('pl.new.find')}
                pinHint={t('pl.new.pin_hint')}
              />
            ) : (
              <button onClick={() => setShowMap(true)} className="text-sm text-brand-red-light hover:underline flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {t('pl.new.add_pin')}
              </button>
            )}
            <button
              disabled={!newOk}
              onClick={() => {
                setPicked({ kind: 'new', title: nr.name.trim(), company: nr.companyName.trim(), city: nr.city.trim() });
                setStep('details');
              }}
              className="btn-primary w-full py-3! disabled:opacity-50"
            >
              {t('pl.next')}
            </button>
          </div>
        )}

        {step === 'details' && picked && (
          <div className="space-y-4">
            <div className="rounded-xl bg-black/30 px-3 py-2.5">
              <p className="font-semibold">{picked.title}</p>
              <p className="text-xs text-brand-text-secondary">{[picked.company, picked.city].filter(Boolean).join(' · ')}</p>
            </div>
            <label className="block">
              <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.details.date')}</span>
              <input type="date" value={playedOn} max={todayKey()} onChange={(e) => setPlayedOn(e.target.value)} className={`${input} scheme-dark w-48`} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEscaped(true)} className={`py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${escaped ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'border-white/10 text-brand-text-secondary'}`}>
                <Trophy className="w-4 h-4" /> {t('pl.details.escaped')}
              </button>
              <button type="button" onClick={() => setEscaped(false)} className={`py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${!escaped ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'border-white/10 text-brand-text-secondary'}`}>
                <Lock className="w-4 h-4" /> {t('pl.details.trapped')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {escaped && (
                <label className="block">
                  <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.details.minutes')}</span>
                  <input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" placeholder="52" className={input} />
                </label>
              )}
              <label className="block">
                <span className="block text-sm text-brand-text-secondary mb-1">{t('pl.details.hints')}</span>
                <input value={hints} onChange={(e) => setHints(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="0" className={input} />
              </label>
            </div>
            {friends && friends.length > 0 && (
              <div>
                <span className="block text-sm text-brand-text-secondary mb-1.5">{t('pl.details.team')}</span>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                  {friends.map((f: any) => {
                    const on = team.includes(f._id);
                    return (
                      <button
                        key={f._id}
                        type="button"
                        onClick={() => setTeam((s) => (on ? s.filter((x) => x !== f._id) : [...s, f._id]))}
                        className={`flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-sm border ${on ? 'bg-brand-red/15 border-brand-red/50 text-white' : 'border-white/10 text-brand-text-secondary'}`}
                      >
                        {f.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">{f.name.charAt(0)}</span>
                        )}
                        {f.name}
                        {on && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-brand-text-muted mt-1.5">{t('pl.details.team_hint')}</p>
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={save} disabled={busy || !playedOn} className="btn-primary w-full py-3! flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} {t('pl.details.save')}
            </button>
          </div>
        )}

        {step === 'proof' && (
          <ProofPicker busy={busy} error={error} onPick={sendProof} onSkip={onClose} intro={t('pl.proof.intro')} />
        )}
      </div>
    </div>
  );
}

/** Photo at the room or a receipt screenshot. Also used from the plays list. */
export function ProofPicker({
  busy,
  error,
  onPick,
  onSkip,
  intro,
}: {
  busy: boolean;
  error: string;
  onPick: (file: File, kind: 'photo' | 'receipt') => void;
  onSkip?: () => void;
  intro: string;
}) {
  const { t } = useTranslation();
  const pick = (kind: 'photo' | 'receipt') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onPick(f, kind);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-text-secondary">{intro}</p>
      <label className={`flex items-center gap-3 rounded-xl border border-white/10 p-3 cursor-pointer hover:bg-white/5 ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
        <Camera className="w-6 h-6 text-brand-gold shrink-0" />
        <span>
          <span className="block font-semibold">{t('pl.proof.photo')}</span>
          <span className="block text-xs text-brand-text-secondary">{t('pl.proof.photo_hint')}</span>
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={pick('photo')} />
      </label>
      <label className={`flex items-center gap-3 rounded-xl border border-white/10 p-3 cursor-pointer hover:bg-white/5 ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
        <Receipt className="w-6 h-6 text-brand-gold shrink-0" />
        <span>
          <span className="block font-semibold">{t('pl.proof.receipt')}</span>
          <span className="block text-xs text-brand-text-secondary">{t('pl.proof.receipt_hint')}</span>
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={pick('receipt')} />
      </label>
      {busy && <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-text-secondary" />}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {onSkip && (
        <button onClick={onSkip} className="btn-ghost w-full text-sm">{t('pl.proof.later')}</button>
      )}
    </div>
  );
}
