'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  Bell,
  Ticket,
  XCircle,
  Clock,
  Tag,
  Info,
  CalendarCheck,
  CheckCheck,
  DoorOpen,
  UserPlus,
  UserCheck,
  Users,
  Check,
  X,
} from 'lucide-react';

const typeIcons: Record<string, any> = {
  booking: Ticket,
  cancelled: XCircle,
  reminder: Clock,
  promo: Tag,
  system: Info,
  slot_available: CalendarCheck,
  new_room: DoorOpen,
  photos_ready: DoorOpen,
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  booking_invite: Users,
};

const typeColors: Record<string, string> = {
  booking: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  reminder: 'bg-yellow-500/20 text-yellow-400',
  promo: 'bg-purple-500/20 text-purple-400',
  system: 'bg-blue-500/20 text-blue-400',
  slot_available: 'bg-cyan-500/20 text-cyan-400',
  new_room: 'bg-brand-red/20 text-brand-red',
  photos_ready: 'bg-purple-500/20 text-purple-400',
  friend_request: 'bg-sky-500/20 text-sky-400',
  friend_accepted: 'bg-green-500/20 text-green-400',
  booking_invite: 'bg-amber-500/20 text-amber-400',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const notifications = useQuery(
    api.notifications.getByUser,
    user?.id ? { userId: user.id as any } : 'skip'
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Friend & booking invite actions
  const acceptFriend = useMutation(api.friends.acceptRequest);
  const declineFriend = useMutation(api.friends.declineRequest);
  const respondBookingInvite = useMutation(api.friends.respondToBookingInvite);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<Record<string, string>>({});

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

  const unreadCount = notifications?.filter((n: any) => !n.read).length ?? 0;

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await markAllRead({ userId: user.id as any });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead({ id: id as any });
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('notifications.just_now');
    if (mins < 60) return t('notifications.minutes_ago', { count: String(mins) });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('notifications.hours_ago', { count: String(hours) });
    const days = Math.floor(hours / 24);
    return t('notifications.days_ago', { count: String(days) });
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="section-heading mb-2">
                {t('notifications.title')}
              </h1>
              <p className="text-brand-text-secondary">
                {unreadCount > 0
                  ? t('notifications.unread_count', { count: String(unreadCount) })
                  : t('notifications.all_caught_up')}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn-ghost text-sm flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                {t('notifications.mark_all_read')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* List */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {!notifications ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
              <p className="text-brand-text-muted">{t('notifications.loading')}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-16 h-16 text-brand-border mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('notifications.no_notifications')}</h3>
              <p className="text-brand-text-muted">
                {t('notifications.no_notifications_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any) => {
                const Icon = typeIcons[n.type] || Bell;
                const color = typeColors[n.type] || 'bg-brand-surface text-brand-text-muted';
                const isFriendRequest = n.type === 'friend_request' && n.data?.friendshipId;
                const isBookingInvite = n.type === 'booking_invite' && n.data?.bookingInviteId;
                const hasAction = isFriendRequest || isBookingInvite;
                const doneAction = actionDone[n._id];

                const handleFriendAction = async (action: 'accept' | 'decline') => {
                  if (!user?.id || !n.data?.friendshipId) return;
                  setActionLoading(n._id + action);
                  try {
                    if (action === 'accept') {
                      await acceptFriend({ friendshipId: n.data.friendshipId, userId: user.id as any });
                    } else {
                      await declineFriend({ friendshipId: n.data.friendshipId, userId: user.id as any });
                    }
                    setActionDone((prev) => ({ ...prev, [n._id]: action }));
                    if (!n.read) await markAsRead({ id: n._id });
                  } catch (err) {
                    console.error(err);
                  }
                  setActionLoading(null);
                };

                const handleBookingInviteAction = async (action: 'accepted' | 'declined') => {
                  if (!user?.id || !n.data?.bookingInviteId) return;
                  setActionLoading(n._id + action);
                  try {
                    await respondBookingInvite({
                      inviteId: n.data.bookingInviteId,
                      userId: user.id as any,
                      response: action,
                    });
                    setActionDone((prev) => ({ ...prev, [n._id]: action }));
                    if (!n.read) await markAsRead({ id: n._id });
                  } catch (err) {
                    console.error(err);
                  }
                  setActionLoading(null);
                };

                return (
                  <div
                    key={n._id}
                    className={`w-full text-left card p-4 flex items-start gap-4 transition-all ${
                      n.read ? 'opacity-60' : 'border-brand-red/20'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{n.title}</h3>
                        <span className="text-xs text-brand-text-muted shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-brand-text-muted line-clamp-2">
                        {n.message}
                      </p>
                      {/* Friend Request Actions */}
                      {isFriendRequest && !doneAction && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleFriendAction('accept')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            {actionLoading === n._id + 'accept' ? (
                              <div className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            {t('friends.accept')}
                          </button>
                          <button
                            onClick={() => handleFriendAction('decline')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            {t('friends.decline')}
                          </button>
                        </div>
                      )}
                      {isFriendRequest && doneAction === 'accept' && (
                        <p className="text-xs text-green-400 mt-2">{t('friends.request_accepted')}</p>
                      )}
                      {isFriendRequest && doneAction === 'decline' && (
                        <p className="text-xs text-brand-text-muted mt-2">{t('friends.request_declined')}</p>
                      )}
                      {/* Booking Invite Actions */}
                      {isBookingInvite && !doneAction && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleBookingInviteAction('accepted')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            {actionLoading === n._id + 'accepted' ? (
                              <div className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            {t('friends.accept_invite')}
                          </button>
                          <button
                            onClick={() => handleBookingInviteAction('declined')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            {t('friends.decline_invite')}
                          </button>
                        </div>
                      )}
                      {isBookingInvite && doneAction === 'accepted' && (
                        <p className="text-xs text-green-400 mt-2">{t('friends.invite_accepted')}</p>
                      )}
                      {isBookingInvite && doneAction === 'declined' && (
                        <p className="text-xs text-brand-text-muted mt-2">{t('friends.invite_declined')}</p>
                      )}
                    </div>
                    {!n.read && !hasAction && (
                      <button
                        onClick={() => handleMarkRead(n._id)}
                        className="w-2.5 h-2.5 rounded-full bg-brand-red shrink-0 mt-1.5"
                      />
                    )}
                    {!n.read && hasAction && (
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-red shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
