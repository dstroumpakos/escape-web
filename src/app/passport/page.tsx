'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { BookOpen, Stamp, Castle, Lock, QrCode, Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { StampSeal, tiltFor } from '@/components/passport/StampSeal';
import dynamic from 'next/dynamic';

// three.js is heavy: load the tower only when its tab opens, and only in the browser.
const TowerGame = dynamic(() => import('@/components/passport/TowerGame').then((m) => m.TowerGame), {
  ssr: false,
  loading: () => <div className="aspect-video rounded-xl bg-black/60 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-red" /></div>,
});
import { cleanError } from '@/lib/errors';
import { formatPlayed, shortPlayed } from '@/lib/playTime';

type Tab = 'stamps' | 'maze';

/** My Passport: the stamps of the rooms you played and the maze they open. */
export default function PassportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const data = useQuery(api.passport.mine, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
  const [tab, setTab] = useState<Tab>('stamps');
  const [picked, setPicked] = useState<any>(null);
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

  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>;

  const chambers = data.chambers;
  const placed = data.placed;
  const pocket = Math.max(0, data.total - placed);
  const doorsOpen = chambers.filter((c) => placed >= c).length - 1;
  const next = chambers.find((c) => c > placed);
  const prev = chambers[doorsOpen];
  const pct = next ? Math.round(((placed - prev) / (next - prev)) * 100) : 100;
  const slots = Math.max(12, Math.ceil((data.total + 3) / 4) * 4);

  return (
    <section className="max-w-5xl mx-auto px-4 pt-24 pb-20">
      <div className="flex items-center gap-3 mb-5">
        <BookOpen className="w-7 h-7 text-brand-red-light" />
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bone">{t('pp.title')}</h1>
      </div>

      {/* The passport: identity page + stamps / maze */}
      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] rounded-2xl overflow-hidden border border-brand-border bg-[#120a08]">
        {/* Identity page */}
        <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-dashed border-brand-border bg-[#1a0f0b]">
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
          <div className="grid grid-cols-1 gap-2 mt-5 text-center">
            {[[data.total, t('pp.stamps')]].map(([v, l]) => (
              <div key={String(l)} className="rounded-md bg-black/40 py-2">
                <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{v}</div>
                <div className="text-[11px] text-brand-text-muted">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <p className="text-xs text-brand-text-secondary">
              {next ? t('tw.progress', { open: String(doorsOpen), n: String(next - placed) }) : t('tw.soon_hint')}
            </p>
            <div className="h-2 rounded-full bg-black/50 mt-2 overflow-hidden">
              <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="mt-5 rounded-md border border-brand-border/70 p-3 text-xs text-brand-text-secondary flex gap-2">
            <QrCode className="w-4 h-4 shrink-0 text-brand-gold" />
            <span>{t('pp.how')}</span>
          </div>
        </div>

        {/* Right page */}
        <div className="p-4 sm:p-6 min-w-0">
          <div className="flex bg-black/40 border border-brand-border rounded-xl p-1 w-fit mb-5" role="tablist">
            {([['stamps', Stamp, t('pp.tab_stamps')], ['maze', Castle, t('tw.tab')]] as const).map(([k, Icon, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${tab === k ? 'bg-brand-red text-white' : 'text-brand-text-secondary hover:text-white'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {tab === 'stamps' ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
                {data.stamps.map((s) => (
                  <StampSeal
                    key={s._id}
                    title={s.roomTitle}
                    theme={s.theme}
                    date={shortPlayed(s.playedAt, s.createdAt)}
                    escaped={s.escaped}
                    tilt={tiltFor(s._id)}
                    onClick={() => setPicked(s)}
                  />
                ))}
                {Array.from({ length: slots - data.stamps.length }, (_, i) => (
                  <div key={`e${i}`} className="w-[112px] h-[112px] rounded-full border-2 border-dashed border-brand-border/70 flex flex-col items-center justify-center text-brand-text-muted text-[11px]">
                    <Lock className="w-5 h-5 mb-1" /> {t('pp.empty')}
                  </div>
                ))}
              </div>
              <div className="mt-5 min-h-[48px] rounded-md bg-black/40 px-4 py-3 text-sm text-brand-text-secondary">
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
            <>
              <TowerGame placed={placed} chambers={chambers} pocket={pocket} onPlace={onPlace} busy={placing} />
              {placeErr && <p className="text-sm text-red-400 mt-2">{placeErr}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
