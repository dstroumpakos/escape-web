'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery } from 'convex/react';
import { Building2, Plus, Pencil, Trash2, Loader2, Upload, Link2, DoorOpen, EyeOff } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { themeLabel } from '@/lib/roomThemes';
import { CategoryPicker } from '@/components/company/CategoryPicker';
import type { Category } from '../../../convex/roomCategories';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false });

type Data = NonNullable<ReturnType<typeof useManaged>>;
type Managed = Data['managed'][number];
type Room = Managed['rooms'][number];

function useManaged(sessionToken: string) {
  return useQuery(api.managedCompanies.adminList, { sessionToken });
}

/** "https://www.example.com/book" -> "example.com/book", for the room list. */
function hostOf(url: string) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/$/, '');
  } catch {
    return url;
  }
}

const input = 'w-full bg-brand-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-brand-text-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}

/**
 * Companies the UNLOCKED team promotes before they have an account
 * (convex/managedCompanies.ts): add them and their rooms, then assign them to
 * the company's own account once it signs up.
 */
export function AdminManagedCompanies({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const data = useManaged(sessionToken);
  const [editing, setEditing] = useState<Managed | 'new' | null>(null);

  if (!data) return <Loader2 className="w-6 h-6 animate-spin text-brand-red mx-auto my-10" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm text-brand-text-secondary max-w-3xl">{t('mc.intro')}</p>
        <button onClick={() => setEditing('new')} className="btn-primary py-2! px-4! text-sm flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> {t('mc.add_company')}
        </button>
      </div>

      {editing === 'new' && <CompanyForm sessionToken={sessionToken} onDone={() => setEditing(null)} />}

      {data.managed.length === 0 && editing !== 'new' ? (
        <p className="text-center text-brand-text-secondary py-12">{t('mc.none')}</p>
      ) : (
        data.managed.map((c) =>
          editing !== 'new' && editing?._id === c._id ? (
            <CompanyForm key={c._id} sessionToken={sessionToken} company={c} onDone={() => setEditing(null)} />
          ) : (
            <CompanyCard key={c._id} c={c} accounts={data.accounts} sessionToken={sessionToken} onEdit={() => setEditing(c)} />
          )
        )
      )}
    </div>
  );
}

function useUpload(sessionToken: string) {
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const getUrl = useMutation(api.companies.getUrlMutation);
  return async (file: File) => {
    const uploadUrl = await generateUploadUrl({ adminToken: sessionToken });
    const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const { storageId } = await res.json();
    const url = await getUrl({ storageId, adminToken: sessionToken });
    if (!url) throw new Error('Upload failed');
    return url;
  };
}

function ImageField({ label, value, onChange, sessionToken }: { label: string; value: string; onChange: (url: string) => void; sessionToken: string }) {
  const { t } = useTranslation();
  const upload = useUpload(sessionToken);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-black/40 border border-white/10" />
        )}
        <span className="btn-ghost text-sm flex items-center gap-2 cursor-pointer relative">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {t('mc.upload')}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setBusy(true);
              setErr('');
              try {
                onChange(await upload(file));
              } catch (x) {
                setErr(friendlyError(x, t));
              } finally {
                setBusy(false);
              }
            }}
          />
        </span>
      </div>
      {err && <p className="text-xs text-red-300 mt-1">{err}</p>}
    </Field>
  );
}

