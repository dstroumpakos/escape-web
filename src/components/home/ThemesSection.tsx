'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { ROOM_THEMES } from '@/lib/roomThemes';
import { useMode, SUBTHEMES } from '@/lib/mode';
import { StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import { HorrorHeading } from '@/components/horror/HorrorHeading';

/** The subcategories of a side (or of both), as theme tiles. */
const tilesFor = (values: string[]) => ROOM_THEMES.filter((th) => values.includes(th.value));
const bothSides = Array.from(new Set([...SUBTHEMES.puzzle, ...SUBTHEMES.horror]));

export function ThemesSection() {
  const { t } = useTranslation();
  const mode = useMode();
  const themes = tilesFor(mode ? SUBTHEMES[mode] : bothSides);
  return (
    <section className="relative py-24 md:py-32 bg-brand-dark overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_100%,rgba(92,0,8,0.35),transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HorrorHeading
          kicker={t('horror.enter')}
          title={t('themes.title')}
          highlight={t('themes.title_highlight')}
          subtitle={t('themes.subtitle')}
        />

        <StaggerContainer stagger={0.08} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5">
          {themes.map((theme, i) => (
            <StaggerItem key={i} animation="scaleUp">
              <Link
                href={`/discover?theme=${encodeURIComponent(theme.value)}`}
                className="group relative block w-full overflow-hidden rounded-md border border-brand-border bg-brand-card/80 px-4 py-7 md:py-9 transition-all duration-500 hover:-translate-y-1 hover:border-brand-red/60 hover:shadow-[0_20px_50px_-15px_rgba(var(--glow),0.6)]"
              >
                {/* Each theme's own light: a glimmer at rest, rising on hover */}
                <span
                  className="absolute inset-0 translate-y-[38%] opacity-80 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                  style={{ background: `radial-gradient(90% 80% at 50% 100%, ${theme.tint}, transparent 75%)` }}
                />
                {/* Crack that appears on hover */}
                <svg
                  aria-hidden
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                  fill="none"
                  stroke="#000"
                  strokeWidth="1"
                  preserveAspectRatio="none"
                >
                  <path d="M100 8 L84 18 L88 26 L72 34 L76 42 L62 50" />
                  <path d="M84 18 L92 30" />
                </svg>
                {/* Numbered like evidence */}
                <span className="absolute top-2 left-3 font-type text-[10px] text-brand-text-muted tracking-widest">
                  #{String(i + 1).padStart(3, '0')}
                </span>

                <div className="relative z-10 flex flex-col items-center gap-3">
                  <theme.icon className="w-8 h-8 md:w-10 md:h-10 text-brand-text-secondary group-hover:text-brand-bone group-hover:animate-shake transition-colors duration-300 drop-shadow-[0_0_12px_rgba(var(--glow),0.0)] group-hover:drop-shadow-[0_0_14px_rgba(var(--glow-hi),0.8)]" />
                  <span className="font-display text-base md:text-lg font-bold text-brand-text group-hover:text-brand-bone transition-colors">
                    {t(theme.key)}
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
