'use client';

import { Ghost, KeyRound, Skull } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { FEAR_LEVELS, type Fear } from '@/lib/mode';

const LOOK: Record<Fear, { Icon: React.ElementType; on: string }> = {
  none: { Icon: KeyRound, on: 'border-sky-400/70 bg-sky-500/10 text-sky-200' },
  some: { Icon: Ghost, on: 'border-amber-400/70 bg-amber-500/10 text-amber-200' },
  high: { Icon: Skull, on: 'border-red-500/70 bg-red-500/10 text-red-200' },
};

/**
 * How scary a room is (rooms.fearLevel). Decides which side of the site shows it:
 * puzzle players never see "Horror", "A little fear" shows on both sides.
 */
export function FearPicker({ value, onChange }: { value: Fear; onChange: (f: Fear) => void }) {
  const { t } = useTranslation();
  return (
    <fieldset className="col-span-full">
      <legend className="block text-sm font-medium text-brand-text-secondary mb-1.5">{t('fear.label')}</legend>
      <p className="text-xs text-brand-text-muted mb-3">{t('fear.hint')}</p>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
        {FEAR_LEVELS.map((f) => {
          const { Icon, on } = LOOK[f];
          const active = value === f;
          return (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(f)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                active ? on : 'border-white/10 bg-brand-bg text-brand-text-secondary hover:border-white/25'
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-sm">
                <Icon className="w-4 h-4" /> {t(`fear.${f}`)}
              </span>
              <span className="mt-1 block text-xs opacity-80">{t(`fear.${f}_desc`)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
