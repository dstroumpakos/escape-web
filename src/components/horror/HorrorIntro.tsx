'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

/**
 * Cold open that plays on every full load of the homepage, refreshes included.
 * It is rendered on the server and fades itself out with a CSS animation, so it
 * never gets stuck if JS is slow. Click to skip.
 */
// Set (client side only) once the intro has mounted. It resets on every refresh,
// but stops a replay when someone clicks back to the homepage inside the site.
let startedThisPageLoad = false;

export function HorrorIntro() {
  const { t } = useTranslation();
  const [gone, setGone] = useState(() => startedThisPageLoad);

  useEffect(() => {
    startedThisPageLoad = true;
  }, []);

  const finish = () => setGone(true);

  if (gone) return null;

  return (
    <div
      className="horror-intro fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black cursor-pointer select-none"
      style={{ animation: 'intro-out 3s ease-in forwards' }}
      onClick={finish}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(40% 35% at 50% 50%, rgba(140,0,10,0.35), transparent 70%)' }}
      />
      <div className="relative font-blood text-4xl sm:text-6xl md:text-7xl tracking-wider text-brand-red-light text-blood-glow animate-flicker-fast">
        UNLOCKED
      </div>
      <div className="relative mt-3 font-sans font-semibold uppercase text-xs sm:text-sm tracking-[0.6em] -mr-[0.6em] text-brand-bone/80">
        Escape Rooms
      </div>
      <svg viewBox="0 0 400 60" className="relative mt-6 w-[min(80vw,420px)] h-14" fill="none">
        <path
          d="M0 30 H120 L135 30 L145 8 L158 52 L170 18 L178 30 H250 L262 30 L270 12 L282 48 L290 30 H400"
          stroke="#ff2a36"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="1000"
          style={{ animation: 'ekg-draw 2.2s linear forwards', filter: 'drop-shadow(0 0 6px rgba(255,40,50,0.9))' }}
        />
      </svg>
      <p className="relative mt-6 font-type text-sm sm:text-base text-brand-text-secondary tracking-[0.2em]">
        {t('horror.intro')}
        <span className="ml-1 inline-block w-2 h-4 align-middle bg-brand-red-light animate-blink" />
      </p>
    </div>
  );
}
