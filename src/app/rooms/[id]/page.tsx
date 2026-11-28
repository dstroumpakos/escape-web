'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { BookNowButton } from '@/components/rooms/BookNowButton';
import { BOOKING_ENABLED } from '@/lib/features';
import { visitorId } from '@/lib/visitorId';
import { categoryOf, subthemesOf } from '@/lib/mode';
import { useTranslation } from '@/lib/i18n';
import { themeLabel } from '@/lib/roomThemes';
import { RoomMerchStrip } from '@/components/shop/RoomMerch';
import { InstagramStrip } from '@/components/rooms/InstagramStrip';
import { shownRating, formatRating, videoEmbedUrl } from '@/lib/roomMedia';
import { Star, Skull, Clock, Users, MapPin, Heart, ArrowLeft, DoorOpen, Zap, BookOpen, Diamond, CalendarClock, BadgeCheck, MessageSquare, ChevronDown, ChevronUp, CheckCircle, PlayCircle, Ghost, KeyRound, VenetianMask } from 'lucide-react';

/** The server's own message for review errors (it explains what to do), else a generic one. */
function friendlyReviewError(err: unknown): string {
  const data = (err as any)?.data;
  if (typeof data === 'string' && data.length < 200) return data;
  return 'Something went wrong. Please try again.';
}

