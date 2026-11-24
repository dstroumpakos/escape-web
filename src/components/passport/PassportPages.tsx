'use client';

import { QrCode } from 'lucide-react';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
import { StampSeal, tiltFor } from '@/components/passport/StampSeal';
import { shortPlayed } from '@/lib/playTime';

/** The pages of the passport book (PassportBook.tsx): cover, data page, stamp pages. */

export const STAMPS_PER_PAGE = 6;

const gold = { textShadow: '0 1px 0 rgba(0,0,0,.65), 0 0 14px rgba(var(--glow-hi),.25)' };

export function CoverPage({ openLabel }: { openLabel: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between py-[14%] px-6 text-brand-gold" style={gold}>
      <div className="pointer-events-none absolute inset-3 rounded-[6px] border border-brand-gold/45" />
      <div className="pointer-events-none absolute inset-[18px] rounded-[4px] border border-brand-gold/20" />
      <p className="font-type text-xs @md:text-sm tracking-[0.55em] pl-[0.55em]">UNLOCKED</p>
      <div className="flex flex-col items-center gap-4">
        <EyeKeyhole variant="onDark" className="w-20 h-20 @md:w-28 @md:h-28 drop-shadow-[0_2px_0_rgba(0,0,0,.6)]" />
        <p className="font-display text-2xl @md:text-4xl font-bold tracking-[0.3em] pl-[0.3em]">PASSPORT</p>
        <p className="font-type text-[10px] @md:text-xs tracking-[0.4em] pl-[0.4em] opacity-75">ESCAPE ROOMS</p>
      </div>
      <p className="text-xs text-brand-gold/80 animate-pulse-soft">{openLabel}</p>
    </div>
  );
}

/** Machine-readable zone at the foot of the data page, just for the look. */
function mrz(name: string, passportNo: string) {
  const fill = (s: string) => (s + '<'.repeat(36)).slice(0, 36);
  const nm = name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '<')
    .replace(/[^\p{L}\p{N}<]/gu, '');
  return [fill(`P<UNL${nm}`), fill(passportNo.replace(/-/g, '') + '<<UNLOCKED')];
}

