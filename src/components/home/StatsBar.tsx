'use client';

import { Users, DoorOpen, Skull, Building2 } from 'lucide-react';
import { useSafeQuery } from '@/lib/useSafeQuery';
import { api } from '../../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';

function formatStat(value: number): string {
  if (value >= 1000) {
    const k = Math.floor(value / 1000);
    const remainder = value % 1000;
    return remainder >= 100 ? `${k},${Math.floor(remainder / 100)}00+` : `${k},000+`;
  }
  return value.toString();
}

/** Animate from 0 → target over ~1.6 s, with a nervous jitter near the end */
function useCountUp(target: number, duration = 1600) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
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
    { icon: Users, value: formatStat(players), label: t('stats.active_players') },
    { icon: DoorOpen, value: formatStat(rooms), label: t('stats.escape_rooms') },
    { icon: Skull, value: formatStat(escapes), label: t('stats.escapes_completed') },
    { icon: Building2, value: formatStat(venues), label: t('stats.partner_venues') },
  ];

  return (
    <section className="relative -mt-10 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateIn animation="scaleUp" duration={0.8}>
          <div className="relative rounded-md border border-brand-red/30 bg-black/85 backdrop-blur-md p-8 md:p-10 shadow-[0_0_60px_-10px_rgba(var(--glow),0.45),inset_0_0_60px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Tape across the corner */}
            <div className="absolute -left-6 top-3 rotate-[-28deg] w-28 h-6 bg-[#d8ccb4]/15 border-y border-[#d8ccb4]/10" />
            {/* Label */}
            <div className="absolute top-3 right-4 horror-label">{t('horror.body_count')}</div>
            {/* Light coming up from under the panel */}
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_120%,rgba(var(--glow),0.22),transparent_70%)]" />

            <StaggerContainer stagger={0.12} className="relative grid grid-cols-2 md:grid-cols-4 gap-y-8 pt-4 md:pt-2">
              {stats.map((stat, i) => (
                <StaggerItem key={i} animation="fadeUp" className={i > 0 ? 'md:border-l md:border-brand-border/70' : ''}>
                  <div className="text-center group px-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-brand-red/40 bg-brand-red/10 mb-3 shadow-[0_0_20px_rgba(var(--glow),0.35)] group-hover:animate-shake">
                      <stat.icon className="w-6 h-6 text-brand-red-light" />
                    </div>
                    <div
                      className="text-4xl md:text-5xl font-display font-black tabular-nums text-brand-bone text-blood-glow animate-flicker"
                      style={{ animationDelay: `${i * 1.3}s` }}
                    >
                      {platformStats ? stat.value : '—'}
                    </div>
                    <div className="font-type text-[13px] tracking-[0.12em] text-brand-text-secondary mt-2">
                      {stat.label}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
