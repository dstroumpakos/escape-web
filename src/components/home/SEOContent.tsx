'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function SEOContent() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* H2: What is UNLOCKED */}
        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
          {t('seo.what_title')}{' '}
          <span className="text-gradient">{t('seo.what_highlight')}</span>
        </h2>
        <p className="text-brand-text-secondary leading-relaxed mb-6">
          {t('seo.what_p1')}
        </p>
        <p className="text-brand-text-secondary leading-relaxed mb-12">
          {t('seo.what_p2')}
        </p>

        {/* H2: For Players */}
        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
          {t('seo.players_title')}{' '}
          <span className="text-gradient">{t('seo.players_highlight')}</span>
        </h2>

        <h3 className="text-xl font-semibold mb-3 text-white">
          {t('seo.players_discover_h3')}
        </h3>
        <p className="text-brand-text-secondary leading-relaxed mb-6">
          {t('seo.players_discover_p')}
        </p>

        <h3 className="text-xl font-semibold mb-3 text-white">
          {t('seo.players_book_h3')}
        </h3>
        <p className="text-brand-text-secondary leading-relaxed mb-6">
          {t('seo.players_book_p')}
        </p>

        <h3 className="text-xl font-semibold mb-3 text-white">
          {t('seo.players_social_h3')}
        </h3>
        <p className="text-brand-text-secondary leading-relaxed mb-12">
          {t('seo.players_social_p')}
        </p>

        {/* H2: Why Choose UNLOCKED */}
        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
          {t('seo.why_title')}{' '}
          <span className="text-gradient">{t('seo.why_highlight')}</span>
        </h2>
        <ul className="space-y-3 text-brand-text-secondary mb-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-brand-red mt-1">✓</span>
              <span>{t(`seo.why_point${i}`)}</span>
            </li>
          ))}
        </ul>

        {/* H2: Getting Started */}
        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
          {t('seo.start_title')}{' '}
          <span className="text-gradient">{t('seo.start_highlight')}</span>
        </h2>
        <p className="text-brand-text-secondary leading-relaxed mb-8">
          {t('seo.start_p')}
        </p>

        {/* CTA Links */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/discover" className="btn-primary text-center">
            {t('seo.cta_discover')}
          </Link>
          <Link href="/signup" className="btn-outline text-center">
            {t('seo.cta_signup')}
          </Link>
        </div>
      </div>
    </section>
  );
}
