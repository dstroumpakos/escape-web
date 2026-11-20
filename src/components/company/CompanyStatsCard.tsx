'use client';

import Link from 'next/link';
import { Eye, MousePointerClick, Users, Stamp, Star, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { useCompanyQuery, useCompanyPath } from '@/lib/companyAuth';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

/** What UNLOCKED did for the company in the last 30 days (convex/companyStats.ts). */
export function CompanyStatsCard({ companyId }: { companyId: string }) {
  const { t, language } = useTranslation();
  const p = useCompanyPath();
  const data = useCompanyQuery(api.companyStats.overview, { companyId: companyId as any });
  if (!data) return null;

  const max = Math.max(1, ...data.days.map((d) => d.views));
  const fmtDay = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString(language === 'el' ? 'el-GR' : language === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short' });
  const empty = data.views === 0 && data.clicks === 0;

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-bold">{t('st.title')}</h2>
        <span className="text-xs text-brand-text-muted">{t('st.period')}</span>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <Tile icon={<Eye className="w-4 h-4" />} label={t('st.views')} value={data.views} delta={<Delta now={data.views} before={data.viewsBefore} t={t} />} />
        <Tile icon={<MousePointerClick className="w-4 h-4" />} label={t('st.clicks')} value={data.clicks} delta={<Delta now={data.clicks} before={data.clicksBefore} t={t} />} />
        <Tile icon={<Users className="w-4 h-4" />} label={t('st.followers')} value={data.followers} delta={data.newFollowers > 0 ? <span className="text-xs text-brand-text-secondary">{t('st.new_n', { n: String(data.newFollowers) })}</span> : null} />
        <Tile icon={<Stamp className="w-4 h-4" />} label={t('st.stamps')} value={data.stamps} />
        <Tile
          icon={<Star className="w-4 h-4" />}
          label={t('st.rating')}
          value={data.reviews ? data.rating.toFixed(1) : '–'}
          delta={<span className="text-xs text-brand-text-secondary">{t('st.reviews_n', { n: String(data.reviews) })}</span>}
        />
      </div>

      {/* Views per day: one series, so the title names it (no legend) */}
      {empty ? (
        <p className="text-sm text-brand-text-secondary mt-5">{t('st.no_data')}</p>
      ) : (
        <div className="mt-6">
          <h3 className="text-xs text-brand-text-secondary mb-2">{t('st.chart')}</h3>
          <div className="relative h-28 flex items-end gap-[2px] border-b border-white/10" role="img" aria-label={t('st.chart')}>
            {data.days.map((d) => (
              <div key={d.date} className="group relative flex-1 h-full flex items-end">
                <div
                  className="w-full rounded-t-[4px] bg-brand-red/80 group-hover:bg-brand-red transition-colors"
                  style={{ height: d.views ? `${Math.max(4, (d.views / max) * 100)}%` : 0 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded-md bg-black/90 border border-white/10 px-2 py-1 text-[11px] text-white z-10">
                  {t('st.day_tip', { date: fmtDay(d.date), views: String(d.views), clicks: String(d.clicks) })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-brand-text-muted mt-1">
            <span>{fmtDay(data.days[0].date)}</span>
            <span>{fmtDay(data.days[data.days.length - 1].date)}</span>
          </div>
        </div>
      )}

      {/* Per room (also the table view of the chart's totals) */}
      {data.rooms.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-text-muted text-left">
                <th className="font-medium py-1.5">{t('st.room')}</th>
                <th className="font-medium py-1.5 text-right"><Eye className="w-3.5 h-3.5 inline" aria-label={t('st.views')} /></th>
                <th className="font-medium py-1.5 text-right"><MousePointerClick className="w-3.5 h-3.5 inline" aria-label={t('st.clicks')} /></th>
                <th className="font-medium py-1.5 text-right"><Stamp className="w-3.5 h-3.5 inline" aria-label={t('st.stamps')} /></th>
              </tr>
            </thead>
            <tbody>
              {data.rooms.slice(0, 8).map((r) => (
                <tr key={r.roomId} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 text-brand-text-secondary truncate max-w-[14rem]">{r.title || '—'}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.views}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.clicks}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.stamps}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

function Tile({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: number | string; delta?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/5 p-3">
      <div className="flex items-start gap-1.5 text-xs leading-tight text-brand-text-secondary min-h-[2rem]">
        <span className="text-brand-red-light shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
      {delta && <div className="mt-0.5">{delta}</div>}
    </div>
  );
}

/** Change vs the 30 days before, with an arrow so it isn't color alone. */
function Delta({ now, before, t }: { now: number; before: number; t: (k: string) => string }) {
  if (!before) return null;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span className={`text-xs inline-flex items-center gap-1 ${up ? 'text-emerald-400' : 'text-brand-text-secondary'}`} title={t('st.vs_before')}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{pct}%
    </span>
  );
}
