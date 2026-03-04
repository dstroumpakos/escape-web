'use client';

import {
  Skull,
  Compass,
  Search as SearchIcon,
  Landmark,
  Cpu,
  Microscope,
  Ghost,
  Swords,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';

const themes = [
  { key: 'theme.horror', icon: Skull, color: 'from-red-600 to-red-900' },
  { key: 'theme.adventure', icon: Compass, color: 'from-amber-600 to-amber-900' },
  { key: 'theme.mystery', icon: SearchIcon, color: 'from-purple-600 to-purple-900' },
  { key: 'theme.history', icon: Landmark, color: 'from-yellow-600 to-yellow-900' },
  { key: 'theme.scifi', icon: Cpu, color: 'from-cyan-600 to-cyan-900' },
  { key: 'theme.science', icon: Microscope, color: 'from-green-600 to-green-900' },
  { key: 'theme.paranormal', icon: Ghost, color: 'from-indigo-600 to-indigo-900' },
  { key: 'theme.medieval', icon: Swords, color: 'from-orange-600 to-orange-900' },
];

export function ThemesSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 md:py-28 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateIn animation="fadeUp" className="text-center mb-14">
          <h2 className="section-heading mb-4">
            {t('themes.title')} <span className="text-gradient">{t('themes.title_highlight')}</span>
          </h2>
          <p className="section-subheading mx-auto">
            {t('themes.subtitle')}
          </p>
        </AnimateIn>

        <StaggerContainer stagger={0.08} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {themes.map((theme, i) => (
            <StaggerItem key={i} animation="scaleUp">
              <button
                className="group relative overflow-hidden rounded-2xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full"
              >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-20 group-hover:opacity-30 transition-opacity`}
              />
              <div className="absolute inset-0 bg-brand-card/60 group-hover:bg-brand-card/40 transition-colors" />
              <div className="absolute inset-0 border border-brand-border/30 rounded-2xl group-hover:border-brand-red/20 transition-colors" />

              <div className="relative z-10 flex flex-col items-center gap-3">
                <theme.icon className="w-8 h-8 md:w-10 md:h-10 text-brand-text-secondary group-hover:text-brand-red group-hover:scale-110 transition-all duration-300" />
                <span className="text-sm md:text-base font-medium text-brand-text-secondary group-hover:text-white transition-colors">
                  {t(theme.key)}
                </span>
              </div>
            </button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
