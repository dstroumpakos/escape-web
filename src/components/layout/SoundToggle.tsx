'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { toggleMusic, useMusicEnabled } from '@/lib/ambient';
import { useTranslation } from '@/lib/i18n';

/** Background music on/off (lib/ambient.ts), with an instant tooltip. */
export function SoundToggle({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const on = useMusicEnabled();
  const label = on ? t('music.turn_off') : t('music.turn_on');
  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-pressed={on}
      aria-label={label}
      className={`group/tip relative p-2 rounded-md transition-colors ${
        on ? 'text-brand-red-light hover:bg-brand-red/10' : 'text-brand-text-secondary hover:text-brand-bone hover:bg-white/5'
      } ${className}`}
    >
      {on ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-brand-border bg-black/95 px-2.5 py-1 text-xs font-medium text-brand-bone shadow-lg opacity-0 translate-y-1 transition-[opacity,transform] duration-75 group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-visible/tip:opacity-100 z-50"
      >
        {label}
      </span>
    </button>
  );
}
