'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Briefcase, Loader2, MapPin, Building2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { JobCard } from '@/components/jobs/JobCard';
import { JOB_ROLES, type PublicJob } from '@/lib/jobs';
import { COUNTRIES, cityLabel, countryName } from '@/lib/geo';
import { localeFor } from '@/lib/languages';

/** Job ads from escape room companies (convex/jobs.ts). Public: no login needed. */
export default function JobsPage() {
  const { t, language } = useTranslation();
  const locale = localeFor(language);
  const jobs = useQuery(api.jobs.listOpen) as PublicJob[] | undefined;
  const [role, setRole] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');

  // Countries that have ads, in the same order as the company form (site languages first)
  const countries = useMemo(() => {
    const used = new Set((jobs ?? []).map((j) => j.country).filter(Boolean));
    return COUNTRIES.map((c) => c.code).filter((c) => used.has(c));
  }, [jobs]);

  const cities = useMemo(
    () =>
      [...new Set((jobs ?? []).filter((j) => !country || j.country === country).map((j) => j.city).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, locale)
      ),
    [jobs, country, locale]
  );
  const shown = useMemo(
    () => (jobs ?? []).filter((j) => (!role || j.roles.includes(role)) && (!country || j.country === country) && (!city || j.city === city)),
    [jobs, role, country, city]
  );
  const usedRoles = useMemo(() => JOB_ROLES.filter((r) => (jobs ?? []).some((j) => j.roles.includes(r))), [jobs]);

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active ? 'border-brand-red bg-brand-red text-white' : 'border-brand-border bg-brand-card text-brand-text-secondary hover:text-brand-bone hover:border-brand-red/40'
    }`;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      <p className="horror-label mb-3 inline-flex items-center gap-2">
        <span aria-hidden className="h-px w-8 bg-brand-red/60" /> {t('jobs.kicker')}
      </p>
      <h1 className="section-heading mb-3 flex items-center gap-3">
        <Briefcase className="w-8 h-8 text-brand-red-light shrink-0" /> {t('jobs.title')}
      </h1>
      <p className="text-brand-text-secondary text-lg text-pretty mb-8">{t('jobs.subtitle')}</p>

      {jobs && jobs.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('cx.jobs.f_roles')}>
            <button role="radio" aria-checked={!role} onClick={() => setRole('')} className={chip(!role)}>
              {t('jobs.all_roles')}
            </button>
            {usedRoles.map((r) => (
              <button key={r} role="radio" aria-checked={role === r} onClick={() => setRole(role === r ? '' : r)} className={chip(role === r)}>
                {t(`jobs.role.${r}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
          {countries.length > 1 && (
            <label className="inline-flex items-center gap-2 text-sm text-brand-text-secondary">
              <MapPin className="w-4 h-4" />
              <select
                value={country}
                onChange={(e) => { setCountry(e.target.value); setCity(''); }}
                className="bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-brand-bone focus:border-brand-red focus:outline-hidden"
              >
                <option value="">{t('jobs.all_countries')}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{countryName(c, locale)}</option>
                ))}
              </select>
            </label>
          )}
          {cities.length > 1 && (
            <label className="inline-flex items-center gap-2 text-sm text-brand-text-secondary">
              <MapPin className="w-4 h-4" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-brand-bone focus:border-brand-red focus:outline-hidden"
              >
                <option value="">{t('jobs.all_cities')}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{cityLabel(c, (jobs ?? []).find((j) => j.city === c)?.country, language)}</option>
                ))}
              </select>
            </label>
          )}
          </div>
          <p className="text-xs text-brand-text-muted">{t('jobs.count', { count: String(shown.length) })}</p>
        </div>
      )}

      {jobs === undefined ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>
      ) : shown.length === 0 ? (
        <div className="panel p-10 text-center">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-brand-text-muted" />
          <p className="text-brand-text-secondary">{jobs.length === 0 ? t('jobs.empty') : t('jobs.empty_filter')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((j) => (
            <JobCard key={j._id} job={j} />
          ))}
        </div>
      )}

      <div className="mt-12 panel p-5 flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-3 text-sm text-brand-text-secondary">
          <Building2 className="w-5 h-5 text-brand-red-light shrink-0" /> {t('jobs.for_companies')}
        </p>
        <Link href="/company/jobs" className="btn-outline text-sm py-2! px-4!">{t('jobs.for_companies_cta')}</Link>
      </div>
    </section>
  );
}
