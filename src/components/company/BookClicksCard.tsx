'use client';

import Link from 'next/link';
import { MousePointerClick, Globe } from 'lucide-react';
import { useCompanyQuery, useCompanyPath } from '@/lib/companyAuth';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

/** How many players "Book now" sent to the company's own site (last 30 days). */
export function BookClicksCard({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const p = useCompanyPath();
  const data = useCompanyQuery(api.externalLinks.companyClicks, { companyId: companyId as any });
  if (!data) return null;
  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-brand-red-light" /> {t('cx.clicks.title')}
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">{t('cx.clicks.desc')}</p>
        </div>
        <div className="text-3xl font-bold tabular-nums">{data.total}</div>
      </div>
      {data.rooms.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {data.rooms.slice(0, 5).map((r) => (
            <div key={r.roomId} className="flex items-center justify-between text-sm">
              <span className="truncate text-brand-text-secondary">{r.title}</span>
              <span className="tabular-nums font-semibold">{r.clicks}</span>
            </div>
          ))}
        </div>
      )}
      {!data.hasWebsite && (
        <Link href={p('/company/settings')} className="mt-4 flex items-center gap-2 text-xs text-brand-red-light hover:underline">
          <Globe className="w-3.5 h-3.5" /> {t('cx.clicks.no_site')}
        </Link>
      )}
    </div>
  );
}
