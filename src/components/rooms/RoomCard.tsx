'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Clock, Users, Zap, DoorOpen, BadgeCheck, Skull, Flame, MapPin } from 'lucide-react';
import { BOOKING_ENABLED } from '@/lib/features';
import { useTranslation } from '@/lib/i18n';
import { themeLabel } from '@/lib/roomThemes';
import { shownRating, formatRating } from '@/lib/roomMedia';

export interface RoomCardData {
  id?: string;
  title: string;
  theme: string;
  rating: number;
  reviews: number;
  /** Set when rating/reviews come from another site (e.g. "EscapeAll"). */
  ratingSource?: string;
  duration: string;
  difficulty: number;
  maxDifficulty: number;
  players: string;
  price: number;
  image: string;
  location?: string;
  isNew?: boolean;
  isTrending?: boolean;
  isEarlyAccessPartner?: boolean;
  companyName?: string;
}

/** Tag colour per stored theme value; anything else gets the neutral tag. */
const themeColors: Record<string, string> = {
  Horror: 'border-red-700/60 text-red-400',
  Thriller: 'border-rose-800/60 text-rose-400',
  Mystery: 'border-purple-800/60 text-purple-400',
  Detective: 'border-blue-800/60 text-blue-400',
  Puzzle: 'border-emerald-800/60 text-emerald-400',
  Adventure: 'border-amber-800/60 text-amber-400',
  Historical: 'border-yellow-800/60 text-yellow-400',
  History: 'border-yellow-800/60 text-yellow-400',
  'Sci-Fi': 'border-cyan-800/60 text-cyan-400',
  Science: 'border-green-800/60 text-green-400',
  Paranormal: 'border-indigo-800/60 text-indigo-400',
  Medieval: 'border-orange-800/60 text-orange-400',
  Fantasy: 'border-fuchsia-800/60 text-fuchsia-400',
  Comedy: 'border-yellow-700/60 text-yellow-300',
};

/** Map a Convex room document to the card's shape. */
export function toRoomCardData(r: any): RoomCardData {
  const shown = shownRating(r);
  return {
    id: r._id,
    title: r.title || 'Untitled Room',
    theme: r.theme || 'Mystery',
    rating: shown?.rating ?? 0,
    reviews: shown?.count ?? 0,
    ratingSource: shown?.source,
    duration: typeof r.duration === 'number' ? `${r.duration} min` : r.duration || '60 min',
    difficulty: r.difficulty ?? 3,
    maxDifficulty: r.maxDifficulty ?? 5,
    players: r.players || '2-6',
    price: r.price ?? 0,
    image: r.image || '',
    location: r.location,
    isNew: r.isNew,
    isTrending: r.isTrending,
    isEarlyAccessPartner: r.isEarlyAccessPartner,
    companyName: r.companyName,
  };
}

function DifficultySkulls({ level, max }: { level: number; max: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Skull
          key={i}
          className={`w-3.5 h-3.5 ${
            i < level ? 'text-brand-red-light drop-shadow-[0_0_4px_rgba(255,40,50,0.8)]' : 'text-brand-border'
          }`}
        />
      ))}
    </div>
  );
}

/** The one room card, used on the home page and on Discover. */
export function RoomCard({ room }: { room: RoomCardData }) {
  const { t } = useTranslation();
  // A dead image URL falls back to the door placeholder instead of a broken icon
  const [imageFailed, setImageFailed] = useState(false);

  const className = 'card-hover group flex h-full flex-col';
  const body = (
    <>
      {/* Image */}
      <div className="relative aspect-[16/10] bg-[radial-gradient(80%_70%_at_50%_60%,var(--color-brand-surface),var(--color-brand-bg))] overflow-hidden">
        {room.image && !imageFailed ? (
          <img
            src={room.image}
            alt={room.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover grayscale-[60%] contrast-110 brightness-[0.85] group-hover:grayscale-0 group-hover:brightness-95 group-hover:scale-105 transition-all duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DoorOpen className="w-16 h-16 text-brand-border/60 group-hover:text-brand-red/60 group-hover:animate-shake transition-colors duration-500" />
          </div>
        )}
        {/* Blood wash that seeps in on hover */}
        <div className="absolute inset-0 z-10 bg-brand-red mix-blend-multiply opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
        {/* VHS scanlines */}
        <div className="absolute inset-0 z-10 opacity-10 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.8)_0_1px,transparent_1px_3px)]" />
        <div className="absolute inset-0 bg-linear-to-t from-brand-card via-brand-card/30 to-transparent z-10" />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-24 z-20 flex flex-wrap gap-2">
          {room.isEarlyAccessPartner && (
            <span className="bg-emerald-700/90 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-sm flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" /> {t('badge.early_access')}
            </span>
          )}
          {room.isNew && (
            <span className="bg-brand-red text-brand-bone text-xs font-bold px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-[0_0_14px_rgba(255,40,50,0.6)]">
              <Zap className="w-3 h-3" /> {t('featured.new')}
            </span>
          )}
          {room.isTrending && (
            <span className="bg-black/80 border border-brand-gold/60 text-brand-gold text-xs font-bold px-2.5 py-1 rounded-sm flex items-center gap-1">
              <Flame className="w-3 h-3 animate-flicker-fast" /> {t('featured.trending')}
            </span>
          )}
        </div>

        {/* Price (only while UNLOCKED's own booking is on) */}
        {BOOKING_ENABLED && (
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-black/80 backdrop-blur-xs text-brand-bone text-sm font-bold px-3 py-1.5 rounded-sm border border-brand-red/40">
            €{room.price}
            <span className="text-brand-text-secondary font-normal text-xs">{t('featured.per_person')}</span>
          </span>
        </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <span
          className={`self-start font-type text-[11px] tracking-[0.18em] uppercase px-2 py-0.5 rounded-sm border mb-3 ${
            themeColors[room.theme] || 'border-brand-border text-brand-text-secondary'
          }`}
        >
          {themeLabel(t, room.theme)}
        </span>

        <h3 className="text-xl font-display font-bold mb-2 text-brand-bone group-hover:text-brand-red-light group-hover:text-blood-glow transition-colors">
          {room.title}
        </h3>

        {room.companyName && (
          <div className="flex items-center gap-1 text-xs text-brand-text-muted mb-1.5">
            {room.isEarlyAccessPartner && <BadgeCheck className="w-3 h-3 text-emerald-400" />}
            <span>{room.companyName}</span>
          </div>
        )}

        {room.location && (
          <div className="flex items-center gap-1.5 text-sm text-brand-text-muted mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{room.location}</span>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <Star className={`w-4 h-4 ${room.reviews > 0 ? 'text-brand-gold fill-brand-gold' : 'text-brand-text-muted'}`} />
          {room.reviews > 0 && <span className="text-sm font-medium">{formatRating(room.rating)}</span>}
          <span className="text-sm text-brand-text-muted truncate">
            (
            {room.ratingSource
              ? t('room.reviews_on', { count: room.reviews.toLocaleString(), source: room.ratingSource })
              : `${room.reviews} ${t('featured.reviews')}`}
            )
          </span>
        </div>

        {/* Meta */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-brand-border/70 pt-4 text-sm text-brand-text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {room.duration}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {room.players}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">{t('featured.difficulty')}</span>
            <DifficultySkulls level={room.difficulty} max={room.maxDifficulty} />
          </div>
        </div>
      </div>
    </>
  );

  return room.id ? (
    <Link href={`/rooms/${room.id}`} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
