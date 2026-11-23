'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Globe, Loader2, MapPin, UserPlus, UserCheck, DoorOpen, Users } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { RoomCard, toRoomCardData } from '@/components/rooms/RoomCard';
import { InstagramStrip } from '@/components/rooms/InstagramStrip';
import { CompanyLogo } from '@/components/companies/CompanyLogo';
import { JobCard } from '@/components/jobs/JobCard';
import type { PublicJob } from '@/lib/jobs';

/** A company's profile, for logged-in players: its rooms, and following it. */
export default function CompanyProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();
  const token = user?.sessionToken;
  const data = useQuery(api.companyPages.profile, token ? { companyId: id as any, sessionToken: token } : 'skip');
  const jobs = useQuery(api.jobs.byCompany, { companyId: id as any }) as PublicJob[] | undefined;
  const follow = useMutation(api.companyPages.follow);
  const unfollow = useMutation(api.companyPages.unfollow);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      try { sessionStorage.setItem('unlocked_after_login', `/companies/${id}`); } catch {}
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router, id]);

  if (data === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>;
  }
  if (data === null) {
    return (
      <section className="max-w-3xl mx-auto px-4 pt-28 pb-20 text-center">
        <p className="text-brand-text-secondary mb-6">{t('co.not_found')}</p>
        <Link href="/companies" className="btn-ghost inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> {t('co.back')}</Link>
      </section>
    );
  }

  const toggleFollow = async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      if (data.following) await unfollow({ sessionToken: token, companyId: data._id });
      else await follow({ sessionToken: token, companyId: data._id });
    } finally {
      setBusy(false);
    }
  };

  const site = /^https?:\/\//.test(data.website) ? data.website : '';

  return (
    <section className="max-w-6xl mx-auto px-4 pt-24 pb-20">
      <Link href="/companies" className="text-sm text-brand-text-secondary hover:text-white inline-flex items-center gap-1.5 mb-5">
        <ArrowLeft className="w-4 h-4" /> {t('co.back')}
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-brand-border bg-linear-to-br from-brand-surface via-brand-surface to-brand-red/10 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <CompanyLogo name={data.name} logo={data.logo} size={96} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bone">{data.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-brand-text-secondary">
              {(data.city || data.address) && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{[data.address, data.city].filter(Boolean).join(', ')}</span>
              )}
              <span className="flex items-center gap-1"><DoorOpen className="w-4 h-4" />{data.rooms.length === 1 ? t('co.rooms_one') : t('co.rooms_many', { n: String(data.rooms.length) })}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{data.followers === 1 ? t('co.followers_one') : t('co.followers_many', { n: String(data.followers) })}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={toggleFollow}
              disabled={busy}
              className={`${data.following ? 'btn-ghost' : 'btn-primary'} text-sm flex items-center gap-2 disabled:opacity-50`}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : data.following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {data.following ? t('co.following') : t('co.follow')}
            </button>
            {site && (
              <a href={site} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" /> {t('co.website')}
              </a>
            )}
          </div>
        </div>
        {data.description && (
          <div className="mt-5 pt-5 border-t border-brand-border">
            <h2 className="text-xs uppercase tracking-wider text-brand-text-muted mb-2">{t('co.about')}</h2>
            <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-line">{data.description}</p>
          </div>
        )}
      </div>

      {/* Instagram (only when the company turned it on) */}
      {data.instagramUsername && <div className="mt-6"><InstagramStrip companyId={data._id} /></div>}

      {/* Open job ads (convex/jobs.ts) */}
      {jobs && jobs.length > 0 && (
        <>
          <h2 className="text-xl font-display font-bold text-brand-bone mt-10 mb-4">{t('jobs.on_profile')}</h2>
          <div className="space-y-4">
            {jobs.map((j) => <JobCard key={j._id} job={j} showCompany={false} />)}
          </div>
        </>
      )}

      {/* Rooms */}
      <h2 className="text-xl font-display font-bold text-brand-bone mt-10 mb-4">{t('co.their_rooms')}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.rooms.map((r: any) => <RoomCard key={r._id} room={toRoomCardData(r)} />)}
      </div>
    </section>
  );
}
