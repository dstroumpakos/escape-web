'use client';

import { KeyRound, Skull } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { setMode, useMode, type Mode } from '@/lib/mode';

/**
 * Puzzles or horror, from anywhere (lib/mode.ts). Pressing the side you are on
 * again clears the choice, so every room shows and the home asks again.
 */
export function ModeToggle({ withLabels = false }: { withLabels?: boolean }) {
  const { t } = useTranslation();
  const mode = useMode();
  const sides: { side: Mode; label: string; Icon: React.ElementType; on: string }[] = [
    { side: 'puzzle', label: t('mode.puzzle_short'), Icon: KeyRound, on: 'bg-[#f2c75c] text-[#1a1305]' },
    { side: 'horror', label: t('mode.horror_short'), Icon: Skull, on: 'bg-[#c8101b] text-white' },
  ];
  return (
    <div role="group" aria-label={t('mode.toggle')} className="inline-flex items-center rounded-lg border border-brand-border/50 bg-brand-surface/50 p-0.5">
      {sides.map(({ side, label, Icon, on }) => {
        const active = mode === side;
        return (
          <button
            key={side}
            type="button"
            aria-pressed={active}
            title={label}
            aria-label={label}
            onClick={() => setMode(active ? null : side)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              active ? on : 'text-brand-text-secondary hover:text-brand-bone'
            }`}
          >
            <Icon className="w-4 h-4" />
            {withLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
