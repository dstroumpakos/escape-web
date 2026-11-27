'use client';

import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Crown, Loader2, Search, ShieldCheck, MailWarning, ExternalLink, User } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

type Filter = 'all' | 'premium' | 'unverified' | 'booked';
const PAGE = 50;

/** Admin Users tab: every player account, searchable, newest first. */
export function AdminUsers({ sessionToken }: { sessionToken: string }) {
  const { t, language } = useTranslation();
  const users = useQuery(api.adminUsers.list, { sessionToken });
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    if (!users) return [];
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'premium' && !u.isPremium) return false;
      if (filter === 'unverified' && u.emailVerified) return false;
      if (filter === 'booked' && u.bookings === 0) return false;
      if (!term) return true;
      return [u.name, u.email, u.phone, u.city].some((s) => s.toLowerCase().includes(term));
    });
  }, [users, q, filter]);

  if (users === undefined) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-text-secondary" /></div>;
  }

  const date = (ms: number) => new Date(ms).toLocaleDateString(language === 'el' ? 'el-GR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('au.all') },
    { id: 'premium', label: 'Premium' },
    { id: 'unverified', label: t('au.unverified') },
    { id: 'booked', label: t('au.booked') },
  ];

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setShown(PAGE); }}
            placeholder={t('au.search')}
            className="w-full bg-brand-bg border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setShown(PAGE); }}
              className={`text-xs px-3 py-1.5 rounded-full border ${filter === f.id ? 'bg-brand-red border-brand-red text-white' : 'border-white/10 text-brand-text-secondary hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-brand-text-secondary">{t('au.count', { n: String(filtered.length), total: String(users.length) })}</p>

      <ul className="divide-y divide-white/5">
        {filtered.slice(0, shown).map((u) => (
          <li key={u._id} className="flex flex-wrap items-center gap-3 py-3">
            {u.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-black/40" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"><User className="w-4 h-4 text-brand-text-secondary" /></div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold flex flex-wrap items-center gap-2">
                <span className="truncate">{u.name || '—'}</span>
                {u.isPremium && <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300"><Crown className="w-3 h-3" /> Premium</span>}
                {u.isAdmin && <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300"><ShieldCheck className="w-3 h-3" /> Admin</span>}
                {!u.emailVerified && <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-brand-text-secondary"><MailWarning className="w-3 h-3" /> {t('au.unverified')}</span>}
              </p>
              <p className="text-xs text-brand-text-secondary truncate">{[u.email, u.phone, u.city].filter(Boolean).join(' · ')}</p>
              <p className="text-xs text-brand-text-muted">
                {t('au.joined')} {date(u.createdAt)} · {u.methods.map((m) => t(`au.m_${m}`)).join(', ') || '—'}
                {u.language ? ` · ${u.language.toUpperCase()}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-brand-text-secondary">
              <span>{t('au.played')} <b className="text-white">{u.played}</b></span>
              <span>{t('au.bookings')} <b className="text-white">{u.bookings}</b></span>
              <a href={`/u/${u._id}`} target="_blank" rel="noreferrer" className="p-1.5 hover:text-white" aria-label={t('au.profile')} title={t('au.profile')}>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p className="text-sm text-brand-text-secondary py-6 text-center">{t('au.none')}</p>}
      {filtered.length > shown && (
        <button onClick={() => setShown(shown + PAGE)} className="btn-ghost text-sm w-full">
          {t('au.more', { n: String(Math.min(PAGE, filtered.length - shown)) })}
        </button>
      )}
    </div>
  );
}
