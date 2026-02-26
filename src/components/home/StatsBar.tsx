'use client';

import { Users, DoorOpen, Trophy, Building2 } from 'lucide-react';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

function formatStat(value: number): string {
  if (value >= 1000) {
    const k = Math.floor(value / 1000);
    const remainder = value % 1000;
    return remainder >= 100 ? `${k},${Math.floor(remainder / 100)}00+` : `${k},000+`;
  }
  return value.toString();
}

/** Animate from 0 → target over ~1.2 s */
function useCountUp(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return current;
}

export function StatsBar() {
  const { t } = useTranslation();
  const platformStats = useSafeQuery<{ totalPlayers: number; totalRooms: number; completedEscapes: number; partnerVenues: number }>(
    api.stats.getPlatformStats
  );

  const players = useCountUp(platformStats?.totalPlayers ?? 0);
  const rooms = useCountUp(platformStats?.totalRooms ?? 0);
  const escapes = useCountUp(platformStats?.completedEscapes ?? 0);
  const venues = useCountUp(platformStats?.partnerVenues ?? 0);

  const stats = [
    { icon: Users,     value: formatStat(players),  label: t('stats.active_players') },
    { icon: DoorOpen,  value: formatStat(rooms),     label: t('stats.escape_rooms') },
    { icon: Trophy,    value: formatStat(escapes),   label: t('stats.escapes_completed') },
    { icon: Building2, value: formatStat(venues),    label: t('stats.partner_venues') },
  ];

  return (
    <section className="relative -mt-1 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-2xl p-8 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-red/10 mb-3">
                  <stat.icon className="w-6 h-6 text-brand-red" />
                </div>
                <div className="text-2xl md:text-3xl font-display font-bold text-white">
                  {platformStats ? stat.value : '—'}
                </div>
                <div className="text-sm text-brand-text-muted mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
