'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A horizontal row that scrolls without a visible scrollbar: round arrow
 * buttons on the sides (when there is more to see) and soft fades at the edges.
 * Touch and trackpad scrolling work as usual.
 */
export function ScrollRow({
  children,
  className = '',
  fade = 'from-brand-surface',
}: {
  children: React.ReactNode;
  className?: string;
  /** Tailwind from-* colour of the edge fades: the background behind the row */
  fade?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, children]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const btn =
    'absolute top-[38%] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/75 border border-brand-border text-brand-bone ' +
    'hidden sm:flex items-center justify-center backdrop-blur-sm shadow-lg transition hover:bg-brand-red hover:border-brand-red-light';

  return (
    <div className="relative group/row">
      <div
        ref={ref}
        onScroll={update}
        className={`flex gap-3 overflow-x-auto snap-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>

      {/* Edge fades */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r ${fade} to-transparent transition-opacity ${canLeft ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l ${fade} to-transparent transition-opacity ${canRight ? 'opacity-100' : 'opacity-0'}`}
      />

      {canLeft && (
        <button type="button" aria-label="Previous" onClick={() => go(-1)} className={`${btn} left-1`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canRight && (
        <button type="button" aria-label="Next" onClick={() => go(1)} className={`${btn} right-1`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
