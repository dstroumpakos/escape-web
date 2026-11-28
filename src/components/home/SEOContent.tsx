'use client';

import Link from 'next/link';
import { DualBackdrop } from './DualSides';
import { useTranslation } from '@/lib/i18n';

export function SEOContent() {
  const { t } = useTranslation();

  return (
    <section className="relative border-t border-white/10 py-14 overflow-hidden">
      {/* Both sides like the rest of the home (DualSides.tsx), just quieter */}
      <div aria-hidden className="absolute inset-0 opacity-60"><DualBackdrop /></div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 md:columns-2 md:gap-12 [&>*]:break-inside-avoid">
        {/* H2: What is UNLOCKED */}
        <h2 className="text-lg font-display font-bold text-brand-text mb-3">
          {t('seo.what_title')}{' '}
          <span>{t('seo.what_highlight')}</span>
        </h2>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-4">
          {t('seo.what_p1')}
        </p>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-8">
          {t('seo.what_p2')}
        </p>

        {/* H2: For Players */}
        <h2 className="text-lg font-display font-bold text-brand-text mb-3">
          {t('seo.players_title')}{' '}
          <span>{t('seo.players_highlight')}</span>
        </h2>

        <h3 className="text-sm font-semibold mb-1.5 text-brand-text-secondary">
          {t('seo.players_discover_h3')}
        </h3>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-4">
          {t('seo.players_discover_p')}
        </p>

        <h3 className="text-sm font-semibold mb-1.5 text-brand-text-secondary">
          {t('seo.players_book_h3')}
        </h3>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-4">
          {t('seo.players_book_p')}
        </p>

        <h3 className="text-sm font-semibold mb-1.5 text-brand-text-secondary">
          {t('seo.players_social_h3')}
        </h3>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-8">
          {t('seo.players_social_p')}
        </p>

        {/* H2: Why Choose UNLOCKED */}
        <h2 className="text-lg font-display font-bold text-brand-text mb-3">
          {t('seo.why_title')}{' '}
          <span>{t('seo.why_highlight')}</span>
        </h2>
        <ul className="space-y-1.5 text-sm text-brand-text-muted mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-brand-red/70">✓</span>
              <span>{t(`seo.why_point${i}`)}</span>
            </li>
          ))}
        </ul>

        {/* H2: Getting Started */}
        <h2 className="text-lg font-display font-bold text-brand-text mb-3">
          {t('seo.start_title')}{' '}
          <span>{t('seo.start_highlight')}</span>
        </h2>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-4">
          {t('seo.start_p')}
        </p>

        {/* CTA Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/discover" className="text-brand-red-light underline-offset-4 hover:underline">
            {t('seo.cta_discover')}
          </Link>
          <Link href="/signup" className="text-brand-red-light underline-offset-4 hover:underline">
            {t('seo.cta_signup')}
          </Link>
        </div>
      </div>
    </section>
  );
}
