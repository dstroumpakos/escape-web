'use client';

import { Building2, BarChart2, Calendar, QrCode, ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function ForBusinesses() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Calendar,
      title: t('business.feature1.title'),
      desc: t('business.feature1.desc'),
    },
    {
      icon: QrCode,
      title: t('business.feature2.title'),
      desc: t('business.feature2.desc'),
    },
    {
      icon: BarChart2,
      title: t('business.feature3.title'),
      desc: t('business.feature3.desc'),
    },
    {
      icon: Building2,
      title: t('business.feature4.title'),
      desc: t('business.feature4.desc'),
    },
    {
      icon: Globe,
      title: t('business.feature5.title'),
      desc: t('business.feature5.desc'),
      link: '/services/website',
    },
  ];

  const dayKeys = ['business.mon', 'business.tue', 'business.wed', 'business.thu', 'business.fri', 'business.sat', 'business.sun'];

  return (
    <section id="for-businesses" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <span className="inline-block text-brand-red text-sm font-semibold uppercase tracking-wider mb-3">
              {t('business.label')}
            </span>
            <h2 className="section-heading mb-6">
              {t('business.title')}{' '}
              <span className="text-gradient">{t('business.title_highlight')}</span>
            </h2>
            <p className="text-brand-text-secondary mb-8 leading-relaxed">
              {t('business.subtitle')}
            </p>

            <div className="space-y-5 mb-8">
              {features.map((f, i) => {
                const content = (
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                      <p className="text-sm text-brand-text-secondary">
                        {f.desc}
                      </p>
                      {'link' in f && f.link && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-red font-medium mt-1.5 group-hover/feat:gap-2 transition-all">
                          {t('business.learn_more')} <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );

                if ('link' in f && f.link) {
                  return (
                    <Link key={i} href={f.link} className="block group/feat hover:bg-brand-surface/30 -mx-3 px-3 py-2 rounded-xl transition-colors">
                      {content}
                    </Link>
                  );
                }

                return <div key={i}>{content}</div>;
              })}
            </div>

            <Link
              href="/company/register"
              className="btn-primary inline-flex items-center gap-2"
            >
              {t('business.cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right illustration */}
          <div className="relative">
            <div className="absolute -inset-4 bg-brand-red/5 rounded-3xl blur-2xl" />
            <div className="relative card p-8 md:p-10">
              {/* Mock dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">{t('business.dashboard')}</h3>
                  <span className="text-xs text-brand-text-muted">{t('business.today')}</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('business.bookings'), value: '24' },
                    { label: t('business.revenue'), value: '€1,240' },
                    { label: t('business.fill_rate'), value: '87%' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="bg-brand-surface rounded-xl p-3 text-center"
                    >
                      <div className="text-lg font-bold text-brand-red">
                        {s.value}
                      </div>
                      <div className="text-xs text-brand-text-muted">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock chart bars */}
                <div className="bg-brand-surface rounded-xl p-4">
                  <div className="text-xs text-brand-text-muted mb-3">
                    {t('business.weekly_bookings')}
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {[40, 65, 55, 80, 90, 70, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-brand-red/30 hover:bg-brand-red/50 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-brand-text-muted">
                    {dayKeys.map((d) => (
                      <span key={d}>{t(d)}</span>
                    ))}
                  </div>
                </div>

                {/* Mock upcoming bookings */}
                <div className="space-y-2">
                  {[
                    { time: '14:00', room: 'Haunted Mansion', players: 4 },
                    { time: '15:30', room: 'Prison Break', players: 6 },
                    { time: '17:00', room: 'Egyptian Tomb', players: 3 },
                  ].map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-brand-surface/50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-brand-red">
                          {b.time}
                        </span>
                        <span className="text-sm">{b.room}</span>
                      </div>
                      <span className="text-xs text-brand-text-muted">
                        {b.players} {t('business.players')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
