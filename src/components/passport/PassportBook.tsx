'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * The passport as a book you leaf through (src/app/passport/page.tsx).
 *
 * pages[0] is the cover, the rest are paper pages. Wide screens show a
 * two-page spread, phones one page at a time. Turning a page is a CSS 3D
 * flip of one "leaf"; with reduced motion the page simply changes.
 *
 * Spread positions: k = 0 is the closed book (cover on the right half,
 * the book shifted so the cover sits in the middle). At k > 0 the left
 * page is pages[2k - 1] and the right page pages[2k].
 */
export type BookPage = { key: string; kind: 'cover' | 'paper'; node: ReactNode };

const FLIP_MS = 750;

function useMedia(query: string) {
  // false on the server and the first browser render (they must match), then the real value.
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

type Flip = {
  mode: 'spread' | 'single';
  to: number;
  front: BookPage | null;
  back: BookPage | null;
  underLeft: BookPage | null;
  underRight: BookPage | null;
  from: number; // leaf angle at the start
  end: number; // leaf angle at the end
};

export function PassportBook({
  pages: rawPages,
  openToPage,
  autoOpen = false,
  onSettled,
  endPage = null,
  labels,
}: {
  pages: BookPage[];
  /** Fills the last right-hand page when the pages don't come out even (not counted). */
  endPage?: ReactNode;
  /** Page index to show when the book opens (e.g. the newest stamp). */
  openToPage?: number;
  /** Open by itself shortly after it appears (after a QR scan). */
  autoOpen?: boolean;
  /** Called with the shown page indexes whenever a turn ends. */
  onSettled?: (shown: number[]) => void;
  labels: { open: string; prev: string; next: string; page: (a: string, total: number) => string };
}) {
  const wide = useMedia('(min-width: 768px)');
  const still = useMedia('(prefers-reduced-motion: reduce)');
  // An odd number of pages, so the last spread always has a right page.
  const pages = rawPages.length % 2 === 0 ? [...rawPages, { key: 'end', kind: 'paper' as const, node: endPage }] : rawPages;
  const n = pages.length;
  const K = Math.floor((n - 1) / 2);

  const [pos, setPos] = useState(0); // spread k or single page i
  const [flip, setFlip] = useState<Flip | null>(null);
  const [run, setRun] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false); // a turn is running (refs see it before the next render)
  const lastWide = useRef(wide);

  // Keep the same page in view when the layout switches between spread and single.
  useEffect(() => {
    if (lastWide.current === wide) return;
    lastWide.current = wide;
    // Drop a turn in progress: its target is a position of the old layout.
    if (doneTimer.current) clearTimeout(doneTimer.current);
    doneTimer.current = null;
    busy.current = false;
    setFlip(null);
    setRun(false);
    setPos((p) => (wide ? Math.ceil(p / 2) : p === 0 ? 0 : 2 * p - 1));
  }, [wide]);

  const max = wide ? K : n - 1;
  const shownOf = useCallback((p: number) => (wide ? (p === 0 ? [0] : [2 * p - 1, 2 * p]) : [p]), [wide]);
  const posOfPage = useCallback((i: number) => (wide ? Math.ceil(i / 2) : i), [wide]);

  const finish = useCallback(
    (to: number) => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
      doneTimer.current = null;
      busy.current = false;
      setFlip(null);
      setRun(false);
      setPos(to);
      onSettled?.(shownOf(to));
    },
    [onSettled, shownOf]
  );

  const go = useCallback(
    (target: number) => {
      const to = Math.max(0, Math.min(max, target));
      if (flip || busy.current || to === pos) return;
      busy.current = true;
      if (still) return finish(to);
      const fwd = to > pos;
      let f: Flip;
      if (wide) {
        const left = (k: number) => (k > 0 ? pages[2 * k - 1] : null);
        const right = (k: number) => pages[2 * k] ?? null;
        f = fwd
          ? { mode: 'spread', to, front: right(pos), back: left(to), underLeft: left(pos), underRight: right(to), from: 0, end: -180 }
          : { mode: 'spread', to, front: right(to), back: left(pos), underLeft: left(to), underRight: right(pos), from: -180, end: 0 };
      } else {
        f = fwd
          ? { mode: 'single', to, front: pages[pos], back: null, underLeft: null, underRight: pages[to], from: 0, end: -115 }
          : { mode: 'single', to, front: pages[to], back: null, underLeft: null, underRight: pages[pos], from: -115, end: 0 };
      }
      setRun(false);
      setFlip(f);
      doneTimer.current = setTimeout(() => finish(to), FLIP_MS + 150);
    },
    [flip, pos, max, still, wide, pages, finish]
  );

  // Start the turn one frame after the leaf is drawn at its start angle.
  useLayoutEffect(() => {
    if (!flip || run) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setRun(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [flip, run]);

  useEffect(() => () => {
    if (doneTimer.current) clearTimeout(doneTimer.current);
  }, []);

  // After a QR scan: open by itself at the newest stamp.
  // (through a ref: `go` changes on every render, which must not cancel the timer)
  const openLater = useRef(() => {});
  openLater.current = () => go(posOfPage(openToPage ?? 1));
  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => openLater.current(), 500);
    return () => clearTimeout(t);
  }, [autoOpen]);

  const open = () => go(posOfPage(openToPage ?? 1));
  const next = () => (pos === 0 ? open() : go(pos + 1));
  const prev = () => go(pos - 1);

  // Swipe (touch and mouse drag).
  const startX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 45) return;
    if (dx < 0) next();
    else prev();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  };

  // What lies on the table (under the turning leaf, if any).
  const restLeft = wide ? (flip ? flip.underLeft : pos > 0 ? pages[2 * pos - 1] : null) : null;
  const restRight = wide ? (flip ? flip.underRight : pages[2 * pos]) : flip ? flip.underRight : pages[pos];
  // The closed book sits centred: shift it by half a page.
  const shownPos = flip ? flip.to : pos;
  const closed = wide && shownPos === 0;
  const angle = flip ? (run ? flip.end : flip.from) : 0;
  const progress = flip ? Math.abs(angle - flip.from) / Math.abs(flip.end - flip.from) : 0;

  const shown = shownOf(pos).filter((i) => i > 0 && i < rawPages.length);
  const paperTotal = rawPages.length - 1;
  const pageLabel = shown.length ? labels.page(shown.join('–'), paperTotal) : '';

  return (
    <div className="select-none">
      <div
        className="relative mx-auto outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 rounded-lg"
        style={{
          width: '100%',
          maxWidth: wide ? 960 : 420,
          aspectRatio: wide ? '1.5 / 1' : '0.72 / 1',
          perspective: 2200,
          touchAction: 'pan-y',
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="book"
        aria-label={pageLabel}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startX.current = null)}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: closed ? 'translateX(-25%)' : 'none',
            transition: still ? 'none' : `transform ${FLIP_MS}ms cubic-bezier(.45,.05,.25,1)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Resting pages */}
          {wide && restLeft && (
            <div className="absolute inset-y-0 left-0 w-1/2">
              <Face page={restLeft} side="left" stack />
            </div>
          )}
          {restRight && (
            <div className={`absolute inset-y-0 ${wide ? 'left-1/2 w-1/2' : 'inset-x-0'}`}>
              <Face page={restRight} side={wide ? 'right' : 'single'} stack onOpen={restRight.kind === 'cover' ? open : undefined} openLabel={labels.open} />
            </div>
          )}

          {/* The turning leaf */}
          {flip && (
            <div
              className={`absolute inset-y-0 ${wide ? 'left-1/2 w-1/2' : 'inset-x-0'}`}
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${angle}deg)`,
                transition: run ? `transform ${FLIP_MS}ms cubic-bezier(.45,.05,.25,1), opacity ${FLIP_MS}ms ease-in` : 'none',
                opacity: flip.mode === 'single' ? (run ? (flip.end === 0 ? 1 : 0) : flip.end === 0 ? 0 : 1) : 1,
                zIndex: 20,
              }}
              onTransitionEnd={(e) => {
                if (e.propertyName === 'transform' && e.target === e.currentTarget) finish(flip.to);
              }}
            >
              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                {flip.front && <Face page={flip.front} side={wide ? 'right' : 'single'} shade={progress} />}
              </div>
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {flip.back ? <Face page={flip.back} side="left" shade={1 - progress} /> : <Face page={{ key: 'blank', kind: 'paper', node: null }} side="left" />}
              </div>
            </div>
          )}

          {/* Spine */}
          {wide && !closed && (
            <div
              className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 z-10"
              style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,.45) 45%, rgba(0,0,0,.55) 50%, rgba(0,0,0,.45) 55%, transparent)' }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button type="button" onClick={prev} disabled={pos === 0 || !!flip} aria-label={labels.prev} className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-white hover:border-brand-gold/60 disabled:opacity-30 disabled:pointer-events-none">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-type text-xs tracking-[0.2em] text-brand-text-muted min-w-[110px] text-center tabular-nums">
          {pos === 0 ? labels.open : pageLabel}
        </span>
        <button type="button" onClick={next} disabled={pos === max || !!flip} aria-label={labels.next} className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-white hover:border-brand-gold/60 disabled:opacity-30 disabled:pointer-events-none">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/** One page: the cover (leather + gold) or paper, with the spine shadow on the bound edge. */
