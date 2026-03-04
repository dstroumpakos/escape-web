'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import {
  User,
  Mail,
  DoorOpen,
  Trophy,
  Award,
  Heart,
  Star,
  Settings,
  LogOut,
  Camera,
  Globe,
  ChevronRight,
  Shield,
  Diamond,
  Users,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { t } = useTranslation();
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState('');

  const convexUser = useQuery(
    api.users.getById,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const badgesData = useQuery(
    api.badges.getUserBadges,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const userBadges = convexUser?.badges ?? [];
  const wishlist = convexUser?.wishlist ?? [];

  // Query wishlist rooms
  const allRooms = useQuery(api.rooms.list);
  const wishlistRooms = allRooms?.filter((r: any) => wishlist.includes(r._id)) ?? [];

  const updateProfile = useMutation(api.users.updateProfile);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  const profile = convexUser ?? user;

  const handleSaveName = async () => {
    if (!newName.trim() || !user?.id) return;
    try {
      await updateProfile({ userId: user.id as any, name: newName.trim() });
      setShowEditName(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Profile Header */}
      <section className="pt-28 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-red/10 via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Avatar */}
          <AnimateIn animation="scaleIn">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-brand-surface border-4 border-brand-red/30 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-brand-red">
                  {profile.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          </div>
          </AnimateIn>

          {/* Name & info */}
          <AnimateIn animation="fadeUp" delay={0.15}>
          <h1 className="text-2xl font-display font-bold mb-1">{profile.name}</h1>
          <p className="text-brand-text-muted text-sm mb-1">{profile.email}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
            {profile.title && (
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20">
                {t(`profile.${profile.title}`)}
              </span>
            )}
            {(convexUser as any)?.isPremium && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Diamond className="w-3 h-3" /> {t('profile.premium_badge')}
              </span>
            )}
          </div>
          {(profile as any).memberSince && (
            <p className="text-xs text-brand-text-muted">
              {t('profile.member_since')} {(profile as any).memberSince}
            </p>
          )}
          </AnimateIn>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="scaleUp" duration={0.7}>
          <div className="glass rounded-2xl p-6">
            <StaggerContainer stagger={0.1} className="grid grid-cols-3 gap-3 sm:gap-6">
              <StaggerItem animation="fadeUp">
              <div className="text-center">
                <DoorOpen className="w-5 h-5 text-brand-red mx-auto mb-1" />
                <div className="text-2xl font-display font-bold">{profile.played ?? 0}</div>
                <div className="text-xs text-brand-text-muted">{t('profile.rooms_played')}</div>
              </div>
              </StaggerItem>
              <StaggerItem animation="fadeUp">
              <div className="text-center">
                <Trophy className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <div className="text-2xl font-display font-bold">{profile.escaped ?? 0}</div>
                <div className="text-xs text-brand-text-muted">{t('profile.escaped')}</div>
              </div>
              </StaggerItem>
              <StaggerItem animation="fadeUp">
              <div className="text-center">
                <Award className="w-5 h-5 text-brand-gold mx-auto mb-1" />
                <div className="text-2xl font-display font-bold">{profile.awards ?? 0}</div>
                <div className="text-xs text-brand-text-muted">{t('profile.awards')}</div>
              </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
          </AnimateIn>
        </div>
      </section>

      {/* Badges */}
      <section className="pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="fadeUp">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-gold" />
            {t('profile.badges')}
          </h2>
          </AnimateIn>
          {badgesData && badgesData.length > 0 ? (
            <StaggerContainer stagger={0.08} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badgesData.map((badge: any) => {
                const pct = badge.threshold > 0
                  ? Math.min(100, Math.round((badge.progress / badge.threshold) * 100))
                  : 0;
                return (
                  <StaggerItem key={badge.key} animation="scaleUp">
                  <div
                    className={`card p-4 text-center transition-all ${
                      badge.earned
                        ? 'border-brand-gold/30 bg-brand-gold/5'
                        : 'opacity-60'
                    }`}
                  >
                    <span className={`text-3xl block mb-2 ${badge.earned ? '' : 'grayscale'}`}>
                      {badge.icon}
                    </span>
                    <div className="text-xs font-semibold mb-1">
                      {t(`leaderboard.badge_${badge.key}`)}
                    </div>
                    <div className="text-[10px] text-brand-text-muted mb-2">
                      {t(`leaderboard.badge_${badge.key}_desc`)}
                    </div>
                    {badge.earned ? (
                      <div className="text-[10px] text-brand-gold font-medium">
                        {badge.date}
                      </div>
                    ) : (
                      <div className="w-full bg-brand-bg rounded-full h-1.5 mt-1">
                        <div
                          className="bg-brand-red/60 h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    {!badge.earned && badge.threshold > 0 && (
                      <div className="text-[10px] text-brand-text-muted mt-1">
                        {badge.progress}/{badge.threshold}
                      </div>
                    )}
                  </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          ) : (
            <div className="card p-6 text-center">
              <Award className="w-8 h-8 text-brand-border mx-auto mb-2" />
              <p className="text-sm text-brand-text-muted">
                {t('profile.no_badges')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Wishlist */}
      <section className="pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-red" />
            {t('profile.wishlist')}
          </h2>
          {wishlistRooms.length > 0 ? (
            <div className="space-y-3">
              {wishlistRooms.map((room: any) => (
                <Link
                  key={room._id}
                  href={`/rooms/${room._id}`}
                  className="card p-4 flex items-center gap-4 hover:border-brand-red/30 block"
                >
                  <div className="w-16 h-16 rounded-xl bg-brand-surface flex items-center justify-center shrink-0 overflow-hidden">
                    {room.image ? (
                      <img src={room.image} alt={room.title} className="w-full h-full object-cover" />
                    ) : (
                      <DoorOpen className="w-6 h-6 text-brand-border" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{room.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                      <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                      {room.rating} · {room.theme}
                    </div>
                  </div>
                  <Heart className="w-5 h-5 fill-brand-red text-brand-red shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <Heart className="w-8 h-8 text-brand-border mx-auto mb-2" />
              <p className="text-sm text-brand-text-muted">
                {t('profile.no_wishlist')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Menu */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="fadeUp" delay={0.1}>
          <div className="card overflow-hidden divide-y divide-brand-border/30">
            <button
              onClick={() => {
                setNewName(profile.name || '');
                setShowEditName(!showEditName);
              }}
              className="flex items-center gap-4 w-full p-4 hover:bg-brand-surface/30 transition-colors text-left"
            >
              <User className="w-5 h-5 text-brand-text-muted" />
              <span className="flex-1">{t('profile.edit')}</span>
              <ChevronRight className="w-4 h-4 text-brand-text-muted" />
            </button>

            {showEditName && (
              <div className="p-4 bg-brand-surface/20">
                <label className="block text-sm text-brand-text-muted mb-2">{t('profile.name')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-field flex-1"
                  />
                  <button onClick={handleSaveName} className="btn-primary !py-3 !px-6">
                    {t('profile.save')}
                  </button>
                </div>
              </div>
            )}

            <Link
              href="/tickets"
              className="flex items-center gap-4 w-full p-4 hover:bg-brand-surface/30 transition-colors"
            >
              <DoorOpen className="w-5 h-5 text-brand-text-muted" />
              <span className="flex-1">{t('profile.my_bookings')}</span>
              <ChevronRight className="w-4 h-4 text-brand-text-muted" />
            </Link>

            <Link
              href="/friends"
              className="flex items-center gap-4 w-full p-4 hover:bg-brand-surface/30 transition-colors"
            >
              <Users className="w-5 h-5 text-brand-text-muted" />
              <span className="flex-1">{t('profile.friends')}</span>
              <ChevronRight className="w-4 h-4 text-brand-text-muted" />
            </Link>

            <Link
              href="/notifications"
              className="flex items-center gap-4 w-full p-4 hover:bg-brand-surface/30 transition-colors"
            >
              <Mail className="w-5 h-5 text-brand-text-muted" />
              <span className="flex-1">{t('profile.notifications')}</span>
              <ChevronRight className="w-4 h-4 text-brand-text-muted" />
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center gap-4 w-full p-4 hover:bg-brand-surface/30 transition-colors"
            >
              <Trophy className="w-5 h-5 text-brand-text-muted" />
              <span className="flex-1">{t('profile.leaderboard')}</span>
              <ChevronRight className="w-4 h-4 text-brand-text-muted" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full p-4 hover:bg-red-900/10 transition-colors text-left text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1">{t('profile.sign_out')}</span>
            </button>
          </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
