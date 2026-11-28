'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Briefcase, Camera, DoorOpen, Globe, Grid3x3, Heart, Loader2, MapPin, MessageCircle, UserCheck, UserPlus, Users } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { readStoredCompanySession } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { RoomCard, toRoomCardData } from '@/components/rooms/RoomCard';
import { InstagramStrip } from '@/components/rooms/InstagramStrip';
import { JobCard } from '@/components/jobs/JobCard';
import { PhotoViewer } from '@/components/community/PhotoViewer';
import { VideoThumb } from '@/components/community/VideoThumb';
import { PostModal } from '@/components/profile/ProfileView';
import type { PublicJob } from '@/lib/jobs';

type Tab = 'posts' | 'team' | 'rooms' | 'jobs';
// Team photos are hidden for now (tab, counter and panel). Set to true to bring them back.
const SHOW_TEAM_PHOTOS = false;

/**
 * A company's profile, laid out like a player's profile: cover, logo,
 * counters, then tabs for its posts and photos, its team photos (filterable by
 * room), its rooms and its job ads. Open to everyone; without a login the
 * server leaves out the team photos and the follower count.
 */
export default function CompanyProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isLoading } = useAuth();
  const token = user?.sessionToken;
  // A company opening its own profile from the portal needs no player login
  const [ownerToken, setOwnerToken] = useState<string | undefined>(undefined);
  const [ownerChecked, setOwnerChecked] = useState(false);
  useEffect(() => {
    const c = readStoredCompanySession();
    setOwnerToken(c && c.id === id ? c.sessionToken : undefined);
    setOwnerChecked(true);
  }, [id]);
  const data = useQuery(
    api.companyPages.profile,
    isLoading || !ownerChecked ? 'skip' : { companyId: id as any, sessionToken: token, companySessionToken: ownerToken }
  );
  const jobs = useQuery(api.jobs.byCompany, { companyId: id as any }) as PublicJob[] | undefined;
  const follow = useMutation(api.companyPages.follow);
  const unfollow = useMutation(api.companyPages.unfollow);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');

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
    if (!token) {
      // Visitor: log in first, then come back here
      try { sessionStorage.setItem('unlocked_after_login', `/companies/${id}`); } catch {}
      router.push('/login');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (data.following) await unfollow({ sessionToken: token, companyId: data._id });
      else await follow({ sessionToken: token, companyId: data._id });
    } finally {
      setBusy(false);
    }
  };

  const site = /^https?:\/\//.test(data.website) ? data.website : '';
  const logoOk = data.logo && /^https?:\/\//.test(data.logo);
  const postCount = data.posts.length + data.promoPhotos.length;

  const Count = ({ n, label, onClick }: { n: number; label: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick} disabled={!onClick} className="text-center min-w-[64px] disabled:cursor-default">
      <div className="text-lg sm:text-xl font-display font-bold text-brand-bone tabular-nums">{n}</div>
      <div className="text-[11px] sm:text-xs text-brand-text-muted">{label}</div>
    </button>
  );

  const tabs: [Tab, typeof Grid3x3, string][] = [
    ['posts', Grid3x3, t('pf.tab_posts')],
    // Team photos show players: only for logged-in players (and the company)
    ...(data.isVisitor || !SHOW_TEAM_PHOTOS ? [] : [['team', Users, t('co.tab_team')] as [Tab, typeof Grid3x3, string]]),
    ['rooms', DoorOpen, t('pf.tab_rooms')],
    ['jobs', Briefcase, t('co.tab_jobs')],
  ];

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
      <div className="px-4 sm:px-0 mb-3">
        <Link href="/companies" className="text-sm text-brand-text-secondary hover:text-white inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> {t('co.back')}
        </Link>
      </div>

      {data.isOwner && (
        <p className="mx-4 sm:mx-0 mb-3 text-sm rounded-xl border border-brand-red/30 bg-brand-red/10 text-brand-bone px-4 py-2.5">
          {t('co.owner_preview')}
        </p>
      )}

      {/* Cover */}
      <div className="relative h-40 sm:h-60 sm:rounded-2xl overflow-hidden bg-linear-to-br from-brand-red/40 via-black to-brand-dark">
        {data.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
      </div>

      {/* Logo + name + actions */}
      <div className="px-4 sm:px-6 -mt-12 sm:-mt-16 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
          <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-full border-4 border-brand-bg bg-brand-surface overflow-hidden flex items-center justify-center shadow-[0_0_24px_rgba(var(--glow),0.35)]">
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logo} alt={data.name} className="w-full h-full object-contain p-3" />
            ) : (
              <span className="text-4xl font-display font-bold text-brand-red-light">{(data.name || '?').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 sm:pb-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bone truncate">{data.name}</h1>
            {(data.city || data.address) && (
              <p className="text-sm text-brand-text-secondary flex items-center gap-1 mt-0.5">
                <MapPin className="w-4 h-4 shrink-0" /><span className="truncate">{[data.address, data.city].filter(Boolean).join(', ')}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 sm:pb-2">
            {(data.canFollow || data.isVisitor) && !data.isOwner && (
              <button
                onClick={toggleFollow}
                disabled={busy}
                className={`${data.following ? 'btn-ghost' : 'btn-primary'} text-sm flex items-center gap-2 py-2! px-5! disabled:opacity-50`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : data.following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {data.following ? t('co.following') : t('co.follow')}
              </button>
            )}
            {site && (
              <a href={site} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm flex items-center gap-2 py-2! px-4!">
                <Globe className="w-4 h-4" /> {t('co.website')}
              </a>
            )}
          </div>
        </div>

        {/* Counters */}
        <div className="flex justify-around sm:justify-start sm:gap-8 mt-5 py-3 border-y border-brand-border/60">
          <Count n={postCount} label={t('pf.posts')} onClick={() => setTab('posts')} />
          {data.followers !== null && <Count n={data.followers} label={t('co.followers')} />}
          <Count n={data.rooms.length} label={t('co.rooms')} onClick={() => setTab('rooms')} />
          {SHOW_TEAM_PHOTOS && !data.isVisitor && <Count n={data.teamPhotos.length} label={t('co.team_count')} onClick={() => setTab('team')} />}
        </div>

        {data.description && <p className="mt-3 text-sm text-brand-text whitespace-pre-line max-w-[70ch]">{data.description}</p>}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-brand-border/60 px-2 sm:px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(([k, Icon, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 sm:flex-none shrink-0 px-3 sm:px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === k ? 'border-brand-red text-brand-bone' : 'border-transparent text-brand-text-muted hover:text-brand-bone'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" /> <span className="hidden min-[420px]:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="px-1 sm:px-6 mt-4">
        {tab === 'posts' && (
          <>
            <PostsTab name={data.name} path={`/companies/${data._id}`} promo={data.promoPhotos} posts={data.posts} />
            {data.instagramUsername && <div className="mt-8 px-3 sm:px-0"><InstagramStrip companyId={data._id} /></div>}
          </>
        )}
        {SHOW_TEAM_PHOTOS && tab === 'team' && !data.isVisitor && <TeamTab name={data.name} path={`/companies/${data._id}`} photos={data.teamPhotos} />}
        {tab === 'rooms' && (
          data.rooms.length === 0 ? <Empty icon={DoorOpen} text={t('co.no_rooms')} /> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 px-3 sm:px-0">
              {data.rooms.map((r: any) => <RoomCard key={r._id} room={toRoomCardData(r)} />)}
            </div>
          )
        )}
        {tab === 'jobs' && (
          !jobs ? <Loader2 className="w-6 h-6 animate-spin text-brand-red mx-auto my-10" /> : jobs.length === 0 ? <Empty icon={Briefcase} text={t('co.no_jobs')} /> : (
            <div className="space-y-4 px-3 sm:px-0">
              {jobs.map((j) => <JobCard key={j._id} job={j} showCompany={false} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Camera; text: string }) {
  return (
    <div className="text-center py-14 text-brand-text-secondary">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

/** The company's posts and promo photos in one grid, newest first. */
function PostsTab({ name, path, promo, posts }: { name: string; path: string; promo: { url: string; type: 'image' | 'video'; createdAt: number }[]; posts: any[] }) {
  const { t } = useTranslation();
  const [viewing, setViewing] = useState<number | null>(null);
  const [openPost, setOpenPost] = useState<any>(null);
  const items = useMemo(
    () =>
      [
        ...promo.map((p, i) => ({ kind: 'photo' as const, createdAt: p.createdAt, url: p.url, video: p.type === 'video', index: i })),
        ...posts.map((p) => ({ kind: 'post' as const, createdAt: p.createdAt, post: p })),
      ].sort((a, b) => b.createdAt - a.createdAt),
    [promo, posts]
  );

  if (items.length === 0) return <Empty icon={Camera} text={t('co.no_posts')} />;

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {items.map((it) => {
          if (it.kind === 'photo') {
            return (
              <button key={'ph' + it.index} onClick={() => setViewing(it.index)} className="relative aspect-square overflow-hidden bg-brand-surface sm:rounded-md cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.video ? <span className="absolute inset-0"><VideoThumb url={it.url} /></span> : <img src={it.url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
              </button>
            );
          }
          const p = it.post;
          const img = p.media.find((m: any) => m.type === 'image')?.url;
          const vid = !img ? p.media.find((m: any) => m.type === 'video')?.url : undefined;
          return (
            <button key={p._id} onClick={() => setOpenPost(p)} className="group relative aspect-square overflow-hidden bg-brand-surface sm:rounded-md">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              ) : vid ? (
                <span className="absolute inset-0"><VideoThumb url={vid} /></span>
              ) : (
                <div className="absolute inset-0 p-3 flex items-center justify-center bg-linear-to-br from-brand-red/25 to-black">
                  <p className="text-xs sm:text-sm text-brand-bone line-clamp-5 text-center">{p.text}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-bold">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{p.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{p.commentCount}</span>
              </div>
            </button>
          );
        })}
      </div>
      {viewing !== null && <PhotoViewer urls={promo.map((p) => p.url)} types={promo.map((p) => p.type)} start={viewing} onClose={() => setViewing(null)}
        share={(i) => ({ url: promo[i].url, type: promo[i].type, title: name, path })} />}
      {openPost && <PostModal post={openPost} author={{ name }} onClose={() => setOpenPost(null)} shareAs={{ title: name, subtitle: openPost.roomTitle || undefined, path }} />}
    </>
  );
}

type TeamPhoto = { url: string; teamName: string; escaped: boolean | null; escapeTime: string; roomTitle: string };

/** Every team photo the company shows, with a filter by room. */
function TeamTab({ name, path, photos }: { name: string; path: string; photos: TeamPhoto[] }) {
  const { t } = useTranslation();
  const [room, setRoom] = useState<string | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const rooms = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of photos) counts.set(p.roomTitle, (counts.get(p.roomTitle) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => (a[0] ? 0 : 1) - (b[0] ? 0 : 1) || b[1] - a[1]);
  }, [photos]);
  const shown = room === null ? photos : photos.filter((p) => p.roomTitle === room);

  if (photos.length === 0) return <Empty icon={Users} text={t('co.no_team_photos')} />;

  const chip = (active: boolean) =>
    `shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
      active ? 'bg-brand-red border-brand-red text-white' : 'border-brand-border text-brand-text-secondary hover:text-white hover:border-white/30'
    }`;
  const caption = (p: TeamPhoto) =>
    [p.teamName, p.escaped ? [t('co.escaped'), p.escapeTime].filter(Boolean).join(' ') : ''].filter(Boolean).join(' · ');

  return (
    <>
      {/* Room filter */}
      {rooms.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 px-3 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => setRoom(null)} className={chip(room === null)}>
            {t('co.all_rooms')} <span className="opacity-70">{photos.length}</span>
          </button>
          {rooms.map(([title, n]) => (
            <button key={title || '_'} type="button" onClick={() => setRoom(title)} className={chip(room === title)}>
              {title || t('cp.no_room')} <span className="opacity-70">{n}</span>
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? <Empty icon={Users} text={t('co.no_team_room')} /> : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {shown.map((p, i) => (
            <button key={p.url + i} onClick={() => setViewing(i)} className="group relative aspect-square overflow-hidden bg-brand-surface sm:rounded-md cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.teamName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5 text-left">
                {caption(p) && <p className="text-[11px] sm:text-xs text-white truncate">{caption(p)}</p>}
                {room === null && p.roomTitle && <p className="text-[10px] sm:text-[11px] text-white/60 truncate">{p.roomTitle}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
      {viewing !== null && (
        <PhotoViewer
          urls={shown.map((p) => p.url)}
          start={viewing}
          onClose={() => setViewing(null)}
          share={(i) => ({
            url: shown[i].url,
            title: shown[i].roomTitle || name,
            subtitle: [caption(shown[i]), shown[i].roomTitle ? name : ''].filter(Boolean).join(' · ') || undefined,
            path,
          })}
        />
      )}
    </>
  );
}
