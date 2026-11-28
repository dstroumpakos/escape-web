'use client';

import { useEffect, useState } from 'react';

/**
 * Christmas decorations (components/seasonal/ChristmasDecor.tsx): lights under
 * the navbar, snow, a Santa hat on the logo. They only add things on top of the
 * site and switch themselves off after the holidays, so the site goes back to
 * how it was with no deploy.
 *
 * On from 1 December to 7 January (the visitor's own date).
 * NEXT_PUBLIC_CHRISTMAS=1 forces them on (e.g. to look at them early),
 * NEXT_PUBLIC_CHRISTMAS=0 forces them off.
 */
export function isChristmasSeason(d: Date = new Date()): boolean {
  const force = process.env.NEXT_PUBLIC_CHRISTMAS;
  if (force === '1') return true;
  if (force === '0') return false;
  const m = d.getMonth(); // 0 = January, 11 = December
  return m === 11 || (m === 0 && d.getDate() <= 7);
}

/** False on the server and the first render (no hydration mismatch), then the real answer. */
export function useChristmas(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isChristmasSeason()), []);
  return on;
}
