'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { Users, Bell, ImagePlus, MessageCircle, UserPlus, Check } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { FOLLOW_ENABLED } from '@/lib/features';
import { PostCard, Avatar, type FeedPost } from '@/components/community/PostCard';

type Mode = 'all' | 'following';

/** Community, Facebook style: shortcuts on the left, the feed, people to follow on the right. */
export default function CommunityPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const token = user?.sessionToken;
  const [mode, setMode] = useState<Mode>('all');
  const feed = useQuery(api.community.feed, { sessionToken: token, mode }) as FeedPost[] | undefined;
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  // Name and avatar from the server (older logins stored them empty).
  const me = useQuery(api.users.getById, token ? { sessionToken: token } : 'skip') as any;
  const myName: string = me?.name || user?.name || '';
  const myAvatar: string = me?.avatar || user?.avatar || '';

  const shortcuts = [
    ...(user ? [{ href: `/u/${user.id}`, label: myName, avatar: true }] : []),
    // Discover, map and leaderboard are already in the top bar.
    { href: '/friends', label: t('cm.friends'), Icon: Users },
    ...(user ? [{ href: '/notifications', label: t('cm.notifications'), Icon: Bell }] : []),
  ];

  return (
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 pt-24 pb-20 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)] ${FOLLOW_ENABLED ? 'xl:grid-cols-[260px_minmax(0,1fr)_300px]' : 'xl:grid-cols-[260px_minmax(0,1fr)_260px]'}`}>
      {/* Left: shortcuts */}
      <aside className="hidden lg:block">
        <nav className="sticky top-24 space-y-1">
          {shortcuts.map((s: any) => (
            <Link key={s.href} href={s.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm font-medium text-brand-text">
              {s.avatar ? (
                <Avatar src={myAvatar} name={myName} size={32} />
              ) : (
                <span className="w-8 h-8 rounded-full bg-brand-red/15 flex items-center justify-center"><s.Icon className="w-4 h-4 text-brand-red-light" /></span>
              )}
              <span className="truncate">{s.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Middle: composer + feed */}
      <main className="min-w-0 max-w-[640px] w-full mx-auto space-y-4">
        {isAuthenticated && user ? (
          <div className="panel p-4">
            <div className="flex items-center gap-3">
              <Link href={`/u/${user.id}`}><Avatar src={myAvatar} name={myName} /></Link>
              <Link href="/social/create" className="flex-1 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2.5 text-sm text-brand-text-muted">
                {t('cm.whats_new', { name: myName.split(' ')[0] })}
              </Link>
            </div>
            <div className="mt-3 pt-3 border-t border-brand-border/60 flex">
              <Link href="/social/create" className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md hover:bg-white/5 text-sm font-semibold text-brand-text-secondary">
                <ImagePlus className="w-5 h-5 text-green-400" /> {t('cm.photo')}
              </Link>
              <Link href="/social/create" className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md hover:bg-white/5 text-sm font-semibold text-brand-text-secondary">
                <MessageCircle className="w-5 h-5 text-brand-gold" /> {t('cm.review_room')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="panel p-5 text-center">
            <p className="font-display font-bold text-brand-bone text-lg">{t('cm.join_title')}</p>
            <p className="text-sm text-brand-text-secondary mt-1 mb-4">{t('cm.join_desc')}</p>
            <div className="flex gap-2 justify-center">
              <Link href="/signup" className="btn-primary text-sm">{t('nav.signup')}</Link>
              <Link href="/login" className="btn-ghost text-sm">{t('nav.login')}</Link>
            </div>
          </div>
        )}

        {FOLLOW_ENABLED && isAuthenticated && (
          <div className="flex bg-brand-surface border border-brand-border rounded-xl p-1 w-fit" role="tablist">
            {(['all', 'following'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${mode === m ? 'bg-brand-red text-white' : 'text-brand-text-secondary hover:text-white'}`}
              >
                {m === 'all' ? t('cm.for_you') : t('cm.following')}
              </button>
            ))}
          </div>
        )}

        {feed === undefined ? (
          [0, 1].map((i) => <div key={i} className="panel h-64 animate-pulse" />)
        ) : feed.length === 0 ? (
          <div className="panel p-10 text-center text-brand-text-secondary">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{mode === 'following' ? t('cm.empty_following') : t('cm.empty')}</p>
          </div>
        ) : (
          feed
            .filter((p) => !hidden.has(p._id) && !(p.author.id && hidden.has(p.author.id)))
            .map((p) => (
              <PostCard
                key={p._id}
                post={p}
                onRemoved={() => setHidden((h) => new Set([...h, p._id, ...(p.isMine ? [] : p.author.id ? [p.author.id] : [])]))}
              />
            ))
        )}
      </main>

      {/* Right: people to follow */}
      {FOLLOW_ENABLED && (
      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <Suggestions />
        </div>
      </aside>
      )}
    </div>
  );
}

function Suggestions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const people = useQuery(api.community.suggestions, { sessionToken: user?.sessionToken });
  const follow = useMutation(api.social.follow);
  const [done, setDone] = useState<Set<string>>(new Set());
  if (!people || people.length === 0) return null;
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-semibold text-brand-text-secondary mb-3">{t('cm.suggested')}</h3>
      <div className="space-y-3">
        {people.map((p) => (
          <div key={p._id} className="flex items-center gap-3">
            <Link href={`/u/${p._id}`}><Avatar src={p.avatar} name={p.name} size={40} /></Link>
            <div className="flex-1 min-w-0">
              <Link href={`/u/${p._id}`} className="block text-sm font-semibold text-brand-bone truncate hover:underline">{p.name}</Link>
              <p className="text-xs text-brand-text-muted">{t('cm.posts_n', { n: String(p.posts) })}</p>
            </div>
            {user && (
              <button
                onClick={async () => {
                  await follow({ sessionToken: user.sessionToken, userId: p._id }).catch(() => {});
                  setDone((d) => new Set([...d, p._id]));
                }}
                disabled={done.has(p._id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-brand-red/15 text-brand-red-light hover:bg-brand-red/25 disabled:bg-white/5 disabled:text-brand-text-muted flex items-center gap-1"
              >
                {done.has(p._id) ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {done.has(p._id) ? t('pf.following_btn') : t('pf.follow')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
