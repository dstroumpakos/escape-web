'use client';

import { CalendarCog } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/**
 * The room's booking options (payment terms, operating days, default slots)
 * stay closed until the company switches them on.
 */
export function BookingOptionsToggle({
  on,
  onChange,
  children,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 flex items-center gap-4">
        <CalendarCog className="w-6 h-6 text-brand-red-light shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold">{t('room.booking_opts.title')}</h2>
          <p className="text-sm text-brand-text-secondary mt-0.5">
            {on ? t('room.booking_opts.on_hint') : t('room.booking_opts.off_hint')}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t('room.booking_opts.title')}
          onClick={() => onChange(!on)}
          className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${on ? 'bg-brand-red' : 'bg-white/15'}`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      {on && children}
    </>
  );
}
