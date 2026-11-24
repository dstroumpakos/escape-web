'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { BookOpen, Stamp, Castle, QrCode, Loader2, ListChecks, Map as MapIcon } from 'lucide-react';
import { PlaysTab, useMyPlays } from '@/components/plays/PlaysTab';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { PassportBook, type BookPage } from '@/components/passport/PassportBook';
import { CoverPage, DataPage, EndPage, StampPage, STAMPS_PER_PAGE } from '@/components/passport/PassportPages';
import { since } from '@/lib/memberSince';
import dynamic from 'next/dynamic';

// three.js is heavy: load the tower only when its tab opens, and only in the browser.
const TowerGame = dynamic(() => import('@/components/passport/TowerGame').then((m) => m.TowerGame), {
  ssr: false,
  loading: () => <div className="aspect-video rounded-xl bg-black/60 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-red" /></div>,
});
import { cleanError } from '@/lib/errors';
import { formatPlayed } from '@/lib/playTime';

type Tab = 'stamps' | 'played' | 'map' | 'maze';

const PlaysMap = dynamic(() => import('@/components/plays/PlaysMap'), {
  ssr: false,
  loading: () => <div className="h-[420px] rounded-xl bg-black/60 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-red" /></div>,
});

/**
 * My Passport: a book of the stamps of the rooms you played (PassportBook),
 * plus the rooms you added, their map and the tower the stamps open.
 */