export default function RoomDetailsPage() {
  const params = useParams();
  const roomId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useTranslation();

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');
  const toggleWishlist = useMutation(api.users.toggleWishlist);

  // Reviews
  const reviews = useQuery(api.reviews.getByRoom, roomId ? { roomId: roomId as any } : 'skip');
  const canReviewData = useQuery(
    api.reviews.canReview,
    isAuthenticated && user?.sessionToken && roomId
      ? { sessionToken: user.sessionToken, roomId: roomId as any }
      : 'skip'
  );
  const submitReview = useMutation(api.reviews.submit);

  // Count the visit for the company's stats (once per room per browser session)
  const trackView = useMutation(api.companyStats.trackRoomView);
  useEffect(() => {
    if (!roomId) return;
    const key = 'unlocked_viewed_' + roomId;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch {}
    trackView({ roomId: roomId as any, visitorId: visitorId() }).catch(() => {});
  }, [roomId, trackView]);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const isWishlisted = false; // Would need to query user's wishlist

  // Compute release countdown
  const releaseCountdown = (() => {
    if (!room || !(room as any).releaseDate) return null;
    const releaseDate = new Date((room as any).releaseDate + 'T00:00:00');
    const now = new Date();
    const diffMs = releaseDate.getTime() - now.getTime();
    if (diffMs <= 0) return null; // Already released
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.ceil(diffMs / (1000 * 60 * 60)) % 24;
    return { days, hours, releaseDateStr: releaseDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) };
  })();

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-text-muted">{t('room.loading')}</p>
        </div>
      </div>
    );
  }

  // Our own reviews, or the room's rating on another site if that has more
  const shown = shownRating(room);
  const trailer = videoEmbedUrl((room as any).videoUrl);

  const handleWishlist = async () => {
    if (!isAuthenticated || !user) return;
    try {
      await toggleWishlist({ sessionToken: user.sessionToken, roomId: roomId as any });
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };

  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[44vh] md:h-[56vh] overflow-hidden bg-black">
        {room.image && !imageFailed ? (
          <img
            src={room.image}
            alt={room.title}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover contrast-110 brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(70%_70%_at_50%_55%,#2a1010,#0a0505)] flex items-center justify-center">
            <DoorOpen className="w-24 h-24 text-brand-border/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-brand-bg via-brand-bg/45 to-black/50" />
        {/* Vignette so the photo sinks into the page */}
        <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_160px_rgba(0,0,0,0.85)]" />

        {/* Back button */}
        <div className="absolute top-24 left-4 sm:left-6 lg:left-8 z-20">
          <Link
            href="/discover"
            className="flex items-center gap-2 bg-black/70 backdrop-blur-xs px-4 py-2 rounded-md border border-brand-border text-sm text-brand-text hover:border-brand-red/60 hover:text-brand-bone transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('room.back')}
          </Link>
        </div>

        {/* Wishlist */}
        {isAuthenticated && (
          <button
            onClick={handleWishlist}
            className="absolute top-24 right-4 sm:right-6 lg:right-8 z-20 w-11 h-11 bg-black/70 backdrop-blur-xs rounded-full flex items-center justify-center border border-brand-border hover:border-brand-red/60 transition-all"
          >
            <Heart
              className={`w-5 h-5 ${
                isWishlisted ? 'fill-brand-red text-brand-red-light' : 'text-white'
              }`}
            />
          </button>
        )}

      </section>

      {/* Content */}
      <section className="relative z-10 -mt-24 md:-mt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Countdown Banner */}
          {releaseCountdown && (
            <div className="mb-4 bg-linear-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl border border-purple-500/20 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                <CalendarClock className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Diamond className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">{t('room.early_access')}</span>
                </div>
                <p className="text-sm text-purple-200">
                  This room launches <span className="font-bold text-white">{releaseCountdown.releaseDateStr}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{releaseCountdown.days}</div>
                <div className="text-xs text-purple-300">{t('room.days_left')}</div>
              </div>
            </div>
          )}

          <div className="panel p-6 md:p-10">
            {/* Title & location */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Category: puzzles / with an actor / horror (convex/roomCategories.ts) */}
                {(() => {
                  const cat = categoryOf(room as any);
                  const tone = cat === 'horror' ? 'border-red-600/70 text-red-400' : cat === 'puzzle_actor' ? 'border-amber-500/60 text-amber-300' : 'border-sky-500/50 text-sky-300';
                  const Icon = cat === 'horror' ? Skull : cat === 'puzzle_actor' ? VenetianMask : KeyRound;
                  return (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-sm border flex items-center gap-1 ${tone}`}>
                      <Icon className="w-3 h-3" /> {t(`cat.${cat}`)}
                    </span>
                  );
                })()}
                {/* Its subcategories */}
                {subthemesOf(room as any).map((th) => (
                  <span key={th} className="font-type text-[11px] tracking-[0.18em] uppercase px-2 py-0.5 rounded-sm border border-brand-red/50 text-brand-red-light">
                    {themeLabel(t, th)}
                  </span>
                ))}
                {(room as any).isEarlyAccessPartner && (
                  <span className="bg-emerald-700/90 text-white text-xs font-bold px-2.5 py-1 rounded-sm flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> {t('badge.early_access')}
                  </span>
                )}
                {room.isNew && (
                  <span className="bg-brand-red text-brand-bone text-xs font-bold px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-[0_0_14px_rgba(var(--glow-hi),0.5)]">
                    <Zap className="w-3 h-3" /> {t('featured.new')}
                  </span>
                )}
                {room.isTrending && (
                  <span className="bg-black/80 border border-brand-gold/60 text-brand-gold text-xs font-bold px-2.5 py-1 rounded-sm">
                    {t('featured.trending')}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-black leading-[1.05] text-brand-bone text-balance mb-3 [text-shadow:0_2px_0_rgba(0,0,0,0.8),0_0_30px_rgba(var(--glow),0.18)]">
                {room.title}
              </h1>
              {(room as any).companyName && (
                <div className="flex items-center gap-1.5 text-sm text-brand-text-secondary mb-2">
                  {(room as any).isEarlyAccessPartner && <BadgeCheck className="w-4 h-4 text-emerald-400" />}
                  <span>{t('room.by_company')} {(room as any).companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-brand-text-secondary">
                <MapPin className="w-4 h-4" />
                <span>{room.location}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-8 overflow-hidden rounded-md border border-brand-border bg-brand-border">
              <div className="bg-brand-dark p-4 text-center">
                <Star className={`w-5 h-5 mx-auto mb-1.5 ${shown ? 'text-brand-gold fill-brand-gold' : 'text-brand-text-muted'}`} />
                <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{shown ? formatRating(shown.rating) : '—'}</div>
                <div className="text-xs text-brand-text-muted mt-0.5">
                  {shown?.source ? (
                    shown.url ? (
                      <a href={shown.url} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-dotted underline-offset-2 hover:text-brand-text">
                        {t('room.reviews_on', { count: shown.count.toLocaleString(), source: shown.source })}
                      </a>
                    ) : (
                      t('room.reviews_on', { count: shown.count.toLocaleString(), source: shown.source })
                    )
                  ) : (
                    <>{shown?.count ?? 0} {t('featured.reviews')}</>
                  )}
                </div>
              </div>
              <div className="bg-brand-dark p-4 text-center">
                <Clock className="w-5 h-5 text-brand-red-light mx-auto mb-1.5" />
                <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{room.duration} {t('featured.min')}</div>
                <div className="text-xs text-brand-text-muted mt-0.5">{t('room.duration')}</div>
              </div>
              <div className="bg-brand-dark p-4 text-center">
                <Users className="w-5 h-5 text-brand-red-light mx-auto mb-1.5" />
                <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{room.players}</div>
                <div className="text-xs text-brand-text-muted mt-0.5">{t('room.players')}</div>
              </div>
              <div className="bg-brand-dark p-4 text-center">
                <div className="flex justify-center gap-0.5 mb-1.5 h-5 items-center" aria-hidden>
                  {Array.from({ length: room.maxDifficulty || 5 }).map((_, i) => (
                    <Skull
                      key={i}
                      className={`w-4 h-4 ${
                        i < room.difficulty ? 'text-brand-red-light drop-shadow-[0_0_4px_rgba(var(--glow-hi),0.8)]' : 'text-brand-border'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{room.difficulty}/{room.maxDifficulty}</div>
                <div className="text-xs text-brand-text-muted mt-0.5">{t('featured.difficulty')}</div>
              </div>
            </div>

            {/* Tags */}
            {room.tags && room.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {room.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 rounded-sm bg-brand-red/10 text-brand-red-light border border-brand-red/25"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Story */}
            {room.story && (
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-xl font-display font-bold text-brand-bone mb-3">
                  <BookOpen className="w-5 h-5 text-brand-red-light" />
                  {t('room.the_story')}
                </h3>
                <p className="border-l-2 border-brand-red/60 pl-4 font-display text-lg text-brand-text leading-relaxed italic text-pretty">
                  &ldquo;{(room as any).storyTranslations?.[language] || (room as any).storyTranslations?.en || room.story}&rdquo;
                </p>
              </div>
            )}

            {/* Trailer */}
            {trailer && (
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-display font-bold text-brand-bone mb-3">
                  <PlayCircle className="w-5 h-5 text-brand-red-light" />
                  {t('room.trailer')}
                </h3>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-brand-border bg-black">
                  <iframe
                    src={trailer}
                    title={`${room.title} – ${t('room.trailer')}`}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {room.description && (
              <div className="mb-8">
                <h3 className="text-xl font-display font-bold text-brand-bone mb-3">{t('room.about')}</h3>
                <p className="text-brand-text-secondary leading-relaxed text-pretty max-w-[70ch]">
                  {(room as any).descriptionTranslations?.[language] || (room as any).descriptionTranslations?.en || room.description}
                </p>
              </div>
            )}

            {/* Price & Book */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-brand-border pt-6">
              {BOOKING_ENABLED ? (
              <div>
                <div className="text-sm text-brand-text-muted">{t('room.starting_from')}</div>
                <div className="text-4xl font-display font-black text-brand-bone tabular-nums">
                  €{room.price}
                  <span className="text-base font-normal text-brand-text-muted">{t('featured.per_person')}</span>
                </div>
                {room.pricePerGroup && room.pricePerGroup.length > 0 && (
                  <div className="text-xs text-brand-text-muted mt-1">
                    {t('room.group_pricing')}
                  </div>
                )}
              </div>
              ) : <div />}
              <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                <BookNowButton roomId={roomId} target={(room as any).bookingTarget} />
                {!BOOKING_ENABLED && (room as any).bookingTarget?.kind === 'url' && (
                  <span className="text-xs text-brand-text-muted text-center sm:text-right">
                    {t('room.book_on_site', { company: (room as any).companyName || '' })}
                  </span>
                )}
              </div>
            </div>

            {/* Per-group pricing */}
            {BOOKING_ENABLED && room.pricePerGroup && room.pricePerGroup.length > 0 && (
              <div className="mt-6 border-t border-brand-border pt-6">
                <h4 className="text-sm font-semibold mb-3">{t('room.price_per_group')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {room.pricePerGroup.map((pg: any) => (
                    <div
                      key={pg.players}
                      className="bg-brand-dark border border-brand-border rounded-md p-3 text-center"
                    >
                      <div className="text-xs text-brand-text-muted">
                        {pg.players} {t('common.players')}
                      </div>
                      <div className="text-sm font-bold">€{pg.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <RoomMerchStrip roomId={roomId} />

          <InstagramStrip companyId={(room as any).companyId} />

          {/* ═══ Reviews Section ═══ */}
          <div className="panel p-6 md:p-10 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="flex items-center gap-2 text-xl font-display font-bold text-brand-bone">
                <MessageSquare className="w-5 h-5 text-brand-red-light" />
                {t('reviews.title')}
                {reviews && reviews.length > 0 && (
                  <span className="font-sans text-sm font-normal text-brand-text-muted tabular-nums">
                    ({reviews.length})
                  </span>
                )}
              </h3>
              {canReviewData?.canReview && !reviewSuccess && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-primary text-sm py-2 px-4"
                >
                  {t('reviews.write_review')}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && canReviewData?.canReview && !reviewSuccess && (
              <div className="mb-8 p-5 bg-brand-dark rounded-md border border-brand-border">
                <h4 className="font-display text-lg font-bold text-brand-bone mb-4">{t('reviews.write_review')}</h4>

                {/* Star Rating */}
                <div className="mb-4">
                  <label className="text-sm text-brand-text-secondary mb-2 block">
                    {t('reviews.your_rating')}
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(star)}
                        aria-label={`${star}/5`}
                        aria-pressed={reviewRating === star}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (reviewHover || reviewRating)
                              ? 'text-brand-gold fill-brand-gold drop-shadow-[0_0_6px_rgba(201,154,46,0.6)]'
                              : 'text-brand-border'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div className="mb-4">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={t('reviews.your_review')}
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  disabled={reviewRating === 0 || reviewSubmitting}
                  onClick={async () => {
                    if (!user || !canReviewData?.canReview || reviewRating === 0) return;
                    setReviewSubmitting(true);
                    setReviewError('');
                    try {
                      const res = await submitReview({
                        sessionToken: user.sessionToken,
                        roomId: roomId as any,
                        bookingId: (canReviewData.bookingId ?? undefined) as any,
                        rating: reviewRating,
                        text: reviewText.trim() || undefined,
                      });
                      setReviewPending(!!res?.pending);
                      setReviewSuccess(true);
                      setShowReviewForm(false);
                    } catch (err) {
                      setReviewError(friendlyReviewError(err));
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }}
                  className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Star className="w-4 h-4" />
                  )}
                  {reviewSubmitting ? t('reviews.submitting') : t('reviews.submit')}
                </button>
                {reviewError && <p className="mt-3 text-sm text-brand-red-light">{reviewError}</p>}
              </div>
            )}

            {/* Success Message */}
            {reviewSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-md flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-medium">{reviewPending ? t('reviews.pending') : t('reviews.success')}</span>
              </div>
            )}

            {/* Why the player can't write one: signed out, email not confirmed, or theirs is waiting */}
            {!reviewSuccess && canReviewData && !canReviewData.canReview && canReviewData.reason !== 'reviewed' && (
              <p className="mb-6 text-sm text-brand-text-secondary flex items-start gap-2">
                <BadgeCheck className="w-4 h-4 text-brand-red-light shrink-0 mt-0.5" />
                {canReviewData.reason === 'pending' ? (
                  t('reviews.waiting')
                ) : canReviewData.reason === 'need_email' ? (
                  t('reviews.need_email')
                ) : (
                  <span>
                    <Link href="/login" className="text-brand-red-light hover:underline">{t('reviews.login_link')}</Link> {t('reviews.login_rest')}
                  </span>
                )}
              </p>
            )}

            {/* Reviews List */}
            {!reviews ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-md border border-dashed border-brand-border py-10 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-brand-border mx-auto mb-3" />
                <p className="text-brand-text-secondary">{t('reviews.no_reviews')}</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-brand-border/70 border-y border-brand-border/70">
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review: any) => {
                    const timeAgo = (() => {
                      const diff = Date.now() - review.createdAt;
                      const mins = Math.floor(diff / 60000);
                      const hours = Math.floor(diff / 3600000);
                      const days = Math.floor(diff / 86400000);
                      if (days > 0) return t('reviews.ago_days', { count: String(days) });
                      if (hours > 0) return t('reviews.ago_hours', { count: String(hours) });
                      if (mins > 0) return t('reviews.ago_minutes', { count: String(mins) });
                      return t('reviews.just_now');
                    })();

                    return (
                      <div
                        key={review._id}
                        className="py-5"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {review.user.avatar ? (
                            <img
                              src={review.user.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-brand-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border border-brand-red/40 bg-brand-red/15 flex items-center justify-center font-display text-base font-bold text-brand-red-light">
                              {review.user.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-brand-bone truncate">
                                {review.user.name}
                              </span>
                              <span className="flex shrink-0 items-center gap-1 text-[11px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                                <CheckCircle className="w-3 h-3" />
                                {t('reviews.verified')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-0.5" role="img" aria-label={`${review.rating}/5`}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= review.rating
                                        ? 'text-brand-gold fill-brand-gold'
                                        : 'text-brand-border'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-brand-text-muted">
                                {timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.text && (
                          <p className="text-[15px] text-brand-text leading-relaxed mt-3 sm:pl-[52px] text-pretty">
                            {review.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Show more / less */}
                {reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="mt-5 w-full py-2.5 text-sm font-medium text-brand-text-secondary hover:text-brand-bone bg-black/30 rounded-md border border-brand-border hover:border-brand-red/60 hover:bg-brand-red/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    {showAllReviews ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        {t('reviews.show_less')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {t('reviews.show_more', { count: String(reviews.length) })}
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
