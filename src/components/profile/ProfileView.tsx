'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { VideoThumb } from '@/components/community/VideoThumb';
import { ShareButton, ShareSheet } from '@/components/community/ShareSheet';
import { Camera, Grid3x3, Info, DoorOpen, Heart, MessageCircle, MapPin, CalendarDays, Trophy, UserCheck, Pencil, X, Loader2, Diamond, Star, PlusSquare, Settings, Footprints } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';
import { FOLLOW_ENABLED } from '@/lib/features';
import { squareAvatar } from '@/lib/imageUtils';
import { localeFor } from '@/lib/languages';

/** Uploads a profile photo (centre square, 512 px) and saves it on the account. */
function useAvatarUpload(token: string | undefined) {
  const uploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfile = useMutation(api.users.updateProfile);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const upload = async (file: File | undefined) => {
    if (!file || !token) return;
    setBusy(true);
    setErr('');
    try {
      const blob = await squareAvatar(file);
      const url = await uploadUrl({ sessionToken: token });
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
      if (!res.ok) throw new Error('upload');
      const { storageId } = await res.json();
      await updateProfile({ sessionToken: token, avatarStorageId: storageId });
    } catch (e) {
      setErr(cleanError(e) || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!token) return;
    setBusy(true);
    setErr('');
    try {
      await updateProfile({ sessionToken: token, avatar: '' });
    } catch (e) {
      setErr(cleanError(e));
    } finally {
      setBusy(false);
    }
  };
  return { upload, remove, busy, err };
}

type Tab = 'posts' | 'about' | 'rooms';

// users.title is stored in English ("Escape Rookie"); show it in the UI language.
export const RANKS: Record<string, string> = {
  'Escape Rookie': 'profile.rank_rookie',
  'Escape Explorer': 'profile.rank_explorer',
  'Escape Adventurer': 'profile.rank_adventurer',
  'Escape Veteran': 'profile.rank_veteran',
  'Escape Expert': 'profile.rank_expert',
  'Escape Master': 'profile.rank_master',
  'Escape Legend': 'profile.rank_legend',
};
/** A rank title in the UI language (unknown titles are shown as they are). */
export const rankLabel = (t: (k: string) => string, title: string) => (RANKS[title] ? t(RANKS[title]) : title);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** users.memberSince is stored as "Member since Nov 2026"; show the month in the UI language. */
const since = (s: string, lang: string) => {
  const text = s.replace('Member since', '').trim();
  const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(text);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  if (month < 0) return text;
  return new Date(Number(m![2]), month, 1).toLocaleDateString(localeFor(lang), { month: 'short', year: 'numeric' });
};

/**
 * A player's profile, Instagram + Facebook style: cover and avatar, counters,
 * follow, and tabs for the posts grid, "about" and rooms (convex/social.ts).
 */
export function ProfileView({ userId }: { userId: string }) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const token = user?.sessionToken;
  const profile = useQuery(api.social.profile, { userId: userId as any, sessionToken: token });
  const posts = useQuery(api.social.userPosts, { userId: userId as any, sessionToken: token });
  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);
  const [tab, setTab] = useState<Tab>('posts');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [list, setList] = useState<'followers' | 'following' | null>(null);
  const [openPost, setOpenPost] = useState<any>(null);
  const photo = useAvatarUpload(token);
  const photoInput = useRef<HTMLInputElement>(null);

  if (profile === undefined) {
    return <div className="max-w-4xl mx-auto px-4 pt-28"><div className="h-80 panel animate-pulse" /></div>;
  }
  if (profile === null) {
    return <div className="max-w-4xl mx-auto px-4 pt-32 text-center text-brand-text-secondary">{t('pf.not_found')}</div>;
  }

  const toggleFollow = async () => {
    if (!token) return;
    setBusy(true);
    try {
      if (profile.viewer.isFollowing) await unfollow({ sessionToken: token, userId: profile._id });
      else await follow({ sessionToken: token, userId: profile._id });
    } finally {
      setBusy(false);
    }
  };

  const Count = ({ n, label, onClick }: { n: number; label: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick} disabled={!onClick} className="text-center min-w-[64px] disabled:cursor-default">
      <div className="text-lg sm:text-xl font-display font-bold text-brand-bone tabular-nums">{n}</div>
      <div className="text-[11px] sm:text-xs text-brand-text-muted">{label}</div>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
      {/* Cover (Facebook) */}
      <div className="relative h-40 sm:h-60 sm:rounded-b-2xl overflow-hidden bg-linear-to-br from-brand-red/40 via-black to-brand-dark">
        {profile.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
      </div>

      {/* Avatar + name + actions */}
      <div className="px-4 sm:px-6 -mt-12 sm:-mt-16 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
            <div className="w-full h-full rounded-full border-4 border-brand-bg bg-brand-surface overflow-hidden flex items-center justify-center shadow-[0_0_24px_rgba(var(--glow),0.35)]">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-brand-red-light">{profile.name.charAt(0).toUpperCase()}</span>
              )}
              {photo.busy && (
                <span className="absolute inset-1 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </span>
              )}
            </div>
            {profile.viewer.isMe && (
              <>
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  disabled={photo.busy}
                  className="absolute bottom-0.5 right-0.5 w-9 h-9 rounded-full bg-brand-red text-white border-2 border-brand-bg flex items-center justify-center hover:bg-brand-red-light transition-colors"
                  aria-label={profile.avatar ? t('pf.change_photo') : t('pf.add_photo')}
                  title={profile.avatar ? t('pf.change_photo') : t('pf.add_photo')}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    photo.upload(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </>
            )}
          </div>
          <div className="flex-1 min-w-0 sm:pb-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bone truncate flex items-center gap-2">
              {profile.name}
              {profile.isPremium && <Diamond className="w-5 h-5 text-yellow-400 shrink-0" />}
            </h1>
            {profile.title && <p className="text-sm text-brand-red-light">{rankLabel(t, profile.title)}</p>}
          </div>
          <div className="flex gap-2 sm:pb-2">
            {profile.viewer.isMe ? (
              <>
                <button onClick={() => setEditing(true)} className="btn-ghost text-sm flex items-center gap-2 py-2! px-4!">
                  <Pencil className="w-4 h-4" /> {t('pf.edit')}
                </button>
                <Link href="/profile/settings" className="btn-ghost text-sm flex items-center justify-center py-2! px-3!" title={t('pf.settings')} aria-label={t('pf.settings')}>
                  <Settings className="w-4 h-4" />
                </Link>
                <Link href="/social/create" className="btn-primary text-sm flex items-center gap-2 py-2! px-4!">
                  <PlusSquare className="w-4 h-4" /> {t('pf.new_post')}
                </Link>
              </>
            ) : profile.viewer.loggedIn ? (
              <>
                {/* The same two buttons on every profile: follow, and message (if they
                    don't follow you, the message arrives as a message request) */}
                {FOLLOW_ENABLED && (
                  <button
                    onClick={toggleFollow}
                    disabled={busy}
                    className={`${profile.viewer.isFollowing ? 'btn-ghost' : 'btn-primary'} text-sm flex items-center gap-2 py-2! px-5!`}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : profile.viewer.isFollowing ? <UserCheck className="w-4 h-4" /> : <Footprints className="w-4 h-4" />}
                    {profile.viewer.isFollowing ? t('pf.following_btn') : t('pf.follow')}
                  </button>
                )}
                <Link href={`/messages?to=${profile._id}`} className="btn-ghost text-sm flex items-center gap-2 py-2! px-4!">
                  <MessageCircle className="w-4 h-4" /> {t('pf.message')}
                </Link>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm flex items-center gap-2 py-2! px-5!">
                <Footprints className="w-4 h-4" /> {t('pf.follow')}
              </Link>
            )}
          </div>
        </div>

        {photo.err && <p className="mt-2 text-sm text-red-400">{photo.err}</p>}

        {/* Counters (Instagram) */}
        <div className="flex justify-around sm:justify-start sm:gap-8 mt-5 py-3 border-y border-brand-border/60">
          <Count n={profile.stats.posts} label={t('pf.posts')} />
          {FOLLOW_ENABLED && <Count n={profile.stats.followers} label={profile.stats.followers === 1 ? t('pf.follower_one') : t('pf.followers')} onClick={() => setList('followers')} />}
          {FOLLOW_ENABLED && <Count n={profile.stats.following} label={t('pf.following')} onClick={() => setList('following')} />}
          <Count n={profile.stats.played} label={t('pf.rooms')} />
        </div>

        {profile.bio && <p className="mt-3 text-sm text-brand-text whitespace-pre-line max-w-[60ch]">{profile.bio}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-text-muted">
          {profile.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>}
          {profile.memberSince && <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{t('profile.member_since')} {since(profile.memberSince, language)}</span>}
          {profile.viewer.isFriend && <span className="text-brand-gold">{t('people.mutual_badge')}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-brand-border/60 px-4 sm:px-6">
        {([
          ['posts', Grid3x3, t('pf.tab_posts')],
          ['about', Info, t('pf.tab_about')],
          ['rooms', DoorOpen, t('pf.tab_rooms')],
        ] as const).map(([k, Icon, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 sm:flex-none sm:px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 -mb-px transition-colors ${
              tab === k ? 'border-brand-red text-brand-bone' : 'border-transparent text-brand-text-muted hover:text-brand-bone'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="px-1 sm:px-6 mt-4">
        {tab === 'posts' && <PostsGrid posts={posts} isMe={profile.viewer.isMe} onOpen={setOpenPost} />}
        {tab === 'about' && <About profile={profile} />}
        {tab === 'rooms' && <Rooms userId={profile._id} />}
      </div>

      {editing && token && (
        <EditProfile token={token} bio={profile.bio} hasCover={!!profile.cover} avatar={profile.avatar} name={profile.name} onClose={() => setEditing(false)} />
      )}
      {list && <FollowList userId={profile._id} which={list} onClose={() => setList(null)} />}
      {openPost && (
        <PostModal
          post={openPost}
          author={profile}
          onClose={() => setOpenPost(null)}
          // Players share photos from their own profile only, not from other players'
          shareAs={profile.viewer.isMe ? { title: openPost.roomTitle || profile.name, subtitle: openPost.roomTitle ? profile.name : undefined, path: `/u/${profile._id}` } : undefined}
        />
      )}
    </div>
  );
}

function PostsGrid({ posts, isMe, onOpen }: { posts: any[] | undefined; isMe: boolean; onOpen: (p: any) => void }) {
  const { t } = useTranslation();
  if (posts === undefined) return <div className="grid grid-cols-3 gap-1">{[0, 1, 2].map((i) => <div key={i} className="aspect-square bg-brand-surface animate-pulse" />)}</div>;
  if (posts.length === 0) {
    return (
      <div className="text-center py-14 text-brand-text-secondary">
        <Camera className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{isMe ? t('pf.no_posts_me') : t('pf.no_posts')}</p>
        {isMe && <Link href="/social/create" className="btn-primary inline-block mt-4 text-sm">{t('pf.new_post')}</Link>}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((p) => {
        const img = p.media.find((m: any) => m.type === 'image')?.url;
        const vid = !img ? p.media.find((m: any) => m.type === 'video')?.url : undefined;
        return (
          <button key={p._id} onClick={() => onOpen(p)} className="group relative aspect-square overflow-hidden bg-brand-surface sm:rounded-md">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : vid ? (
              <span className="absolute inset-0"><VideoThumb url={vid} /></span>
            ) : (
              <div className="absolute inset-0 p-3 flex items-center justify-center bg-linear-to-br from-brand-red/25 to-black">
                <p className="text-xs sm:text-sm text-brand-bone line-clamp-5 text-center">{p.text}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-bold">
              <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{p.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{p.commentCount}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function About({ profile }: { profile: any }) {
  const { t, language } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="panel p-5 space-y-3 text-sm">
        <h3 className="font-display font-bold text-brand-bone">{t('pf.intro')}</h3>
        {profile.bio ? <p className="text-brand-text whitespace-pre-line">{profile.bio}</p> : <p className="text-brand-text-muted">{t('pf.no_bio')}</p>}
        {profile.city && <p className="flex items-center gap-2 text-brand-text-secondary"><MapPin className="w-4 h-4" />{profile.city}</p>}
        {profile.memberSince && <p className="flex items-center gap-2 text-brand-text-secondary"><CalendarDays className="w-4 h-4" />{t('profile.member_since')} {since(profile.memberSince, language)}</p>}
      </div>
      <div className="panel p-5">
        <h3 className="font-display font-bold text-brand-bone mb-3">{t('pf.stats')}</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><DoorOpen className="w-5 h-5 mx-auto text-brand-red-light" /><div className="text-xl font-bold">{profile.stats.played}</div><div className="text-xs text-brand-text-muted">{t('profile.rooms_played')}</div></div>
          <div><Trophy className="w-5 h-5 mx-auto text-green-400" /><div className="text-xl font-bold">{profile.stats.escaped}</div><div className="text-xs text-brand-text-muted">{t('profile.escaped')}</div></div>
        </div>
        {profile.badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.badges.map((b: any) => (
              <span key={b.key} className="text-xs px-2.5 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold">
                {b.icon ? `${b.icon} ` : ''}{b.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Rooms({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const rooms = useQuery(api.social.userRooms, { userId: userId as any, sessionToken: useAuth().user?.sessionToken });
  if (rooms === undefined) return <div className="h-24 panel animate-pulse" />;
  if (rooms.length === 0) return <p className="text-center text-sm text-brand-text-secondary py-12">{t('pf.no_rooms')}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rooms.map((r) => (
        <Link key={r.roomId} href={`/rooms/${r.roomId}`} className="panel p-3 flex items-center gap-3 hover:border-brand-red/50 transition-colors">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-brand-surface shrink-0">
            {r.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-bone truncate">{r.title}</p>
            <p className="text-xs text-brand-text-muted">{r.theme}</p>
            {r.rating && (
              <p className="flex mt-1">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating! ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}`} />)}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  // Rendered on <body>: page animations (transforms) would otherwise trap "fixed".
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/75 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className={`bg-brand-surface border border-brand-border w-full ${wide ? 'sm:max-w-4xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function FollowList({ userId, which, onClose }: { userId: string; which: 'followers' | 'following'; onClose: () => void }) {
  const { t } = useTranslation();
  const people = useQuery(api.social.followList, { userId: userId as any, which });
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between p-4 border-b border-brand-border">
        <h3 className="font-bold">{which === 'followers' ? t('pf.followers') : t('pf.following')}</h3>
        <button onClick={onClose} aria-label={t('cx.common.close')}><X className="w-5 h-5" /></button>
      </div>
      <div className="p-2">
        {people === undefined ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto my-6" />
        ) : people.length === 0 ? (
          <p className="text-center text-sm text-brand-text-muted py-8">{t('pf.nobody')}</p>
        ) : (
          people.map((u) => (
            <Link key={u._id} href={`/u/${u._id}`} onClick={onClose} className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5">
              <div className="w-10 h-10 rounded-full bg-brand-bg overflow-hidden flex items-center justify-center">
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-brand-red-light">{u.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="font-medium">{u.name}</span>
            </Link>
          ))
        )}
      </div>
    </Modal>
  );
}

export function PostModal({
  post,
  author,
  onClose,
  shareAs,
}: {
  post: any;
  author: any;
  onClose: () => void;
  /** Shows a share button for the post's photo/video (own profile and company profiles only) */
  shareAs?: { title: string; subtitle?: string; path: string };
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const comments = useQuery(api.posts.getComments, { postId: post._id });
  const likes = useQuery(api.posts.getUserLikes, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
  const toggleLike = useMutation(api.posts.toggleLike);
  const addComment = useMutation(api.posts.addComment);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const liked = (likes ?? []).includes(post._id);
  const img = post.media.find((m: any) => m.type === 'image')?.url;
  const vid = !img ? post.media.find((m: any) => m.type === 'video')?.url : undefined;
  const [likeCount, setLikeCount] = useState<number>(post.likes);
  const [sharing, setSharing] = useState(false);

  const like = async () => {
    if (!user?.sessionToken) return;
    const now = await toggleLike({ postId: post._id, sessionToken: user.sessionToken });
    setLikeCount((c) => c + (now ? 1 : -1));
  };
  const send = async () => {
    if (!user?.sessionToken || !text.trim()) return;
    setErr('');
    try {
      await addComment({ postId: post._id, sessionToken: user.sessionToken, text: text.trim() });
      setText('');
    } catch (e) {
      setErr(cleanError(e));
    }
  };

  return (
    <Modal onClose={onClose} wide={!!(img || vid)}>
      <div className={img || vid ? 'sm:grid sm:grid-cols-[1.3fr_1fr]' : ''}>
        {vid && <video src={vid} controls autoPlay playsInline className="w-full max-h-[60vh] sm:max-h-[80vh] bg-black" />}
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full max-h-[60vh] sm:max-h-[80vh] object-contain bg-black" />
        )}
        <div className="flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between p-4 border-b border-brand-border">
            <span className="font-bold">{author.name}</span>
            <div className="flex items-center gap-3">
              {shareAs && (img || vid) && <ShareButton onClick={() => setSharing(true)} className="text-brand-text-secondary hover:text-white" />}
              <button onClick={onClose} aria-label={t('cx.common.close')}><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 text-sm">
            {post.roomTitle && <Link href={`/rooms/${post.roomId}`} className="text-xs text-brand-red-light hover:underline">📍 {post.roomTitle}</Link>}
            {post.text && <p className="whitespace-pre-line">{post.text}</p>}
            {(comments ?? []).map((c: any) => (
              <p key={c._id}><Link href={`/u/${c.userId}`} className="font-semibold hover:underline">{c.userName}</Link> <span className="text-brand-text-secondary">{c.text}</span></p>
            ))}
          </div>
          <div className="p-4 border-t border-brand-border">
            <div className="flex items-center gap-4 mb-3">
              <button onClick={like} disabled={!user} className="flex items-center gap-1.5 text-sm">
                <Heart className={`w-5 h-5 ${liked ? 'fill-brand-red text-brand-red' : ''}`} /> {likeCount}
              </button>
              <span className="flex items-center gap-1.5 text-sm text-brand-text-muted"><MessageCircle className="w-5 h-5" />{(comments ?? []).length}</span>
            </div>
            {user && (
              <div className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} maxLength={2000} placeholder={t('pf.add_comment')} className="flex-1 bg-brand-bg border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-brand-red focus:outline-hidden" />
                <button onClick={send} className="text-sm font-semibold text-brand-red-light px-2">{t('pf.post_comment')}</button>
              </div>
            )}
            {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
          </div>
        </div>
      </div>
      {sharing && shareAs && (img || vid) && (
        <ShareSheet item={{ url: (img || vid)!, type: img ? 'image' : 'video', ...shareAs }} onClose={() => setSharing(false)} />
      )}
    </Modal>
  );
}

function EditProfile({
  token, bio, hasCover, avatar, name, onClose,
}: { token: string; bio: string; hasCover: boolean; avatar: string; name: string; onClose: () => void }) {
  const { t } = useTranslation();
  const update = useMutation(api.social.updateProfileInfo);
  const uploadUrl = useMutation(api.posts.generateUploadUrl);
  const [text, setText] = useState(bio);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const photo = useAvatarUpload(token);
  const photoRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      await update({ sessionToken: token, bio: text });
      onClose();
    } catch (e) {
      setErr(cleanError(e));
    } finally {
      setSaving(false);
    }
  };
  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    setSaving(true);
    setErr('');
    try {
      const url = await uploadUrl({ sessionToken: token });
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const { storageId } = await res.json();
      await update({ sessionToken: token, coverStorageId: storageId });
    } catch (e) {
      setErr(cleanError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between p-4 border-b border-brand-border">
        <h3 className="font-bold">{t('pf.edit')}</h3>
        <button onClick={onClose} aria-label={t('cx.common.close')}><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm text-brand-text-muted mb-1.5">{t('pf.photo')}</label>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="w-14 h-14 rounded-full bg-brand-bg overflow-hidden flex items-center justify-center shrink-0 border border-brand-border/60">
              {photo.busy ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-text-muted" />
              ) : avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-brand-red-light">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button type="button" onClick={() => photoRef.current?.click()} disabled={photo.busy} className="btn-ghost text-sm flex items-center gap-2 py-2! px-4! whitespace-nowrap">
              <Camera className="w-4 h-4 shrink-0" /> {photo.busy ? t('pf.uploading') : avatar ? t('pf.change_photo') : t('pf.add_photo')}
            </button>
            {avatar && !photo.busy && (
              <button type="button" onClick={photo.remove} className="text-sm text-brand-text-muted hover:text-red-400 whitespace-nowrap">
                {t('pf.remove_photo')}
              </button>
            )}
          </div>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              photo.upload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {photo.err && <p className="text-sm text-red-400 mt-1">{photo.err}</p>}
        </div>
        <div>
          <label className="block text-sm text-brand-text-muted mb-1.5">{t('pf.cover')}</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={saving} className="btn-ghost text-sm flex items-center gap-2 py-2! px-4!">
              <Camera className="w-4 h-4" /> {hasCover ? t('pf.change_cover') : t('pf.add_cover')}
            </button>
            {hasCover && (
              <button type="button" onClick={() => update({ sessionToken: token, coverStorageId: null })} disabled={saving} className="text-sm text-brand-text-muted hover:text-red-400">
                {t('pf.remove_cover')}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
        </div>
        <div>
          <label className="block text-sm text-brand-text-muted mb-1.5">{t('pf.bio')}</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={4} placeholder={t('pf.bio_placeholder')} className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-brand-red focus:outline-hidden resize-none" />
          <p className="text-xs text-brand-text-muted text-right">{text.length}/300</p>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} {t('profile.save')}
        </button>
      </div>
    </Modal>
  );
}
