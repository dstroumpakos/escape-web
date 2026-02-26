'use client';

import { Star, Clock, Users, Zap, DoorOpen } from 'lucide-react';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

interface RoomCardProps {
  title: string;
  theme: string;
  rating: number;
  reviews: number;
  duration: string;
  difficulty: number;
  maxDifficulty: number;
  players: string;
  price: number;
  image: string;
  isNew?: boolean;
  isTrending?: boolean;
}

const sampleRooms: RoomCardProps[] = [
  {
    title: 'The Haunted Mansion',
    theme: 'Horror',
    rating: 4.8,
    reviews: 142,
    duration: '60 min',
    difficulty: 4,
    maxDifficulty: 5,
    players: '2-6',
    price: 25,
    image: '',
    isTrending: true,
  },
  {
    title: 'Prison Break',
    theme: 'Adventure',
    rating: 4.9,
    reviews: 203,
    duration: '75 min',
    difficulty: 5,
    maxDifficulty: 5,
    players: '3-8',
    price: 30,
    image: '',
    isNew: true,
  },
  {
    title: 'The Da Vinci Code',
    theme: 'Mystery',
    rating: 4.7,
    reviews: 98,
    duration: '60 min',
    difficulty: 3,
    maxDifficulty: 5,
    players: '2-5',
    price: 22,
    image: '',
  },
  {
    title: 'Zombie Apocalypse',
    theme: 'Horror',
    rating: 4.6,
    reviews: 167,
    duration: '60 min',
    difficulty: 4,
    maxDifficulty: 5,
    players: '4-8',
    price: 28,
    image: '',
    isTrending: true,
  },
  {
    title: 'Egyptian Tomb',
    theme: 'History',
    rating: 4.9,
    reviews: 256,
    duration: '90 min',
    difficulty: 5,
    maxDifficulty: 5,
    players: '2-6',
    price: 35,
    image: '',
    isNew: true,
  },
  {
    title: 'Cyber Heist',
    theme: 'Sci-Fi',
    rating: 4.5,
    reviews: 78,
    duration: '60 min',
    difficulty: 3,
    maxDifficulty: 5,
    players: '2-4',
    price: 20,
    image: '',
  },
];

function DifficultyDots({ level, max }: { level: number; max: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < level ? 'bg-brand-red' : 'bg-brand-border'
          }`}
        />
      ))}
    </div>
  );
}

function RoomCard({ room }: { room: RoomCardProps }) {
  const { t } = useTranslation();
  const themeColors: Record<string, string> = {
    Horror: 'bg-red-900/30 text-red-400',
    Adventure: 'bg-amber-900/30 text-amber-400',
    Mystery: 'bg-purple-900/30 text-purple-400',
    History: 'bg-yellow-900/30 text-yellow-400',
    'Sci-Fi': 'bg-cyan-900/30 text-cyan-400',
  };

  return (
    <div className="card-hover group cursor-pointer">
      {/* Image placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-brand-surface to-brand-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-card/80 to-transparent z-10" />
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <DoorOpen className="w-16 h-16 text-brand-border/30 group-hover:text-brand-red/20 transition-colors duration-500" />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {room.isNew && (
            <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> {t('featured.new')}
            </span>
          )}
          {room.isTrending && (
            <span className="bg-brand-gold text-black text-xs font-bold px-2.5 py-1 rounded-full">
              {t('featured.trending')}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-brand-card/90 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-brand-border/50">
            €{room.price}
            <span className="text-brand-text-muted font-normal text-xs">{t('featured.per_person')}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Theme tag */}
        <span
          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3 ${
            themeColors[room.theme] || 'bg-brand-surface text-brand-text-secondary'
          }`}
        >
          {room.theme}
        </span>

        <h3 className="text-lg font-semibold mb-2 group-hover:text-brand-red transition-colors">
          {room.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />
          <span className="text-sm font-medium">{room.rating}</span>
          <span className="text-sm text-brand-text-muted">({room.reviews} {t('featured.reviews')})</span>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-brand-text-secondary">
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
            <DifficultyDots level={room.difficulty} max={room.maxDifficulty} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturedRooms() {
  const { t } = useTranslation();
  const convexRooms = useSafeQuery<any[]>(api.rooms.list);

  // Map Convex rooms to our card format, fallback to sample data
  const rooms: RoomCardProps[] =
    convexRooms && convexRooms.length > 0
      ? convexRooms.slice(0, 6).map((r: any) => ({
          title: r.title || 'Untitled Room',
          theme: r.theme || 'Mystery',
          rating: r.rating ?? 0,
          reviews: r.reviews ?? 0,
          duration: typeof r.duration === 'number' ? `${r.duration} min` : r.duration || '60 min',
          difficulty: r.difficulty ?? 3,
          maxDifficulty: r.maxDifficulty ?? 5,
          players: r.players || '2-6',
          price: r.price ?? 0,
          image: r.image || '',
          isNew: r.isNew,
          isTrending: r.isTrending,
        }))
      : sampleRooms;

  return (
    <section id="rooms" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="section-heading mb-4">
            {t('featured.title')} <span className="text-gradient">{t('featured.title_highlight')}</span>
          </h2>
          <p className="section-subheading mx-auto">
            {t('featured.subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {rooms.map((room, i) => (
            <RoomCard key={i} room={room} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="btn-outline">{t('featured.view_all')}</button>
        </div>
      </div>
    </section>
  );
}
