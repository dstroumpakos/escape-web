'use client';

import type { CSSProperties, ReactNode } from 'react';
import { KeyRound, Skull } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { Mode } from '@/lib/mode';

/**
 * The home page shows both sides at once, whatever the player picked
 * (lib/mode.ts → usePageMode). These pieces give each home section the same
 * look as the split hero: night-sky navy and gold for puzzles on the left,
 * blood red for horror on the right.
 *  - DualBackdrop: the section background, navy fading into red
 *  - SidePanel: one side's half; `.side-puzzle` (globals.css) turns every
 *    brand colour inside it to the puzzle side's
 *  - blendStyle: a colour between the two (0 = puzzle gold, 1 = horror red),
 *    for steps that walk from one side to the other
 */

/** Section background: navy on the left, red on the right (top and bottom on phones). */
export function DualBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 md:hidden"
        style={{ background: 'linear-gradient(180deg, #081128 0%, #0a1430 38%, #170609 62%, #1c0507 100%)' }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{ background: 'linear-gradient(100deg, #071026 0%, #0b1533 38%, #14070b 58%, #1d0507 100%)' }}
      />
      {/* A few stars on the puzzle side, a red glow on the horror side */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: [
            'radial-gradient(1px 1px at 8% 14%, rgba(255,255,255,0.55), transparent 60%)',
            'radial-gradient(1px 1px at 22% 62%, rgba(255,255,255,0.4), transparent 60%)',
            'radial-gradient(1.5px 1.5px at 31% 28%, rgba(242,199,92,0.6), transparent 60%)',
            'radial-gradient(1px 1px at 14% 86%, rgba(255,255,255,0.35), transparent 60%)',
            'radial-gradient(1px 1px at 40% 8%, rgba(255,255,255,0.35), transparent 60%)',
            'radial-gradient(50% 60% at 18% 40%, rgba(40,70,140,0.22), transparent 70%)',
            'radial-gradient(50% 60% at 85% 70%, rgba(150,10,20,0.22), transparent 70%)',
          ].join(','),
        }}
      />
    </div>
  );
}

/** One side's half: its colours, a soft panel and a small header. */
export function SidePanel({ side, children, className = '' }: { side: Mode; children: ReactNode; className?: string }) {
  const { t } = useTranslation();
  const puzzle = side === 'puzzle';
  const Icon = puzzle ? KeyRound : Skull;
  return (
    <div
      className={`${puzzle ? 'side-puzzle' : 'side-horror'} relative rounded-2xl border p-4 sm:p-6 ${
        puzzle
          ? 'border-[#f2c75c]/20 bg-[#0a1430]/60 shadow-[0_0_60px_-30px_rgba(242,199,92,0.45)]'
          : 'border-[#c8101b]/25 bg-[#1a0507]/60 shadow-[0_0_60px_-30px_rgba(200,16,27,0.6)]'
      } ${className}`}
    >
      <div className={`mb-5 flex items-center gap-2 font-display text-lg sm:text-xl font-bold ${puzzle ? 'text-[#f6d27a]' : 'text-[#ff4a52]'}`}>
        <Icon className="w-5 h-5" />
        {t(puzzle ? 'mode.puzzle_title2' : 'mode.horror_title2')}
      </div>
      {children}
    </div>
  );
}

const GOLD = { red: [217, 165, 58], light: [242, 199, 92], hi: [242, 199, 92] };
const RED = { red: [200, 16, 27], light: [255, 42, 54], hi: [255, 30, 40] };
const mix = (a: number[], b: number[], t: number) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
const rgb = (c: number[]) => `rgb(${c.join(',')})`;

/** Brand colours between puzzle gold (0) and horror red (1), as inline CSS variables. */
export function blendStyle(t: number): CSSProperties {
  const red = mix(GOLD.red, RED.red, t);
  const light = mix(GOLD.light, RED.light, t);
  const hi = mix(GOLD.hi, RED.hi, t);
  return {
    '--color-brand-red': rgb(red),
    '--color-brand-red-light': rgb(light),
    '--glow': red.join(','),
    '--glow-hi': hi.join(','),
    '--candle': hi.join(','),
  } as CSSProperties;
}
