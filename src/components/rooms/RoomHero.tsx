'use client';

import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, DoorOpen } from 'lucide-react';

/**
 * The room page opens on the photo alone, full screen. Scrolling drifts and
 * fades the photo while the details (the next section, id="room-details")
 * slide in. Tall photos (posters) are shown whole over a blurred copy of
 * themselves instead of being cut to a slice. "Reduce motion" turns the
 * scroll effects off.
 */
export function RoomHero({ image, title, children }: { image?: string; title: string; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [poster, setPoster] = useState(false);
  const checkPoster = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > img.naturalWidth * 1.15) setPoster(true);
  };

  // 0 at the top of the page, 1 once the first screen has scrolled away
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) => Math.min(1, Math.max(0, y / (typeof window === 'undefined' ? 800 : window.innerHeight))));
  const photoY = useTransform(progress, [0, 1], ['0%', '22%']);
  const photoScale = useTransform(progress, [0, 1], [1, 1.08]);
  const photoOpacity = useTransform(progress, [0, 1], [1, 0.3]);
  const cueOpacity = useTransform(progress, [0, 0.12], [1, 0]);
  const photoStyle = reduce ? undefined : { y: photoY, scale: photoScale, opacity: photoOpacity };

  const toDetails = () => {
    document.getElementById('room-details')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section className="relative h-[100svh] min-h-[480px] overflow-hidden bg-black">
      <motion.div className="absolute inset-0 will-change-transform" style={photoStyle}>
        {image && !failed ? (
          poster ? (
            <>
              <img src={image} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50 brightness-75" />
              <div className="absolute inset-x-0 top-20 bottom-24 flex justify-center px-4">
                <img
                  src={image}
                  alt={title}
                  onError={() => setFailed(true)}
                  className="h-full w-auto max-w-full object-contain rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                />
              </div>
            </>
          ) : (
            <>
              {/* Phones: a full-screen cover crop keeps only a slice of a wide
                  photo, so it is shown whole across the screen over a blurred
                  copy of itself. From md up it fills the screen as before. */}
              <img src={image} alt="" aria-hidden className="md:hidden absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-80" />
              <img
                ref={checkPoster}
                src={image}
                alt={title}
                onLoad={(e) => checkPoster(e.currentTarget)}
                onError={() => setFailed(true)}
                className="relative w-full h-full object-contain md:object-cover md:contrast-110 md:brightness-90 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] md:drop-shadow-none"
              />
            </>
          )
        ) : (
          <div className="w-full h-full bg-[radial-gradient(70%_70%_at_50%_55%,#2a1010,#0a0505)] flex items-center justify-center">
            <DoorOpen className="w-24 h-24 text-brand-border/60" />
          </div>
        )}
      </motion.div>

      {/* Fades into the page at the bottom, a little shade at the top for the navbar */}
      <div className="absolute inset-0 bg-linear-to-t from-brand-bg via-transparent to-black/40 pointer-events-none" />
      <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)] md:shadow-[inset_0_0_160px_rgba(0,0,0,0.85)] pointer-events-none" />

      {children}

      {/* Scroll cue: the room name and an arrow down to the details */}
      <motion.button
        type="button"
        onClick={toDetails}
        style={reduce ? undefined : { opacity: cueOpacity }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-brand-bone/90 hover:text-white"
        aria-label={title}
      >
        <span className="font-display text-sm tracking-[0.2em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{title}</span>
        <ChevronDown className={`w-6 h-6 ${reduce ? '' : 'animate-bounce'}`} />
      </motion.button>
    </section>
  );
}

/** Wraps the details under the hero: they slide up into place as they scroll in. */
export function RoomDetailsIn({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
