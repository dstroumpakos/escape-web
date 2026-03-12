'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  Star,
  Clock,
  Users,
  MapPin,
  Heart,
  ArrowLeft,
  DoorOpen,
  Zap,
  BookOpen,
  Shield,
  Diamond,
  CalendarClock,
  BadgeCheck,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function RoomDetailsPage() {
  const params = useParams();
  const roomId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');
  const toggleWishlist = useMutation(api.users.toggleWishlist);

  // Reviews
  const reviews = useQuery(api.reviews.getByRoom, roomId ? { roomId: roomId as any } : 'skip');
  const canReviewData = useQuery(
    api.reviews.canReview,
    isAuthenticated && user?.id && roomId
      ? { userId: user.id as any, roomId: roomId as any }
      : 'skip'
  );
  const submitReview = useMutation(api.reviews.submit);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showTestPopup, setShowTestPopup] = useState(true);

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

  const handleWishlist = async () => {
    if (!isAuthenticated || !user) return;
    try {
      await toggleWishlist({ userId: user.id as any, roomId: roomId as any });
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };

  return (
    <>
      {/* Test Room Popup */}
      {showTestPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-brand-card border border-yellow-500/30 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <button
                onClick={() => setShowTestPopup(false)}
                className="p-1.5 rounded-lg hover:bg-brand-surface transition-colors text-brand-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-display font-bold mb-2 text-yellow-400">{t('room.test_popup_title')}</h2>
            <p className="text-brand-text-secondary text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: t('room.test_popup_desc') }} />
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-6">
              <p className="text-xs text-yellow-300 flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" />
                {t('room.test_popup_notice')}
              </p>
            </div>
            <button
              onClick={() => setShowTestPopup(false)}
              className="w-full py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold rounded-xl border border-yellow-500/30 transition-colors"
            >
              {t('room.test_popup_button')}
            </button>
          </div>
        </div>
      )}

      {/* Hero Image */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {room.image ? (
          <img
            src={room.image}
            alt={room.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-surface to-brand-card flex items-center justify-center">
            <DoorOpen className="w-24 h-24 text-brand-border/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-24 left-4 z-20">
          <Link
            href="/discover"
            className="flex items-center gap-2 bg-brand-card/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-brand-border/50 text-sm hover:border-brand-red/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('room.back')}
          </Link>
        </div>

        {/* Wishlist */}
        {isAuthenticated && (
          <button
            onClick={handleWishlist}
            className="absolute top-24 right-4 z-20 w-11 h-11 bg-brand-card/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-brand-border/50 hover:border-brand-red/30 transition-all"
          >
            <Heart
              className={`w-5 h-5 ${
                isWishlisted ? 'fill-brand-red text-brand-red' : 'text-white'
              }`}
            />
          </button>
        )}

        {/* Badges */}
        <div className="absolute bottom-6 left-4 z-20 flex gap-2">
          {(room as any).isEarlyAccessPartner && (
            <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" /> {t('badge.early_access')}
            </span>
          )}
          {room.isNew && (
            <span className="bg-brand-red text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> {t('featured.new')}
            </span>
          )}
          {room.isTrending && (
            <span className="bg-brand-gold text-black text-xs font-bold px-3 py-1.5 rounded-full">
              {t('featured.trending')}
            </span>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 -mt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Countdown Banner */}
          {releaseCountdown && (
            <div className="mb-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl border border-purple-500/20 p-5 flex items-center gap-4">
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

          <div className="card p-6 md:p-8">
            {/* Title & location */}
            <div className="mb-6">
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3 bg-brand-surface text-brand-text-secondary">
                {room.theme}
              </span>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-brand-surface rounded-xl p-4 text-center">
                <Star className="w-5 h-5 text-brand-gold fill-brand-gold mx-auto mb-1" />
                <div className="text-lg font-bold">{room.rating}</div>
                <div className="text-xs text-brand-text-muted">{room.reviews} {t('featured.reviews')}</div>
              </div>
              <div className="bg-brand-surface rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-lg font-bold">{room.duration} {t('featured.min')}</div>
                <div className="text-xs text-brand-text-muted">{t('room.duration')}</div>
              </div>
              <div className="bg-brand-surface rounded-xl p-4 text-center">
                <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold">{room.players}</div>
                <div className="text-xs text-brand-text-muted">{t('room.players')}</div>
              </div>
              <div className="bg-brand-surface rounded-xl p-4 text-center">
                <Shield className="w-5 h-5 text-brand-red mx-auto mb-1" />
                <div className="text-lg font-bold">{room.difficulty}/{room.maxDifficulty}</div>
                <div className="text-xs text-brand-text-muted">{t('featured.difficulty')}</div>
              </div>
            </div>

            {/* Difficulty dots */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-brand-text-secondary">{t('featured.difficulty')}:</span>
              <div className="flex gap-1">
                {Array.from({ length: room.maxDifficulty || 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < room.difficulty ? 'bg-brand-red' : 'bg-brand-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            {room.tags && room.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {room.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Story */}
            {room.story && (
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <BookOpen className="w-5 h-5 text-brand-red" />
                  {t('room.the_story')}
                </h3>
                <p className="text-brand-text-secondary leading-relaxed italic">
                  &ldquo;{room.story}&rdquo;
                </p>
              </div>
            )}

            {/* Description */}
            {room.description && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">{t('room.about')}</h3>
                <p className="text-brand-text-secondary leading-relaxed">
                  {room.description}
                </p>
              </div>
            )}

            {/* Price & Book */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-brand-border pt-6">
              <div>
                <div className="text-sm text-brand-text-muted">{t('room.starting_from')}</div>
                <div className="text-3xl font-display font-bold">
                  €{room.price}
                  <span className="text-base font-normal text-brand-text-muted">{t('featured.per_person')}</span>
                </div>
                {room.pricePerGroup && room.pricePerGroup.length > 0 && (
                  <div className="text-xs text-brand-text-muted mt-1">
                    {t('room.group_pricing')}
                  </div>
                )}
              </div>
              <Link
                href={`/rooms/${roomId}/book`}
                className="btn-primary flex items-center gap-2"
              >
                {t('room.book_now')}
                <DoorOpen className="w-5 h-5" />
              </Link>
            </div>

            {/* Per-group pricing */}
            {room.pricePerGroup && room.pricePerGroup.length > 0 && (
              <div className="mt-6 border-t border-brand-border pt-6">
                <h4 className="text-sm font-semibold mb-3">{t('room.price_per_group')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {room.pricePerGroup.map((pg: any) => (
                    <div
                      key={pg.players}
                      className="bg-brand-surface rounded-lg p-3 text-center"
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

          {/* ═══ Reviews Section ═══ */}
          <div className="card p-6 md:p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="w-5 h-5 text-brand-red" />
                {t('reviews.title')}
                {reviews && reviews.length > 0 && (
                  <span className="text-sm font-normal text-brand-text-muted">
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
              <div className="mb-8 p-5 bg-brand-surface rounded-2xl border border-white/5">
                <h4 className="font-semibold mb-4">{t('reviews.write_review')}</h4>

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
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (reviewHover || reviewRating)
                              ? 'text-brand-gold fill-brand-gold'
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
                    className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-brand-text-muted focus:border-brand-red focus:outline-none resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  disabled={reviewRating === 0 || reviewSubmitting}
                  onClick={async () => {
                    if (!user || !canReviewData?.bookingId || reviewRating === 0) return;
                    setReviewSubmitting(true);
                    try {
                      await submitReview({
                        userId: user.id as any,
                        roomId: roomId as any,
                        bookingId: canReviewData.bookingId as any,
                        rating: reviewRating,
                        text: reviewText.trim() || undefined,
                      });
                      setReviewSuccess(true);
                      setShowReviewForm(false);
                    } catch (err) {
                      console.error('Review failed:', err);
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
              </div>
            )}

            {/* Success Message */}
            {reviewSuccess && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-green-400 font-medium">{t('reviews.success')}</span>
              </div>
            )}

            {/* Reviews List */}
            {!reviews ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-brand-text-muted py-8">
                {t('reviews.no_reviews')}
              </p>
            ) : (
              <>
                <div className="space-y-4">
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
                        className="p-4 bg-brand-surface rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {review.user.avatar ? (
                            <img
                              src={review.user.avatar}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-brand-red/20 flex items-center justify-center text-sm font-bold text-brand-red">
                              {review.user.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {review.user.name}
                              </span>
                              <span className="flex items-center gap-0.5 text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                                <CheckCircle className="w-2.5 h-2.5" />
                                {t('reviews.verified')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= review.rating
                                        ? 'text-brand-gold fill-brand-gold'
                                        : 'text-brand-border'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] text-brand-text-muted">
                                {timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.text && (
                          <p className="text-sm text-brand-text-secondary leading-relaxed mt-2 pl-12">
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
                    className="mt-4 w-full py-2.5 text-sm font-medium text-brand-text-secondary hover:text-white bg-brand-surface rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-1.5"
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