export function DataPage({
  data,
  memberSince,
  progressText,
  pct,
  labels,
}: {
  data: { name: string; avatar: string; passportNo: string; total: number; cities: number; escapedPct: number };
  memberSince: string;
  progressText: string;
  pct: number;
  labels: { name: string; number: string; since: string; stamps: string; cities: string; escapes: string; how: string };
}) {
  const [l1, l2] = mrz(data.name || '', data.passportNo);
  return (
    <div className="absolute inset-0 flex flex-col p-4 @md:p-7">
      <p className="font-type text-[10px] @md:text-xs tracking-[0.3em] text-brand-gold/80">UNLOCKED · PASSPORT</p>
      <div className="flex gap-4 items-center mt-3 @md:mt-5">
        <div className="w-20 h-24 @md:w-28 @md:h-36 shrink-0 rounded-md bg-black/50 border border-brand-border overflow-hidden flex items-center justify-center">
          {data.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatar} alt="" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <span className="text-4xl font-bold text-brand-red-light">{(data.name || '?').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="text-sm min-w-0">
          <p className="text-[11px] text-brand-text-muted">{labels.name}</p>
          <p className="font-semibold text-brand-bone truncate @md:text-base">{data.name}</p>
          <p className="text-[11px] text-brand-text-muted mt-1.5">{labels.number}</p>
          <p className="font-mono text-brand-bone">{data.passportNo}</p>
          {memberSince && (
            <>
              <p className="text-[11px] text-brand-text-muted mt-1.5">{labels.since}</p>
              <p className="text-brand-bone">{memberSince}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 @md:mt-6 text-center">
        {[
          [data.total, labels.stamps],
          [data.cities, labels.cities],
          [`${data.escapedPct}%`, labels.escapes],
        ].map(([v, l]) => (
          <div key={String(l)} className="rounded-md bg-black/35 py-1.5 @md:py-2">
            <div className="text-lg @md:text-xl font-display font-bold text-brand-bone tabular-nums">{v}</div>
            <div className="text-[10px] @md:text-[11px] text-brand-text-muted">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 @md:mt-6">
        <p className="text-[11px] @md:text-xs text-brand-text-secondary">{progressText}</p>
        <div className="h-1.5 @md:h-2 rounded-full bg-black/50 mt-1.5 overflow-hidden">
          <div className="h-full bg-brand-red rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex mt-4 @md:mt-5 rounded-md border border-brand-border/70 p-2.5 @md:p-3 text-[11px] @md:text-xs text-brand-text-secondary gap-2">
        <QrCode className="w-4 h-4 shrink-0 text-brand-gold" />
        <span>{labels.how}</span>
      </div>

      <div className="mt-auto pt-3 font-mono text-[9px] @md:text-[11px] leading-snug tracking-[0.12em] text-brand-text-muted/80 overflow-hidden whitespace-nowrap">
        <div>{l1}</div>
        <div>{l2}</div>
      </div>
    </div>
  );
}

/** Inside of the back cover: how to collect stamps. */
export function EndPage({ how }: { how: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 @md:px-14 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] text-brand-gold">
        <EyeKeyhole variant="onDark" className="w-2/3 h-2/3" />
      </div>
      <QrCode className="relative w-10 h-10 @md:w-12 @md:h-12 text-brand-gold/70" />
      <p className="relative text-xs @md:text-sm text-brand-text-secondary leading-relaxed">{how}</p>
      <p className="relative font-type text-[10px] tracking-[0.4em] pl-[0.4em] text-brand-gold/50">UNLOCKED</p>
    </div>
  );
}

type Stamp = {
  _id: string;
  roomTitle: string;
  theme: string;
  escaped: boolean;
  playedAt: number | null;
  createdAt: number;
};

/** Small stable offset from an id, so stamps don't sit on a perfect grid. */
function nudge(id: string) {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 131 + id.charCodeAt(i)) | 0;
  const a = Math.abs(h);
  return { x: (a % 21) - 10, y: (Math.floor(a / 21) % 15) - 7 };
}

export function StampPage({
  stamps,
  firstEmptyIsNext,
  pageNo,
  title,
  nextLabel,
  hiddenId,
  slamId,
  onPick,
}: {
  stamps: Stamp[];
  /** The page with the first free slot shows "your next stamp goes here". */
  firstEmptyIsNext: boolean;
  pageNo: number;
  title: string;
  nextLabel: string;
  /** Newest stamp, kept invisible until it lands (after a QR scan). */
  hiddenId?: string | null;
  slamId?: string | null;
  onPick: (s: Stamp) => void;
}) {
  const empty = STAMPS_PER_PAGE - stamps.length;
  return (
    <div className="absolute inset-0 flex flex-col px-3 py-3 @md:px-6 @md:py-5">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] text-brand-gold">
        <EyeKeyhole variant="onDark" className="w-2/3 h-2/3" />
      </div>
      <p className="relative font-type text-[10px] @md:text-xs tracking-[0.3em] text-brand-gold/70 uppercase">{title}</p>
      <div className="relative flex-1 grid grid-cols-2 grid-rows-3 place-items-center">
        {stamps.map((s) => {
          const o = nudge(s._id);
          return (
            <div
              key={s._id}
              className="scale-[.72] @sm:scale-[.82] @md:scale-100"
              style={{ translate: `${o.x}px ${o.y}px`, visibility: hiddenId === s._id && slamId !== s._id ? 'hidden' : undefined }}
            >
              <StampSeal
                key={slamId === s._id ? 'slam' : 'still'}
                title={s.roomTitle}
                theme={s.theme}
                date={shortPlayed(s.playedAt, s.createdAt)}
                escaped={s.escaped}
                tilt={tiltFor(s._id)}
                size={120}
                slam={slamId === s._id}
                onClick={() => onPick(s)}
              />
            </div>
          );
        })}
        {Array.from({ length: empty }, (_, i) =>
          i === 0 && firstEmptyIsNext ? (
            <div key="next" className="scale-[.72] @sm:scale-[.82] @md:scale-100 w-[120px] h-[120px] rounded-full border-2 border-dashed border-brand-gold/50 flex flex-col items-center justify-center text-center text-brand-gold/80 text-[11px] px-3">
              <QrCode className="w-6 h-6 mb-1" />
              {nextLabel}
            </div>
          ) : (
            <div key={`e${i}`} className="scale-[.72] @sm:scale-[.82] @md:scale-100 w-[120px] h-[120px] rounded-full border border-dashed border-brand-border/50" />
          )
        )}
      </div>
      <p className="relative text-center font-type text-[10px] @md:text-xs text-brand-text-muted tabular-nums">— {pageNo} —</p>
    </div>
  );
}
