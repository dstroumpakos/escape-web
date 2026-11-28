'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Sparkles, Search, CalendarClock, X } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';

const DAY = 24 * 60 * 60 * 1000;
const PRESETS = [7, 14, 30, 90] as const;

/** yyyy-mm-dd in local time */
function toDateInput(ms: number) {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/** End of that local day, so the promo runs through the whole last day */
function endOfDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).getTime();
}

type Row = {
  _id: string;
  title: string;
  image?: string;
  location?: string;
  companyName: string;
  isActive: boolean;
  promoUntil: number | null;
  promoSince: number | null;
  promoNote: string;
  active: boolean;
};

/**
 * Paid room promotion (convex/promo.ts). The company pays the team; here the
 * team turns it on with an end date and the room comes first on the homepage.
 */
export function AdminPromo({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const rows = useQuery(api.promo.adminList, { sessionToken }) as Row[] | undefined;
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const running = (rows ?? []).filter((r) => r.active);
  const others = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? [])
      .filter((r) => !r.active)
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.companyName.toLowerCase().includes(q))
      .slice(0, 30);
  }, [rows, search]);

  if (rows === undefined) return <p className="text-sm text-brand-text-secondary">…</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-brand-text-secondary max-w-3xl">{t('promo.admin.desc')}</p>

      <section>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-red-light" /> {t('promo.admin.running')}
          <span className="text-brand-text-secondary font-normal">({running.length})</span>
        </h3>
        {running.length === 0 && <p className="text-sm text-brand-text-muted">{t('promo.admin.none_running')}</p>}
        <div className="space-y-3">
          {running.map((r) => (
            <PromoRow key={r._id} row={r} sessionToken={sessionToken} open={editing === r._id} onOpen={() => setEditing(editing === r._id ? null : r._id)} onDone={() => setEditing(null)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-3">{t('promo.admin.add')}</h3>
        <div className="relative max-w-md mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('promo.admin.search')}
            className="w-full bg-brand-bg border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-brand-red focus:outline-hidden"
          />
        </div>
        {others.length === 0 && <p className="text-sm text-brand-text-muted">{t('promo.admin.no_rooms')}</p>}
        <div className="space-y-3">
          {others.map((r) => (
            <PromoRow key={r._id} row={r} sessionToken={sessionToken} open={editing === r._id} onOpen={() => setEditing(editing === r._id ? null : r._id)} onDone={() => setEditing(null)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PromoRow({
  row,
  sessionToken,
  open,
  onOpen,
  onDone,
}: {
  row: Row;
  sessionToken: string;
  open: boolean;
  onOpen: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const set = useMutation(api.promo.adminSet);
  const stop = useMutation(api.promo.adminStop);
  const [date, setDate] = useState(() => toDateInput(row.active && row.promoUntil ? row.promoUntil : Date.now() + 30 * DAY));
  const [note, setNote] = useState(row.promoNote);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fmt = (ms: number) => new Date(ms).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });
  const daysLeft = row.promoUntil ? Math.ceil((row.promoUntil - Date.now()) / DAY) : 0;

  const save = async () => {
    setErr('');
    setBusy(true);
    try {
      await set({ sessionToken, roomId: row._id as any, until: endOfDay(date), note });
      onDone();
    } catch (e) {
      setErr(cleanError(e));
    } finally {
      setBusy(false);
    }
  };
  const end = async () => {
    if (!confirm(t('promo.admin.stop_confirm', { room: row.title }))) return;
    setBusy(true);
    try {
      await stop({ sessionToken, roomId: row._id as any });
      onDone();
    } catch (e) {
      setErr(cleanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`bg-brand-surface rounded-2xl border p-4 ${row.active ? 'border-brand-red/40' : 'border-white/5'}`}>
      <div className="flex flex-wrap items-center gap-3">
        {row.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/5 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">
            {row.title} {!row.isActive && <span className="text-xs text-brand-text-muted font-normal">· {t('promo.admin.inactive')}</span>}
          </p>
          <p className="text-xs text-brand-text-secondary truncate">{[row.companyName, row.location].filter(Boolean).join(' · ')}</p>
          {row.active && row.promoUntil && (
            <p className="text-xs text-brand-red-light mt-0.5 flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {t('promo.admin.until')} {fmt(row.promoUntil)} · {daysLeft <= 1 ? t('promo.admin.last_day') : t('promo.admin.days_left', { n: String(daysLeft) })}
              {row.promoSince && <span className="text-brand-text-muted"> · {t('promo.admin.since')} {fmt(row.promoSince)}</span>}
            </p>
          )}
          {row.active && row.promoNote && <p className="text-xs text-brand-text-muted mt-0.5 truncate">{row.promoNote}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onOpen} className={row.active ? 'btn-outline text-sm px-3 py-1.5' : 'btn-primary text-sm px-3 py-1.5'}>
            {open ? <X className="w-4 h-4" /> : row.active ? t('promo.admin.until') + '…' : t('promo.admin.start')}
          </button>
          {row.active && (
            <button type="button" disabled={busy} onClick={end} className="btn-outline text-sm px-3 py-1.5 text-red-300">
              {t('promo.admin.stop')}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(toDateInput((row.active && row.promoUntil ? row.promoUntil : Date.now()) + d * DAY))}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-brand-red text-brand-bone"
              >
                {row.active ? '+' : ''}{t(`promo.admin.d${d}`)}
              </button>
            ))}
            <label className="text-sm text-brand-text-secondary flex items-center gap-2 ml-1">
              {t('promo.admin.until')}
              <input
                type="date"
                value={date}
                min={toDateInput(Date.now())}
                onChange={(e) => setDate(e.target.value)}
                className="bg-brand-bg border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:border-brand-red focus:outline-hidden [color-scheme:dark]"
              />
            </label>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder={t('promo.admin.note_ph')}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-red focus:outline-hidden"
          />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button type="button" disabled={busy || !date} onClick={save} className="btn-primary text-sm px-4 py-2">
            {row.active ? t('promo.admin.save') : t('promo.admin.start')}
          </button>
        </div>
      )}
    </div>
  );
}
