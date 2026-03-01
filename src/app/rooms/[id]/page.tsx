'use client';

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
} from 'lucide-react';

export default function RoomDetailsPage() {
  const params = useParams();
  const roomId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');
  const toggleWishlist = useMutation(api.users.toggleWishlist);

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
        </div>
      </section>
    </>
  );
}
