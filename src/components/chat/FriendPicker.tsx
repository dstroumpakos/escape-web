'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Check, Search } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { Avatar } from './ChatUi';

type Friend = { _id: string; name: string; avatar: string };

/**
 * The player's friends with a search box. One tap picks a friend
 * (`onPick`), or with `selected` it becomes a multi-select.
 */
export function FriendPicker({
  exclude = [],
  selected,
  onToggle,
  onPick,
}: {
  exclude?: string[];
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onPick?: (f: Friend) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const friends = useQuery(api.friends.listFriends, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const ex = new Set(exclude);
    const all = ((friends ?? []).filter(Boolean) as Friend[]).filter((f) => !ex.has(f._id));
    const needle = q.trim().toLowerCase();
    return (needle ? all.filter((f) => f.name.toLowerCase().includes(needle)) : all).sort((a, b) => a.name.localeCompare(b.name));
  }, [friends, exclude, q]);

  if (friends === undefined) return <div className="p-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-brand-bg animate-pulse" />)}</div>;

  if ((friends ?? []).length === 0) {
    return (
      <div className="p-6 text-center text-sm text-brand-text-secondary">
        <p>{t('msg.no_friends')}</p>
        <Link href="/friends" className="btn-primary inline-block mt-4 text-sm">{t('msg.find_friends')}</Link>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="relative mb-2">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('msg.search_friends')}
          aria-label={t('msg.search_friends')}
          className="w-full bg-brand-bg border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-brand-red focus:outline-hidden"
        />
      </div>
      {list.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted py-6">{exclude.length ? t('msg.everyone_added') : '—'}</p>
      ) : (
        <ul className="space-y-0.5">
          {list.map((f) => {
            const on = selected?.has(f._id) ?? false;
            return (
              <li key={f._id}>
                <button
                  type="button"
                  onClick={() => (onToggle ? onToggle(f._id) : onPick?.(f))}
                  aria-pressed={onToggle ? on : undefined}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left"
                >
                  <Avatar src={f.avatar} name={f.name} />
                  <span className="flex-1 font-medium truncate">{f.name}</span>
                  {onToggle && (
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${on ? 'bg-brand-red border-brand-red' : 'border-brand-border'}`}>
                      {on && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
