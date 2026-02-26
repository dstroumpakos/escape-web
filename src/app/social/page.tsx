'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  Heart,
  MessageCircle,
  Share2,
  Star,
  DoorOpen,
  Plus,
  User,
  CheckCircle,
  Building2,
  Send,
} from 'lucide-react';

export default function SocialPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const feed = useQuery(api.posts.getFeed);
  const userLikes = useQuery(
    api.posts.getUserLikes,
    user?.id ? { userId: user.id as any } : 'skip'
  );
  const toggleLike = useMutation(api.posts.toggleLike);

  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const likedPostIds = new Set((userLikes ?? []) as string[]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    try {
      await toggleLike({ postId: postId as any, userId: user.id as any });
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="section-heading mb-2">
            {t('social.title')} <span className="text-gradient">{t('social.title_highlight')}</span>
          </h1>
          <p className="text-brand-text-secondary mb-6">
            {t('social.subtitle')}
          </p>
        </div>
      </section>

      {/* Feed */}
      <section className="pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Create Post Button */}
          {isAuthenticated && (
            <Link
              href="/social/create"
              className="card p-4 flex items-center gap-3 mb-6 hover:border-brand-red/30"
            >
              <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-brand-red" />
              </div>
              <span className="text-brand-text-muted text-sm">
                {t('social.share_prompt')}
              </span>
            </Link>
          )}

          {!feed ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
              <p className="text-brand-text-muted">{t('social.loading')}</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-20">
              <MessageCircle className="w-16 h-16 text-brand-border mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('social.no_posts')}</h3>
              <p className="text-brand-text-muted">
                {t('social.no_posts_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((post: any) => (
                <div key={post._id} className="card p-5">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center overflow-hidden">
                      {post.authorAvatar ? (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : post.authorType === 'company' ? (
                        <Building2 className="w-5 h-5 text-brand-text-muted" />
                      ) : (
                        <User className="w-5 h-5 text-brand-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">
                          {post.authorName}
                        </span>
                        {post.authorVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        {post.authorType === 'company' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-red/20 text-brand-red">
                            {t('social.business_badge')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-brand-text-muted">
                        {timeAgo(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Room tag */}
                  {post.roomTitle && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <DoorOpen className="w-3.5 h-3.5 text-brand-red" />
                      <span className="text-xs font-medium text-brand-red">
                        {post.roomTitle}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  {post.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < post.rating
                              ? 'text-brand-gold fill-brand-gold'
                              : 'text-brand-border'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Text */}
                  <p className="text-sm text-brand-text-secondary mb-3 leading-relaxed">
                    {post.text}
                  </p>

                  {/* Media */}
                  {post.media && post.media.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {post.media.map((m: any, i: number) => (
                        <div
                          key={i}
                          className="w-48 h-48 rounded-xl overflow-hidden shrink-0 bg-brand-surface"
                        >
                          {m.type === 'image' ? (
                            <img
                              src={m.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={m.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 pt-2 border-t border-brand-border/30">
                    <button
                      onClick={() => handleLike(post._id)}
                      className="flex items-center gap-1.5 text-sm transition-colors hover:text-brand-red"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedPostIds.has(post._id)
                            ? 'fill-brand-red text-brand-red'
                            : 'text-brand-text-muted'
                        }`}
                      />
                      <span className={likedPostIds.has(post._id) ? 'text-brand-red' : 'text-brand-text-muted'}>
                        {post.likes}
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        setExpandedComments(
                          expandedComments === post._id ? null : post._id
                        )
                      }
                      className="flex items-center gap-1.5 text-sm text-brand-text-muted hover:text-white transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.commentCount}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-brand-text-muted hover:text-white transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments === post._id && (
                    <CommentsSection postId={post._id} userId={user?.id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CommentsSection({ postId, userId }: { postId: string; userId?: string }) {
  const { t } = useTranslation();
  const comments = useQuery(api.posts.getComments, { postId: postId as any });
  const addComment = useMutation(api.posts.addComment);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      await addComment({ postId: postId as any, userId: userId as any, text: text.trim() });
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="mt-3 pt-3 border-t border-brand-border/30 space-y-3">
      {comments?.map((c: any) => (
        <div key={c._id} className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-surface flex items-center justify-center shrink-0">
            {c.userAvatar ? (
              <img src={c.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-brand-text-muted" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium">{c.userName}</span>
            <span className="text-[10px] text-brand-text-muted ml-2">{timeAgo(c.createdAt)}</span>
            <p className="text-xs text-brand-text-secondary">{c.text}</p>
          </div>
        </div>
      ))}

      {userId && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t('social.comment_placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="input-field !py-2 !text-sm flex-1"
          />
          <button
            disabled={sending || !text.trim()}
            onClick={handleSubmit}
            className="p-2 rounded-lg bg-brand-red text-white disabled:opacity-30 hover:bg-brand-red-hover transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
