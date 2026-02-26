'use client';

import { Star, Quote } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t('testimonials.t1.name'),
      avatar: 'MK',
      role: t('testimonials.t1.role'),
      rating: 5,
      text: t('testimonials.t1.text'),
    },
    {
      name: t('testimonials.t2.name'),
      avatar: 'DP',
      role: t('testimonials.t2.role'),
      rating: 5,
      text: t('testimonials.t2.text'),
    },
    {
      name: t('testimonials.t3.name'),
      avatar: 'SL',
      role: t('testimonials.t3.role'),
      rating: 5,
      text: t('testimonials.t3.text'),
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="section-heading mb-4">
            {t('testimonials.title')} <span className="text-gradient">{t('testimonials.title_highlight')}</span>
          </h2>
          <p className="section-subheading mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="card p-6 md:p-8 relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-brand-border/30" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 text-brand-gold fill-brand-gold"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-brand-text-secondary text-sm leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-brand-text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
