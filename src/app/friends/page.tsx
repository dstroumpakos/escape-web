'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
  ChevronRight,
  Trash2,
  Mail,
} from 'lucide-react';

export default function FriendsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const friends = useQuery(
    api.friends.listFriends,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const pendingRequests = useQuery(
    api.friends.pendingRequests,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const searchResults = useQuery(
    api.friends.searchUsers,
    user?.id && searchTerm.trim().length >= 2
      ? { currentUserId: user.id as any, searchTerm }
      : 'skip'
  );

  const sendRequest = useMutation(api.friends.sendRequest);
  const acceptRequest = useMutation(api.friends.acceptRequest);
  const declineRequest = useMutation(api.friends.declineRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

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

  const handleSendRequest = async (receiverId: string) => {
    setActionLoading(receiverId);
    try {
      await sendRequest({
        requesterId: user.id as any,
        receiverId: receiverId as any,
      });
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleAccept = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      await acceptRequest({
        friendshipId: friendshipId as any,
        userId: user.id as any,
      });
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleDecline = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      await declineRequest({
        friendshipId: friendshipId as any,
        userId: user.id as any,
      });
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleRemove = async (friendshipId: string) => {
    if (!confirm(t('friends.confirm_remove'))) return;
    setActionLoading(friendshipId);
    try {
      await removeFriend({
        friendshipId: friendshipId as any,
        userId: user.id as any,
      });
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const pendingCount = pendingRequests?.length ?? 0;

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="section-heading mb-2">{t('friends.title')}</h1>
          <p className="text-brand-text-secondary">{t('friends.subtitle')}</p>
        </div>
      </section>

      {/* Tabs */}
      <section className="pb-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'friends'
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface/80'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1.5" />
              {t('friends.my_friends')} ({friends?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${
                activeTab === 'requests'
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface/80'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-1.5" />
              {t('friends.requests')}
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface/80'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1.5" />
              {t('friends.find_friends')}
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Friends List ── */}
          {activeTab === 'friends' && (
            <>
              {!friends ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 text-brand-border mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('friends.no_friends')}</h3>
                  <p className="text-brand-text-muted mb-4">{t('friends.no_friends_desc')}</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="btn-primary"
                  >
                    <UserPlus className="w-4 h-4 mr-2 inline" />
                    {t('friends.find_friends')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend: any) => (
                    <div
                      key={friend._id}
                      className="card p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-border/30 flex items-center justify-center overflow-hidden shrink-0">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-brand-red">
                            {friend.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{friend.name}</h3>
                        <p className="text-xs text-brand-text-muted truncate">
                          {friend.title && t(`profile.${friend.title}`)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(friend.friendshipId)}
                        disabled={actionLoading === friend.friendshipId}
                        className="p-2 rounded-lg text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={t('friends.remove')}
                      >
                        {actionLoading === friend.friendshipId ? (
                          <div className="w-4 h-4 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Pending Requests ── */}
          {activeTab === 'requests' && (
            <>
              {!pendingRequests ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-20">
                  <Mail className="w-16 h-16 text-brand-border mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('friends.no_requests')}</h3>
                  <p className="text-brand-text-muted">{t('friends.no_requests_desc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((req: any) => (
                    <div
                      key={req.friendshipId}
                      className="card p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-border/30 flex items-center justify-center overflow-hidden shrink-0">
                        {req.avatar ? (
                          <img
                            src={req.avatar}
                            alt={req.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-brand-red">
                            {req.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{req.name}</h3>
                        <p className="text-xs text-brand-text-muted">
                          {t('friends.wants_to_be_friend')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req.friendshipId)}
                          disabled={actionLoading === req.friendshipId}
                          className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          title={t('friends.accept')}
                        >
                          {actionLoading === req.friendshipId ? (
                            <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDecline(req.friendshipId)}
                          disabled={actionLoading === req.friendshipId}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title={t('friends.decline')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Search / Find Friends ── */}
          {activeTab === 'search' && (
            <>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('friends.search_placeholder')}
                    className="input-field pl-12 w-full"
                    autoFocus
                  />
                </div>
              </div>

              {searchTerm.trim().length < 2 ? (
                <div className="text-center py-20">
                  <Search className="w-16 h-16 text-brand-border mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('friends.search_title')}</h3>
                  <p className="text-brand-text-muted">{t('friends.search_desc')}</p>
                </div>
              ) : !searchResults ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-20">
                  <UserX className="w-16 h-16 text-brand-border mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('friends.no_results')}</h3>
                  <p className="text-brand-text-muted">{t('friends.no_results_desc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((u: any) => (
                    <div
                      key={u._id}
                      className="card p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-border/30 flex items-center justify-center overflow-hidden shrink-0">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-brand-red">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{u.name}</h3>
                        <p className="text-xs text-brand-text-muted truncate">
                          {u.title && t(`profile.${u.title}`)}
                        </p>
                      </div>

                      {u.friendshipStatus === 'friends' ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full">
                          <UserCheck className="w-3.5 h-3.5" />
                          {t('friends.already_friends')}
                        </span>
                      ) : u.friendshipStatus === 'request_sent' ? (
                        <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          {t('friends.request_sent')}
                        </span>
                      ) : u.friendshipStatus === 'request_received' ? (
                        <span className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full">
                          <Mail className="w-3.5 h-3.5" />
                          {t('friends.request_received')}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u._id)}
                          disabled={actionLoading === u._id}
                          className="flex items-center gap-1.5 text-xs bg-brand-red/10 text-brand-red hover:bg-brand-red/20 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {actionLoading === u._id ? (
                            <div className="w-3.5 h-3.5 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          {t('friends.add_friend')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