function Face({
  page,
  side,
  stack = false,
  shade = 0,
  onOpen,
  openLabel,
}: {
  page: BookPage;
  side: 'left' | 'right' | 'single';
  stack?: boolean;
  shade?: number;
  onOpen?: () => void;
  openLabel?: string;
}) {
  const radius = side === 'left' ? '10px 2px 2px 10px' : side === 'right' ? '2px 10px 10px 2px' : '4px 10px 10px 4px';
  if (page.kind === 'cover') {
    return (
      <div
        className="@container relative w-full h-full overflow-hidden cursor-pointer"
        style={{
          borderRadius: radius,
          background:
            'radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,.08), transparent 60%), radial-gradient(90% 80% at 80% 100%, rgba(0,0,0,.45), transparent 70%), var(--color-brand-blood)',
          boxShadow: '0 18px 40px rgba(0,0,0,.55), inset 0 0 0 1px rgba(0,0,0,.4), inset 6px 0 12px rgba(0,0,0,.35)',
        }}
        onClick={onOpen}
        role={onOpen ? 'button' : undefined}
        aria-label={onOpen ? openLabel : undefined}
      >
        {page.node}
        <Shade v={shade} dir="to left" />
      </div>
    );
  }
  // Paper: brand surface with a faint guilloche, edges of the pages below.
  const stackShadow =
    side === 'left'
      ? '-3px 3px 0 -1px var(--color-brand-surface), -3px 3px 0 0 var(--color-brand-border), -6px 6px 0 -1px var(--color-brand-surface), -6px 6px 0 0 var(--color-brand-border), 0 18px 40px rgba(0,0,0,.5)'
      : '3px 3px 0 -1px var(--color-brand-surface), 3px 3px 0 0 var(--color-brand-border), 6px 6px 0 -1px var(--color-brand-surface), 6px 6px 0 0 var(--color-brand-border), 0 18px 40px rgba(0,0,0,.5)';
  const spine =
    side === 'left'
      ? 'linear-gradient(to left, rgba(0,0,0,.35), transparent 12%)'
      : side === 'right'
        ? 'linear-gradient(to right, rgba(0,0,0,.35), transparent 12%)'
        : 'linear-gradient(to right, rgba(0,0,0,.3), transparent 6%)';
  return (
    <div
      className="@container relative w-full h-full overflow-hidden border border-brand-border"
      style={{
        borderRadius: radius,
        background: `${spine}, repeating-radial-gradient(circle at 50% 120%, rgba(var(--glow),.045) 0 1px, transparent 1px 9px), var(--color-brand-surface)`,
        boxShadow: stack ? stackShadow : '0 10px 30px rgba(0,0,0,.45)',
      }}
    >
      {page.node}
      <Shade v={shade} dir={side === 'left' ? 'to right' : 'to left'} />
    </div>
  );
}

/** Light falling off a page as it turns: fades with the same timing as the flip. */
function Shade({ v, dir }: { v: number; dir: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: v,
        transition: `opacity ${FLIP_MS}ms ease-in-out`,
        background: `linear-gradient(${dir}, rgba(0,0,0,.5), rgba(0,0,0,.12))`,
      }}
    />
  );
}