function CompanyForm({ sessionToken, company, onDone }: { sessionToken: string; company?: Managed; onDone: () => void }) {
  const { t } = useTranslation();
  const save = useMutation(api.managedCompanies.adminSaveCompany);
  const [f, setF] = useState({
    name: company?.name ?? '',
    city: company?.city ?? '',
    address: company?.address ?? '',
    phone: company?.phone ?? '',
    website: company?.website ?? '',
    instagram: company?.instagram ? `@${company.instagram}` : '',
    description: company?.description ?? '',
    logo: company?.logo ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await save({ sessionToken, companyId: company?._id, ...f });
      onDone();
    } catch (x) {
      setErr(friendlyError(x, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-brand-surface rounded-2xl border border-brand-red/30 p-5 space-y-4">
      <h3 className="font-bold">{company ? t('mc.edit_company') : t('mc.new_company')}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('mc.name')}><input className={input} value={f.name} onChange={set('name')} required maxLength={120} /></Field>
        <Field label={t('mc.city')}><input className={input} value={f.city} onChange={set('city')} maxLength={80} /></Field>
        <Field label={t('mc.address')}><input className={input} value={f.address} onChange={set('address')} maxLength={200} /></Field>
        <Field label={t('mc.phone')}><input className={input} value={f.phone} onChange={set('phone')} maxLength={40} /></Field>
        <Field label={t('mc.website')}><input className={input} value={f.website} onChange={set('website')} placeholder="https://" maxLength={300} /></Field>
        <Field label={t('mc.instagram')}><input className={input} value={f.instagram} onChange={set('instagram')} placeholder="@escaperoom" maxLength={100} /></Field>
        <ImageField label={t('mc.logo')} value={f.logo} onChange={(logo) => setF((p) => ({ ...p, logo }))} sessionToken={sessionToken} />
      </div>
      <Field label={t('mc.description')}><textarea className={input} rows={3} value={f.description} onChange={set('description')} maxLength={3000} /></Field>
      {err && <p className="text-sm text-red-300">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary py-2! px-4! text-sm flex items-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('mc.save')}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost text-sm">{t('mc.cancel')}</button>
      </div>
    </form>
  );
}

function CompanyCard({ c, accounts, sessionToken, onEdit }: { c: Managed; accounts: Data['accounts']; sessionToken: string; onEdit: () => void }) {
  const { t } = useTranslation();
  const del = useMutation(api.managedCompanies.adminDeleteCompany);
  const delRoom = useMutation(api.managedCompanies.adminDeleteRoom);
  const [room, setRoom] = useState<Room | 'new' | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [msg, setMsg] = useState('');

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {c.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logo} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center"><Building2 className="w-5 h-5 text-brand-text-secondary" /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold">{c.name}</p>
          <p className="text-xs text-brand-text-secondary">{[c.city, c.website].filter(Boolean).join(' · ')}</p>
          {c.instagram && (
            <p className={`text-xs ${c.instagramError ? 'text-amber-300/80' : 'text-brand-text-muted'}`}>
              Instagram @{c.instagram} ·{' '}
              {c.instagramError ? t(c.instagramError === 'not_found' ? 'mc.ig_err_not_found' : 'mc.ig_err_fetch_failed') :c.instagramSyncedAt ? t('mc.ig_synced') : t('mc.ig_syncing')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAssigning(!assigning)} className="btn-primary py-1.5! px-3! text-xs flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> {t('mc.assign')}
          </button>
          <button onClick={onEdit} className="btn-ghost text-xs flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> {t('mc.edit')}</button>
          <button
            onClick={async () => {
              if (!confirm(t('mc.delete_company_confirm', { name: c.name, n: String(c.rooms.length) }))) return;
              try { await del({ sessionToken, companyId: c._id }); } catch (x) { setMsg(friendlyError(x, t)); }
            }}
            className="text-xs text-brand-text-muted hover:text-red-300 flex items-center gap-1.5 px-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('mc.delete')}
          </button>
        </div>
      </div>

      {assigning && <AssignBox c={c} accounts={accounts} sessionToken={sessionToken} onDone={(m) => { setAssigning(false); setMsg(m); }} />}
      {msg && <p className="text-sm text-emerald-300">{msg}</p>}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-brand-text-secondary">{t('mc.rooms')} ({c.rooms.length})</h4>
          <button onClick={() => setRoom('new')} className="text-xs flex items-center gap-1.5 text-brand-red-light hover:text-white">
            <Plus className="w-3.5 h-3.5" /> {t('mc.add_room')}
          </button>
        </div>
        {room === 'new' && <RoomForm sessionToken={sessionToken} companyId={c._id} onDone={() => setRoom(null)} />}
        <ul className="space-y-2">
          {c.rooms.map((r) =>
            room !== 'new' && room?._id === r._id ? (
              <li key={r._id}><RoomForm sessionToken={sessionToken} companyId={c._id} room={r} onDone={() => setRoom(null)} /></li>
            ) : (
              <li key={r._id} className="flex items-center gap-3 rounded-xl bg-black/30 p-2">
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" className="w-14 h-10 rounded object-cover" />
                ) : (
                  <div className="w-14 h-10 rounded bg-black/40 flex items-center justify-center"><DoorOpen className="w-4 h-4" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate flex items-center gap-2">
                    {r.title} {!r.isActive && <EyeOff className="w-3.5 h-3.5 text-brand-text-muted" aria-label={t('mc.hidden')} />}
                  </p>
                  <p className="text-xs text-brand-text-secondary truncate">{[t(`cat.${r.category}`), ...r.subthemes.map((s) => themeLabel(t, s)), r.location].filter(Boolean).join(' · ')}</p>
                  <p className={`text-xs truncate ${r.bookingUrl ? 'text-brand-text-muted' : 'text-amber-300/80'}`}>
                    {t('mc.book_goes')} {r.bookingUrl ? hostOf(r.bookingUrl) : c.website ? t('mc.book_company_site') : t('mc.book_nowhere')}
                  </p>
                  <p className={`text-xs ${r.escapeAll ? 'text-brand-text-muted' : 'text-amber-300/80'}`}>
                    {r.escapeAll ? t('mc.ea_rating', { rating: r.escapeAll.rating.toFixed(1), n: String(r.escapeAll.count), date: new Date(r.escapeAll.updatedAt).toLocaleDateString('el-GR') }) : t('mc.ea_none')}
                  </p>
                </div>
                <button onClick={() => setRoom(r)} className="p-2 text-brand-text-secondary hover:text-white" aria-label={t('mc.edit')}><Pencil className="w-4 h-4" /></button>
                <button
                  onClick={async () => {
                    if (!confirm(t('mc.delete_room_confirm', { name: r.title }))) return;
                    try { await delRoom({ sessionToken, roomId: r._id }); } catch (x) { setMsg(friendlyError(x, t)); }
                  }}
                  className="p-2 text-brand-text-muted hover:text-red-300"
                  aria-label={t('mc.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

function AssignBox({ c, accounts, sessionToken, onDone }: { c: Managed; accounts: Data['accounts']; sessionToken: string; onDone: (msg: string) => void }) {
  const { t } = useTranslation();
  const assign = useMutation(api.managedCompanies.adminAssign);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const chosen = accounts.find((a) => a._id === target);

  const go = async () => {
    if (!chosen) return;
    if (!confirm(t('mc.assign_confirm', { name: c.name, n: String(c.rooms.length), target: chosen.name, email: chosen.email }))) return;
    setBusy(true);
    setErr('');
    try {
      const r = await assign({ sessionToken, managedId: c._id, targetId: chosen._id });
      onDone(t(r.approved ? 'mc.assign_done' : 'mc.assign_not_approved', { n: String(r.rooms) }));
    } catch (x) {
      setErr(friendlyError(x, t));
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-red/30 bg-black/30 p-4 space-y-3">
      <p className="text-xs text-brand-text-secondary">{t('mc.assign_hint')}</p>
      <div className="flex flex-wrap gap-2">
        <select className={`${input} flex-1 min-w-60`} value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">{t('mc.assign_pick')}</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} · {a.email}{a.city ? ` · ${a.city}` : ''}{a.onboardingStatus !== 'approved' ? ` (${t('mc.status_pending')})` : ''}
            </option>
          ))}
        </select>
        <button onClick={go} disabled={!chosen || busy} className="btn-primary py-2! px-4! text-sm flex items-center gap-2 disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('mc.assign')}
        </button>
      </div>
      {err && <p className="text-sm text-red-300">{err}</p>}
    </div>
  );
}

function RoomForm({ sessionToken, companyId, room, onDone }: { sessionToken: string; companyId: Id<'companies'>; room?: Room; onDone: () => void }) {
  const { t } = useTranslation();
  const save = useMutation(api.managedCompanies.adminSaveRoom);
  const setEscapeAll = useMutation(api.escapeAll.adminSetRoomRating);
  // After the first save of a new room, a retry (e.g. a wrong EscapeAll number) edits it instead of adding another
  const [savedId, setSavedId] = useState<Id<'rooms'> | undefined>(room?._id);
  const [ea, setEa] = useState({
    rating: room?.escapeAll ? String(room.escapeAll.rating) : '',
    count: room?.escapeAll ? String(room.escapeAll.count) : '',
  });
  const eaChanged =
    ea.rating !== (room?.escapeAll ? String(room.escapeAll.rating) : '') ||
    ea.count !== (room?.escapeAll ? String(room.escapeAll.count) : '');
  const [f, setF] = useState({
    title: room?.title ?? '',
    location: room?.location ?? '',
    latitude: room?.latitude ?? undefined,
    longitude: room?.longitude ?? undefined,
    image: room?.image ?? '',
    category: (room?.category ?? 'puzzle') as Category,
    subthemes: room?.subthemes ?? ([] as string[]),
    description: room?.description ?? '',
    duration: room?.duration ?? 60,
    difficulty: room?.difficulty ?? 3,
    playersMin: room?.playersMin ?? 2,
    playersMax: room?.playersMax ?? 6,
    bookingUrl: room?.bookingUrl ?? '',
    isActive: room?.isActive ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const num = (k: 'duration' | 'difficulty' | 'playersMin' | 'playersMax') => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (f.subthemes.length === 0) {
        setErr(t('cat.subs_required'));
        setBusy(false);
        return;
      }
      const { latitude, longitude, ...rest } = f;
      const id = await save({
        sessionToken,
        companyId,
        roomId: savedId,
        ...rest,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });
      setSavedId(id);
      if (eaChanged) {
        try {
          const n = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));
          await setEscapeAll({ sessionToken, roomId: id, rating: n(ea.rating), count: n(ea.count) });
        } catch (x) {
          setErr(`${t('mc.ea_failed')} ${friendlyError(x, t)}`);
          return;
        }
      }
      onDone();
    } catch (x) {
      setErr(friendlyError(x, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-brand-red/30 bg-black/30 p-4 space-y-4 mb-3">
      <h4 className="font-semibold text-sm">{room ? t('mc.edit_room') : t('mc.new_room')}</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('mc.room_title')}><input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={120} /></Field>
        <ImageField label={t('mc.photo')} value={f.image} onChange={(image) => setF((p) => ({ ...p, image }))} sessionToken={sessionToken} />
        <Field label={t('mc.duration')}><input type="number" className={input} value={f.duration} onChange={num('duration')} min={10} max={600} /></Field>
        <Field label={t('mc.difficulty')}><input type="number" className={input} value={f.difficulty} onChange={num('difficulty')} min={1} max={5} /></Field>
        <Field label={t('mc.players_min')}><input type="number" className={input} value={f.playersMin} onChange={num('playersMin')} min={1} max={50} /></Field>
        <Field label={t('mc.players_max')}><input type="number" className={input} value={f.playersMax} onChange={num('playersMax')} min={1} max={50} /></Field>
        <Field label={t('mc.booking_url')}><input className={input} value={f.bookingUrl} onChange={(e) => setF({ ...f, bookingUrl: e.target.value })} placeholder="https://" maxLength={500} /></Field>
        <label className="flex items-center gap-2 text-sm self-end pb-2">
          <input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> {t('mc.active')}
        </label>
      </div>
      <div className="grid grid-cols-2 sm:w-1/2 gap-4">
        <Field label={t('mc.ea_score')}><input type="number" step="0.1" min={0} max={5} className={input} value={ea.rating} onChange={(e) => setEa({ ...ea, rating: e.target.value })} placeholder="4.8" /></Field>
        <Field label={t('mc.ea_count')}><input type="number" step="1" min={0} className={input} value={ea.count} onChange={(e) => setEa({ ...ea, count: e.target.value })} placeholder="350" /></Field>
      </div>
      <CategoryPicker category={f.category} subthemes={f.subthemes} onChange={(category, subthemes) => setF((p) => ({ ...p, category, subthemes }))} />
      <div>
        <span className="block text-xs text-brand-text-secondary mb-1">{t('mc.location')}</span>
        <LocationPicker
          location={f.location}
          latitude={f.latitude}
          longitude={f.longitude}
          onLocationChange={(location, latitude, longitude) => setF((p) => ({ ...p, location, latitude, longitude }))}
        />
      </div>
      <Field label={t('mc.description')}><textarea className={input} rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={5000} /></Field>
      {err && <p className="text-sm text-red-300">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary py-2! px-4! text-sm flex items-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('mc.save')}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost text-sm">{t('mc.cancel')}</button>
      </div>
    </form>
  );
}
