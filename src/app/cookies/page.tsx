'use client';

import { useTranslation } from '@/lib/i18n';
import { Cookie } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CookiesPage() {
  const { t } = useTranslation();

  const sections = [
    { title: t('legal.cookies.section1_title'), text: t('legal.cookies.section1_text') },
    { title: t('legal.cookies.section2_title'), text: t('legal.cookies.section2_text') },
    { title: t('legal.cookies.section3_title'), text: t('legal.cookies.section3_text') },
    { title: t('legal.cookies.section4_title'), text: t('legal.cookies.section4_text') },
    { title: t('legal.cookies.section5_title'), text: t('legal.cookies.section5_text') },
  ];

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Cookie className="w-8 h-8 text-brand-red" />
          <h1 className="text-3xl font-bold">{t('legal.cookies.title')}</h1>
        </div>
        <p className="text-sm text-brand-text-muted mb-8">{t('legal.cookies.last_updated')}</p>

        <p className="text-brand-text-secondary mb-10 leading-relaxed">{t('legal.cookies.intro')}</p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <p className="text-brand-text-secondary leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
