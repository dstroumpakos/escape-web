'use client';

import { useTranslation } from '@/lib/i18n';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  const { t } = useTranslation();

  const sections = [
    { title: t('legal.privacy.section1_title'), text: t('legal.privacy.section1_text') },
    { title: t('legal.privacy.section2_title'), text: t('legal.privacy.section2_text') },
    { title: t('legal.privacy.section3_title'), text: t('legal.privacy.section3_text') },
    { title: t('legal.privacy.section4_title'), text: t('legal.privacy.section4_text') },
    { title: t('legal.privacy.section5_title'), text: t('legal.privacy.section5_text') },
    { title: t('legal.privacy.section6_title'), text: t('legal.privacy.section6_text') },
  ];

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-brand-red" />
          <h1 className="text-3xl font-bold">{t('legal.privacy.title')}</h1>
        </div>
        <p className="text-sm text-brand-text-muted mb-8">{t('legal.privacy.last_updated')}</p>

        <p className="text-brand-text-secondary mb-10 leading-relaxed">{t('legal.privacy.intro')}</p>

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
