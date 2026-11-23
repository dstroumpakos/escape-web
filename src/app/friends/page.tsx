'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { rankLabel } from '@/components/profile/ProfileView';
import { Users, Search, UserPlus, UserCheck, UserX, MessageCircle } from 'lucide-react';

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type Person = { _id: string; name: string; avatar?: string; title?: string };

function Avatar({ p }: { p: Person }) {
  return (
    <div className="w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-border/30 flex items-center justify-center overflow-hidden shrink-0">
      {p.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-lg font-bold text-brand-red-light">{p.name?.charAt(0)?.toUpperCase()}</span>
      )}
    </div>
  );
}

/**
 * Players: no friend requests. You follow players (one way); players who follow
 * each other are listed here. A message to someone who doesn't follow you
 * arrives in their message requests (/messages).
 */
export default function PlayersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'mutual' | 'search'>('mutual');
  const [searchTerm, setSearchTerm] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const mutual = useQuery(api.friends.listFriends, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip') as
    | Person[]
    | undefined;
  const searchResults = useQuery(
    api.friends.searchUsers,
    user?.sessionToken && debouncedSearch.trim().length >= 3 ? { sessionToken: user.sessionToken, searchTerm: debouncedSearch } : 'skip'
  ) as (Person & { isFollowing?: boolean; followsYou?: boolean })[] | undefined;

  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  const toggleFollow = async (id: string, following: boolean) => {
    setBusy(id);
    try {
      await (following ? unfollow : follow)({ sessionToken: user.sessionToken, userId: id as never });
    } catch (err) {
      console.error(err);
    }
    setBusy(null);
  };

  const messageBtn = (p: Person) => (
    <button
      onClick={() => router.push(`/messages?to=${p._id}`)}
      className="p-2 rounded-lg text-brand-text-muted hover:text-brand-red-light hover:bg-brand-red/10 transition-colors"
      title={t('pf.message')}
      aria-label={`${t('pf.message')} ${p.name}`}
    >
      <MessageCircle className="w-4 h-4" />
    </button>
  );

  const tab = (key: 'mutual' | 'search', Icon: typeof Users, label: string) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        activeTab === key ? 'bg-brand-red text-white' : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface/80'
      }`}
    >
      <Icon className="w-4 h-4 inline mr-1.5" />
      {label}
    </button>
  );

  return (
    <>
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="section-heading mb-2">{t('people.title')}</h1>
          <p className="text-brand-text-secondary">{t('people.subtitle')}</p>
        </div>
      </section>

      <section className="pb-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2">
          {tab('mutual', Users, `${t('people.mutual')} (${mutual?.length ?? 0})`)}
          {tab('search', Search, t('people.find'))}
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'mutual' &&
            (!mutual ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
              </div>
            ) : mutual.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-brand-border mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('people.none')}</h3>
                <p className="text-brand-text-muted mb-4">{t('people.none_desc')}</p>
                <button onClick={() => setActiveTab('search')} className="btn-primary">
                  <Search className="w-4 h-4 mr-2 inline" />
                  {t('people.find')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {mutual.map((p) => (
                  <div key={p._id} className="card p-4 flex items-center gap-4">
                    <Link href={`/u/${p._id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar p={p} />
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{p.name}</h3>
                        <p className="text-xs text-brand-text-muted truncate">{p.title && rankLabel(t, p.title)}</p>
                      </div>
                    </Link>
                    {messageBtn(p)}
                  </div>
                ))}
              </div>
            ))}

          {activeTab === 'search' && (
            <>
              <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('friends.search_placeholder')}
                  className="input-field pl-12 w-full"
                  autoFocus
                />
              </div>

              {searchTerm.trim().length < 3 ? (
                <div className="text-center py-20">
                  <Search className="w-16 h-16 text-brand-border mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('people.search_title')}</h3>
                  <p className="text-brand-text-muted">{t('people.search_desc')}</p>
                </div>
              ) : !searchResults ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-20">
                  <UserX className="w-16 h-16 text-brand-border mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('friends.no_results')}</h3>
                  <p className="text-brand-text-muted">{t('friends.no_results_desc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((u) => (
                    <div key={u._id} className="card p-4 flex items-center gap-4">
                      <Link href={`/u/${u._id}`} className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar p={u} />
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{u.name}</h3>
                          <p className="text-xs text-brand-text-muted truncate">
                            {u.followsYou ? t('people.follows_you') : u.title && rankLabel(t, u.title)}
                          </p>
                        </div>
                      </Link>
                      {messageBtn(u)}
                      <button
                        onClick={() => toggleFollow(u._id, !!u.isFollowing)}
                        disabled={busy === u._id}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                          u.isFollowing
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-brand-red/10 text-brand-red-light hover:bg-brand-red/20'
                        }`}
                      >
                        {busy === u._id ? (
                          <div className="w-3.5 h-3.5 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                        ) : u.isFollowing ? (
                          <UserCheck className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        {u.isFollowing ? t('people.following') : u.followsYou ? t('people.follow_back') : t('people.follow')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
