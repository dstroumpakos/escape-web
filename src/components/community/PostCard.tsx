'use client';

import { useCallback, useState } from 'react';
import { PhotoViewer } from './PhotoViewer';
import { VideoThumb } from './VideoThumb';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Star, BadgeCheck, Trash2, Flag, Ban, Check } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';

export type FeedPost = {
  _id: string;
  text: string;
  media: { type: 'image' | 'video'; url: string }[];
  likes: number;
  createdAt: number;
  rating: number | null;
  commentCount: number;
  likedByMe: boolean;
  isMine: boolean;
  author: { kind: 'user' | 'company'; id: string | null; name: string; avatar: string; verified: boolean };
  room: { id: string; title: string; image: string } | null;
};

function Avatar({ src, name, size = 40 }: { src: string; name: string; size?: number }) {
  return (
    <div className="rounded-full bg-brand-surface overflow-hidden flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-brand-red-light">{(name || '?').charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function useTimeAgo() {
  const { t } = useTranslation();
  return (ts: number) => {
    const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    if (mins < 1) return t('cm.just_now');
    if (mins < 60) return t('cm.minutes', { n: String(mins) });
    const h = Math.floor(mins / 60);
    if (h < 24) return t('cm.hours', { n: String(h) });
    const d = Math.floor(h / 24);
    if (d < 7) return t('cm.days', { n: String(d) });
    return new Date(ts).toLocaleDateString();
  };
}

/** A post in the Community feed, Facebook style. */
export function PostCard({ post, onRemoved }: { post: FeedPost; onRemoved?: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const token = user?.sessionToken;
  const timeAgo = useTimeAgo();
  const toggleLike = useMutation(api.posts.toggleLike);
  const deletePost = useMutation(api.posts.deletePost);
  const reportPost = useMutation(api.moderation.reportPost);
  const blockUser = useMutation(api.moderation.blockUser);

  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');

  const authorHref = post.author.kind === 'user' && post.author.id ? `/u/${post.author.id}` : null;
  // Photos and videos; tapping one opens it full screen (a lone video plays in place)
  const images = post.media.filter((m) => m.type === 'image' || m.type === 'video');
  const [viewing, setViewing] = useState<number | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);

  const like = async () => {
    if (!token) return router.push('/login');
    setLiked(!liked);
    setLikes((n) => n + (liked ? -1 : 1));
    try {
      await toggleLike({ postId: post._id as any, sessionToken: token });
    } catch {
      setLiked(liked);
      setLikes(post.likes);
    }
  };
  const share = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: post.author.name });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };
  const act = async (fn: () => Promise<unknown>, done: string) => {
    setMenu(false);
    try {
      await fn();
      setNotice(done);
      if (done === t('cm.deleted') || done === t('cm.blocked')) onRemoved?.();
    } catch (e) {
      setNotice(cleanError(e));
    }
  };

  const NameTag = (
    <span className="font-semibold text-brand-bone hover:underline inline-flex items-center gap-1">
      {post.author.name}
      {post.author.verified && <BadgeCheck className="w-4 h-4 text-sky-400" />}
    </span>
  );

  return (
    <article className="panel overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        {authorHref ? <Link href={authorHref}><Avatar src={post.author.avatar} name={post.author.name} /></Link> : <Avatar src={post.author.avatar} name={post.author.name} />}
        <div className="flex-1 min-w-0 text-sm">
          <p className="leading-snug">
            {authorHref ? <Link href={authorHref}>{NameTag}</Link> : NameTag}
            {post.room && (
              <>
                <span className="text-brand-text-muted"> {t('cm.at')} </span>
                <Link href={`/rooms/${post.room.id}`} className="font-semibold text-brand-bone hover:underline">{post.room.title}</Link>
              </>
            )}
          </p>
          <p className="text-xs text-brand-text-muted">
            <Link href={`/post/${post._id}`} className="hover:underline">{timeAgo(post.createdAt)}</Link>
            {post.rating && (
              <span className="inline-flex ml-2 align-middle">
                {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3 h-3 ${i < post.rating! ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}`} />)}
              </span>
            )}
          </p>
        </div>
        {token && (
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="p-1.5 rounded-full hover:bg-white/5 text-brand-text-muted" aria-label={t('cm.more')}>
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menu && (
              <div className="absolute right-0 top-9 z-20 w-52 bg-brand-surface border border-brand-border rounded-lg shadow-xl py-1 text-sm">
                {post.isMine ? (
                  <button onClick={() => confirm(t('cm.delete_confirm')) && act(() => deletePost({ postId: post._id as any, sessionToken: token }), t('cm.deleted'))} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-red-400">
                    <Trash2 className="w-4 h-4" /> {t('cm.delete')}
                  </button>
                ) : (
                  <>
                    <button onClick={() => act(() => reportPost({ postId: post._id as any, sessionToken: token, reason: 'inappropriate' }), t('cm.reported'))} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
                      <Flag className="w-4 h-4" /> {t('cm.report')}
                    </button>
                    {post.author.kind === 'user' && post.author.id && (
                      <button onClick={() => confirm(t('cm.block_confirm', { name: post.author.name })) && act(() => blockUser({ sessionToken: token, blockedUserId: post.author.id as any }), t('cm.blocked'))} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-red-400">
                        <Ban className="w-4 h-4" /> {t('cm.block', { name: post.author.name })}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text */}
      {post.text && <p className={`px-4 pb-3 whitespace-pre-line text-brand-text ${!images.length && post.text.length < 90 ? 'text-xl' : 'text-[15px]'}`}>{post.text}</p>}

      {/* Photos and videos */}
      {images.length > 0 && (
        <div className={`grid gap-0.5 bg-black ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.slice(0, 4).map((m, i) => (
            m.type === 'video' && images.length === 1 ? (
              <video key={i} src={m.url} controls playsInline preload="metadata" className="w-full max-h-[560px] bg-black" />
            ) : (
            <button
              type="button"
              key={i}
              onClick={() => setViewing(i)}
              className={`relative block cursor-zoom-in ${images.length === 1 ? '' : 'aspect-square'} ${images.length === 3 && i === 0 ? 'row-span-2 aspect-auto' : ''}`}
            >
              {m.type === 'video' ? (
                <span className="absolute inset-0"><VideoThumb url={m.url} /></span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className={`w-full ${images.length === 1 ? 'max-h-[560px] object-contain mx-auto' : 'h-full object-cover'}`} />
              )}
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-2xl font-bold">+{images.length - 4}</div>
              )}
            </button>
            )
          ))}
        </div>
      )}
      {viewing !== null && <PhotoViewer urls={images.map((m) => m.url)} types={images.map((m) => m.type)} start={viewing} onClose={closeViewer} />}

      {/* Counts */}
      {(likes > 0 || post.commentCount > 0) && (
        <div className="flex items-center justify-between px-4 pt-2.5 text-xs text-brand-text-muted">
          <span className="flex items-center gap-1.5">
            {likes > 0 && (
              <>
                <span className="w-5 h-5 rounded-full bg-brand-red flex items-center justify-center"><Heart className="w-3 h-3 fill-white text-white" /></span>
                {likes}
              </>
            )}
          </span>
          {post.commentCount > 0 && (
            <button onClick={() => setShowComments(true)} className="hover:underline">{t('cm.comments_count', { n: String(post.commentCount) })}</button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mx-4 mt-2 border-t border-brand-border/60 grid grid-cols-3 text-sm font-semibold text-brand-text-secondary">
        <button onClick={like} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-md hover:bg-white/5 whitespace-nowrap ${liked ? 'text-brand-red-light' : ''}`}>
          <Heart className={`w-5 h-5 ${liked ? 'fill-brand-red text-brand-red' : ''}`} /> {t('cm.like')}
        </button>
        <button onClick={() => (token ? setShowComments(!showComments) : router.push('/login'))} className="flex items-center justify-center gap-1.5 py-2.5 rounded-md hover:bg-white/5 whitespace-nowrap">
          <MessageCircle className="w-5 h-5" /> {t('cm.comment')}
        </button>
        <button onClick={share} className="flex items-center justify-center gap-1.5 py-2.5 rounded-md hover:bg-white/5 whitespace-nowrap">
          {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />} {copied ? t('cm.copied') : t('cm.share')}
        </button>
      </div>

      {notice && <p className="px-4 pb-2 text-xs text-brand-gold">{notice}</p>}
      {showComments && <Comments postId={post._id} />}
      <div className="h-2" />
    </article>
  );
}

function Comments({ postId }: { postId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const comments = useQuery(api.posts.getComments, { postId: postId as any });
  const me = useQuery(api.users.getById, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip') as any;
  const addComment = useMutation(api.posts.addComment);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const send = async () => {
    if (!user?.sessionToken || !text.trim()) return;
    setErr('');
    try {
      await addComment({ postId: postId as any, sessionToken: user.sessionToken, text: text.trim() });
      setText('');
    } catch (e) {
      setErr(cleanError(e));
    }
  };
  return (
    <div className="px-4 pt-2 space-y-2.5">
      {(comments ?? []).map((c: any) => (
        <div key={c._id} className="flex gap-2">
          <Link href={`/u/${c.userId}`}><Avatar src={c.userAvatar} name={c.userName} size={32} /></Link>
          <div className="bg-white/5 rounded-2xl px-3 py-2 text-sm max-w-full">
            <Link href={`/u/${c.userId}`} className="font-semibold text-brand-bone hover:underline">{c.userName}</Link>
            <p className="text-brand-text whitespace-pre-line break-words">{c.text}</p>
          </div>
        </div>
      ))}
      {user && (
        <div className="flex gap-2 items-center">
          <Avatar src={me?.avatar || user.avatar || ''} name={me?.name || user.name || ''} size={32} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            maxLength={2000}
            placeholder={t('cm.write_comment')}
            className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-brand-red"
          />
        </div>
      )}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

export { Avatar };
