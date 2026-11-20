'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams , useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { PostCard, type FeedPost } from '@/components/community/PostCard';

/** One Community post, for shared links. */
export default function PostPage() {

  // The community is for logged-in players only.
  const { isAuthenticated: loggedIn, isLoading: authLoading } = useAuth();
  const routerForGuard = useRouter();
  useEffect(() => {
    if (!authLoading && !loggedIn) routerForGuard.replace('/login');
  }, [authLoading, loggedIn, routerForGuard]);
  const params = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const post = useQuery(api.community.post, { postId: params.id as any, sessionToken: user?.sessionToken }) as FeedPost | null | undefined;
  return (
    <div className="max-w-[640px] mx-auto px-3 pt-24 pb-20">
      <Link href="/social" className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('cm.back')}
      </Link>
      {post === undefined ? (
        <div className="panel h-64 animate-pulse" />
      ) : post === null ? (
        <p className="panel p-10 text-center text-brand-text-secondary">{t('cm.post_gone')}</p>
      ) : (
        <PostCard post={post} />
      )}
    </div>
  );
}
