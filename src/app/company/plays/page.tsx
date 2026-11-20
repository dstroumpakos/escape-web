'use client';

import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth, useCompanyMutation, useCompanyQuery } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { ReviewList } from '@/components/plays/ReviewList';

type View = 'pending' | 'declared' | 'done';

/**
 * Rooms Played: players who added one of the company's rooms by hand (no QR
 * stamp) and sent a proof. Approving makes it count in their passport
 * (convex/plays.ts).
 */
export default function CompanyPlaysPage() {
  const { t } = useTranslation();
  const { company } = useCompanyAuth();
  const [view, setView] = useState<View>('pending');
  const rows = useCompanyQuery(api.plays.companyQueue, company ? { view } : 'skip');
  const pending = useCompanyQuery(api.plays.companyPendingCount, company ? {} : 'skip');
  const review = useCompanyMutation(api.plays.companyReview);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <ListChecks className="w-7 h-7 text-brand-red-light" /> {t('cx.pl.title')}
      </h1>
      <p className="text-brand-text-secondary mt-1 text-sm mb-6">{t('cx.pl.subtitle')}</p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {(['pending', 'declared', 'done'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${view === v ? 'bg-brand-red text-white' : 'bg-brand-surface border border-white/5 text-brand-text-secondary hover:text-white'}`}
          >
            {t(`cx.pl.view_${v}`)}
            {v === 'pending' && pending ? <span className="ml-2 rounded-full bg-white/20 px-1.5 text-xs">{pending}</span> : null}
          </button>
        ))}
      </div>
      {view === 'declared' && <p className="text-xs text-brand-text-secondary mb-3">{t('cx.pl.declared_hint')}</p>}

      <ReviewList
        rows={rows as any}
        readOnly={view === 'done'}
        onReview={(ids, approve, note) => review({ logIds: ids as any, approve, note })}
      />
    </div>
  );
}
