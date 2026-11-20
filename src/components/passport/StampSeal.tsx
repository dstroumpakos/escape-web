'use client';

import { Ghost, Search, Compass, Rocket, Landmark, Puzzle, Sparkles, Skull, Crown, Laugh, FlaskConical, Castle, KeyRound } from 'lucide-react';

/** Ink colour and icon of a room's stamp, by theme. */
const THEMES: Record<string, { color: string; Icon: React.ElementType }> = {
  Horror: { color: '#E24B4A', Icon: Ghost },
  Thriller: { color: '#D4537E', Icon: Skull },
  Mystery: { color: '#7F77DD', Icon: Search },
  Detective: { color: '#7F77DD', Icon: Search },
  Puzzle: { color: '#1D9E75', Icon: Puzzle },
  Adventure: { color: '#EF9F27', Icon: Compass },
  Historical: { color: '#BA7517', Icon: Landmark },
  'Sci-Fi': { color: '#378ADD', Icon: Rocket },
  Science: { color: '#378ADD', Icon: FlaskConical },
  Paranormal: { color: '#D4537E', Icon: Sparkles },
  Medieval: { color: '#BA7517', Icon: Castle },
  Fantasy: { color: '#EF9F27', Icon: Crown },
  Comedy: { color: '#639922', Icon: Laugh },
};
export function stampStyle(theme: string) {
  return THEMES[theme] ?? { color: '#E24B4A', Icon: KeyRound };
}

/** Small stable tilt from an id, so each stamp sits a little crooked like real ink. */
export function tiltFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 17) - 8;
}

export function StampSeal({
  title,
  theme,
  date,
  escaped,
  tilt = 0,
  size = 112,
  slam = false,
  onClick,
}: {
  title: string;
  theme: string;
  date: string;
  escaped: boolean;
  tilt?: number;
  size?: number;
  slam?: boolean;
  onClick?: () => void;
}) {
  const { color, Icon } = stampStyle(theme);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full flex flex-col items-center justify-center text-center p-2 transition-transform hover:scale-105 ${slam ? 'stamp-slam' : ''}`}
      style={{
        width: size,
        height: size,
        color,
        border: `3px solid ${color}`,
        boxShadow: `inset 0 0 0 4px transparent, inset 0 0 0 6px ${color}55`,
        transform: `rotate(${tilt}deg)`,
        ['--tilt' as any]: `${tilt}deg`,
      }}
    >
      <Icon className="w-5 h-5 mb-0.5" />
      <span className="text-[11px] font-bold leading-tight line-clamp-2 uppercase tracking-wide">{title}</span>
      <span className="text-[10px] opacity-80 tabular-nums">{date}</span>
      <span className="text-[9px] font-black tracking-[0.15em]">{escaped ? 'ESCAPED' : 'TRAPPED'}</span>
    </button>
  );
}