export default function PassportPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const data = useQuery(api.passport.mine, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
  const [tab, setTab] = useState<Tab>('stamps');
  const plays = useMyPlays();
  // ?tab=played from notifications, ?new=1 straight after taking a stamp
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const want = q.get('tab');
    if (want === 'played' || want === 'map') setTab(want);
    if (q.get('new') === '1') {
      setFresh(true);
      // Only once: a reload shows the passport normally.
      window.history.replaceState(null, '', '/passport');
    }
  }, []);
  const [picked, setPicked] = useState<any>(null);
  const [slamId, setSlamId] = useState<string | null>(null);
  const placeStamp = useMutation(api.passport.placeStamp);
  const [placing, setPlacing] = useState(false);
  const [placeErr, setPlaceErr] = useState('');
  const onPlace = async () => {
    if (!user?.sessionToken) return;
    setPlacing(true);
    setPlaceErr('');
    try {
      await placeStamp({ sessionToken: user.sessionToken });
    } catch (e) {
      setPlaceErr(cleanError(e));
    } finally {
      setPlacing(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  // Stamps in the order they were collected, like a real passport fills up.
  const ordered = useMemo(() => (data ? [...data.stamps].reverse() : []), [data]);
  const newest = ordered.length ? ordered[ordered.length - 1] : null;
  // Book pages: 0 cover, 1 data page, 2.. stamp pages. There is always one
  // free slot ("your next stamp goes here"), on the last stamp page.
  const stampPages = Math.max(1, Math.ceil((ordered.length + 1) / STAMPS_PER_PAGE));
  const newestPage = ordered.length ? 2 + Math.floor((ordered.length - 1) / STAMPS_PER_PAGE) : 1;

  const onSettled = useCallback(
    (shown: number[]) => {
      if (fresh && newest && shown.includes(newestPage)) setSlamId(newest._id);
    },
    [fresh, newest, newestPage]
  );

  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>;

  const chambers = data.chambers;
  const placed = data.placed;
  const pocket = Math.max(0, data.total - placed);
  const doorsOpen = chambers.filter((c) => placed >= c).length - 1;
  const next = chambers.find((c) => c > placed);
  const prev = chambers[doorsOpen];
  const pct = next ? Math.round(((placed - prev) / (next - prev)) * 100) : 100;
  const progressText = next ? t('tw.progress', { open: String(doorsOpen), n: String(next - placed) }) : t('tw.soon_hint');

  const pages: BookPage[] = [
    { key: 'cover', kind: 'cover', node: <CoverPage openLabel={t('pp.book_open')} /> },
    {
      key: 'data',
      kind: 'paper',
      node: (
        <DataPage
          data={data}
          memberSince={data.memberSince ? since(data.memberSince, language) : ''}
          progressText={progressText}
          pct={pct}
          labels={{
            name: t('pp.name'),
            number: t('pp.number'),
            since: t('profile.member_since'),
            stamps: t('pp.stamps'),
            cities: t('pp.cities'),
            escapes: t('pp.escapes'),
            how: t('pp.how'),
          }}
        />
      ),
    },
    ...Array.from({ length: stampPages }, (_, p) => ({
      key: `stamps${p}`,
      kind: 'paper' as const,
      node: (
        <StampPage
          stamps={ordered.slice(p * STAMPS_PER_PAGE, (p + 1) * STAMPS_PER_PAGE)}
          firstEmptyIsNext={p === stampPages - 1}
          pageNo={p + 2}
          title={t('pp.tab_stamps')}
          nextLabel={t('pp.next_slot')}
          hiddenId={fresh ? newest?._id : null}
          slamId={slamId}
          onPick={setPicked}
        />
      ),
    })),
  ];

  return (
    <section className="max-w-5xl mx-auto px-4 pt-24 pb-20">
      <div className="flex items-center gap-3 mb-5">
        <BookOpen className="w-7 h-7 text-brand-red-light" />
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bone">{t('pp.title')}</h1>
      </div>
      <div className="flex bg-black/40 border border-brand-border rounded-xl p-1 w-fit max-w-full overflow-x-auto mb-6" role="tablist">
        {([['stamps', Stamp, t('pp.tab_stamps')], ['played', ListChecks, t('pl.tab')], ['map', MapIcon, t('pl.map_tab')], ['maze', Castle, t('tw.tab')]] as const).map(([k, Icon, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${tab === k ? 'bg-brand-red text-white' : 'text-brand-text-secondary hover:text-white'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'stamps' ? (
        <>
          <PassportBook
            pages={pages}
            openToPage={fresh ? newestPage : 1}
            autoOpen={fresh}
            onSettled={onSettled}
            endPage={<EndPage how={t('pp.how')} />}
            labels={{
              open: t('pp.book_open'),
              prev: t('pp.book_prev'),
              next: t('pp.book_next'),
              page: (a, total) => t('pp.book_page', { n: a, total: String(total) }),
            }}
          />
          <div className="mt-5 max-w-[960px] mx-auto min-h-[48px] rounded-md bg-black/40 px-4 py-3 text-sm text-brand-text-secondary">
            {picked ? (
              <>
                <Link href={`/rooms/${picked.roomId}`} className="font-semibold text-brand-bone hover:underline">{picked.roomTitle}</Link>
                {' · '}{picked.companyName}{' · '}{formatPlayed(picked.playedAt, picked.createdAt)}{' · '}
                {picked.escaped
                  ? t('pp.escaped_in', { time: picked.escapeSeconds ? `${Math.floor(picked.escapeSeconds / 60)}:${String(picked.escapeSeconds % 60).padStart(2, '0')}` : '' })
                  : t('pp.trapped')}
              </>
            ) : data.total === 0 ? t('pp.empty_hint') : t('pp.tap_stamp')}
          </div>
        </>
      ) : (
        /* The other tabs: identity column + content, as before */
        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] rounded-2xl overflow-hidden border border-brand-border bg-brand-card">
          <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-dashed border-brand-border bg-brand-surface">
            <p className="font-type text-xs tracking-[0.3em] text-brand-gold/80">UNLOCKED · PASSPORT</p>
            <div className="flex gap-4 items-center mt-4">
              <div className="w-20 h-24 rounded-md bg-black/50 border border-brand-border overflow-hidden flex items-center justify-center">
                {data.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-brand-red-light">{(data.name || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="text-sm min-w-0">
                <p className="text-[11px] text-brand-text-muted">{t('pp.name')}</p>
                <p className="font-semibold text-brand-bone truncate">{data.name}</p>
                <p className="text-[11px] text-brand-text-muted mt-1">{t('pp.number')}</p>
                <p className="font-mono text-brand-bone">{data.passportNo}</p>
              </div>
            </div>
            <div className="rounded-md bg-black/40 py-2 mt-5 text-center">
              <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{data.total}</div>
              <div className="text-[11px] text-brand-text-muted">{t('pp.stamps')}</div>
            </div>
            <div className="mt-5">
              <p className="text-xs text-brand-text-secondary">{progressText}</p>
              <div className="h-2 rounded-full bg-black/50 mt-2 overflow-hidden">
                <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="mt-5 rounded-md border border-brand-border/70 p-3 text-xs text-brand-text-secondary flex gap-2">
              <QrCode className="w-4 h-4 shrink-0 text-brand-gold" />
              <span>{t('pp.how')}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 min-w-0">
            {tab === 'map' ? (
              <PlaysMap pins={plays?.pins ?? []} />
            ) : tab === 'played' ? (
              <PlaysTab data={plays ?? undefined} stampCount={data.stamps.length} />
            ) : (
              <>
                <TowerGame placed={placed} chambers={chambers} pocket={pocket} onPlace={onPlace} busy={placing} />
                {placeErr && <p className="text-sm text-red-400 mt-2">{placeErr}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
