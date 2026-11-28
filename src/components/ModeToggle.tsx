'use client';

import { usePathname } from 'next/navigation';
import { KeyRound, Skull } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { setMode, useMode, type Mode } from '@/lib/mode';

/**
 * Puzzles or horror, from anywhere (lib/mode.ts). Pressing the side you are on
 * again clears the choice: every room shows and the site goes back to both
 * sides at once. Not on the home page, which always shows both sides.
 */
export function ModeToggle({ withLabels = false }: { withLabels?: boolean }) {
  const { t } = useTranslation();
  const mode = useMode();
  const onHome = usePathname() === '/';
  const sides: { side: Mode; label: string; Icon: React.ElementType; on: string }[] = [
    { side: 'puzzle', label: t('mode.puzzle_short'), Icon: KeyRound, on: 'bg-[#f2c75c] text-[#1a1305]' },
    { side: 'horror', label: t('mode.horror_short'), Icon: Skull, on: 'bg-[#c8101b] text-white' },
  ];
  if (onHome) return null;
  return (
    <div role="group" aria-label={t('mode.toggle')} className="inline-flex items-center rounded-lg border border-brand-border/50 bg-brand-surface/50 p-0.5">
      {sides.map(({ side, label, Icon, on }) => {
        const active = mode === side;
        return (
          <button
            key={side}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => setMode(active ? null : side)}
            className={`group/tip relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              active ? on : 'text-brand-text-secondary hover:text-brand-bone'
            }`}
          >
            <Icon className="w-4 h-4" />
            {withLabels && <span>{label}</span>}
            {/* Shows at once on hover (a title tooltip waits a second or two) */}
            {!withLabels && (
              <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-brand-border bg-black/95 px-2.5 py-1 text-xs font-medium text-brand-bone shadow-lg opacity-0 translate-y-1 transition-[opacity,transform] duration-75 group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-visible/tip:opacity-100 z-50">{label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
