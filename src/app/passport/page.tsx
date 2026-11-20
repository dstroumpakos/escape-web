'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { BookOpen, Stamp, Map as MapIcon, Lock, Gift, QrCode, Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { StampSeal, tiltFor } from '@/components/passport/StampSeal';

type Tab = 'stamps' | 'maze';

/** My Passport: the stamps of the rooms you played and the maze they open. */
export default function PassportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const data = useQuery(api.passport.mine, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
  const [tab, setTab] = useState<Tab>('stamps');
  const [picked, setPicked] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>;

  const chambers = data.chambers;
  const reached = chambers.filter((c) => data.total >= c).length - 1;
  const next = chambers.find((c) => c > data.total);
  const prev = chambers[reached];
  const pct = next ? Math.round(((data.total - prev) / (next - prev)) * 100) : 100;
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
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            {[[data.total, t('pp.stamps')], [data.cities, t('pp.cities')], [`${data.escapedPct}%`, t('pp.escapes')]].map(([v, l]) => (
              <div key={String(l)} className="rounded-md bg-black/40 py-2">
                <div className="text-xl font-display font-bold text-brand-bone tabular-nums">{v}</div>
                <div className="text-[11px] text-brand-text-muted">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <p className="text-xs text-brand-text-secondary">
              {next ? t('pp.next_chamber', { n: String(next - data.total) }) : t('pp.maze_done')}
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
            {([['stamps', Stamp, t('pp.tab_stamps')], ['maze', MapIcon, t('pp.tab_maze')]] as const).map(([k, Icon, label]) => (
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
                    date={new Date(s.createdAt).toLocaleDateString()}
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
                    {' · '}{picked.companyName}{' · '}{new Date(picked.createdAt).toLocaleDateString()}{' · '}
                    {picked.escaped
                      ? t('pp.escaped_in', { time: picked.escapeSeconds ? `${Math.floor(picked.escapeSeconds / 60)}:${String(picked.escapeSeconds % 60).padStart(2, '0')}` : '' })
                      : t('pp.trapped')}
                  </>
                ) : data.total === 0 ? t('pp.empty_hint') : t('pp.tap_stamp')}
              </div>
            </>
          ) : (
            <Maze total={data.total} chambers={chambers} />
          )}
        </div>
      </div>
    </section>
  );
}

// Corridor through the chambers (same order as PASSPORT_CHAMBERS).
const SPOTS = [
  [70, 330], [250, 330], [430, 250], [610, 330], [610, 170], [430, 90], [250, 90], [250, 170], [70, 170], [70, 60],
];
const PATH = 'M70 330 H250 V250 H430 V330 H610 V170 H430 V90 H250 V170 H70 V60';

function Maze({ total, chambers }: { total: number; chambers: number[] }) {
  const { t } = useTranslation();
  const lit = useRef<SVGPathElement>(null);
  const [lens, setLens] = useState<number[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const reached = chambers.filter((c) => total >= c).length - 1;

  useEffect(() => {
    const p = lit.current;
    if (!p) return;
    const L = p.getTotalLength();
    const out = SPOTS.map(([x, y]) => {
      let best = 0, bd = Infinity;
      for (let s = 0; s <= L; s += 4) {
        const q = p.getPointAtLength(s);
        const d = Math.hypot(q.x - x, q.y - y);
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    });
    setLens([...out, L]);
  }, []);

  const L = lens?.[SPOTS.length] ?? 4000;
  const at = lens ? lens[reached] : 0;
  const me = useMemo(() => (lit.current && lens ? lit.current.getPointAtLength(at) : { x: SPOTS[0][0], y: SPOTS[0][1] }), [lens, at]);
  const show = sel ?? Math.min(reached + 1, SPOTS.length - 1);

  return (
    <div>
      <svg viewBox="0 0 680 400" className="w-full h-auto" role="img" aria-label={t('pp.tab_maze')}>
        <path d={PATH} fill="none" stroke="rgba(232,220,200,0.12)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        <path ref={lit} d={PATH} fill="none" stroke="#c99a2e" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L - at} style={{ transition: 'stroke-dashoffset .8s ease-in-out', filter: 'drop-shadow(0 0 6px rgba(201,154,46,.7))' }} />
        {SPOTS.map(([x, y], i) => {
          const open = total >= chambers[i];
          const isNext = !open && i === reached + 1;
          return (
            <g key={i} onClick={() => setSel(i)} className="cursor-pointer">
              <rect x={x - 40} y={y - 27} width={80} height={54} rx={8} fill={open ? '#3a1210' : '#0d0807'} stroke={open ? '#e24b4a' : isNext ? '#c99a2e' : 'rgba(232,220,200,0.25)'} strokeWidth={sel === i ? 2.5 : 1.2} strokeDasharray={isNext ? '5 4' : undefined} />
              <text x={x} y={y - 4} textAnchor="middle" fontSize={18}>{open ? (i === 0 ? '🚪' : '🎁') : '🔒'}</text>
              <text x={x} y={y + 16} textAnchor="middle" fontSize={11} fill={open ? '#f3e9d8' : 'rgba(232,220,200,0.6)'}>
                {i === 0 ? t('pp.entrance') : open ? t('pp.open') : t('pp.n_stamps', { n: String(chambers[i]) })}
              </text>
            </g>
          );
        })}
        <g style={{ transform: `translate(${me.x}px, ${me.y - 38}px)`, transition: 'transform .8s ease-in-out' }}>
          <circle r={12} fill="#c8101b" stroke="#f3e9d8" strokeWidth={2} />
        </g>
      </svg>
      <div className="mt-3 rounded-md bg-black/40 px-4 py-3 text-sm flex gap-3 items-start">
        <Gift className="w-5 h-5 shrink-0 text-brand-gold mt-0.5" />
        <div>
          <p className="font-semibold text-brand-bone">
            {show === 0 ? t('pp.entrance') : t(`pp.ch_${show}`)} · {show === 0 ? t('pp.start') : t('pp.n_stamps', { n: String(chambers[show]) })}
          </p>
          <p className="text-brand-text-secondary">
            {show === 0 ? t('pp.gift_0') : t(`pp.gift_${show}`)}
            {show > 0 && (total >= chambers[show] ? ` · ${t('pp.won')}` : ` · ${t('pp.missing', { n: String(chambers[show] - total) })}`)}
          </p>
        </div>
      </div>
    </div>
  );
}
