'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Mail, MapPin, Phone, Clock, User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CompanyLogo } from '@/components/companies/CompanyLogo';
import type { PublicJob } from '@/lib/jobs';

const LONG = 280;

/** One job ad, as players see it on /jobs and on the company's profile. */
export function JobCard({ job, showCompany = true }: { job: PublicJob; showCompany?: boolean }) {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const long = job.description.length > LONG;
  const text = long && !open ? job.description.slice(0, LONG).trimEnd() + '…' : job.description;
  const date = new Date(job.createdAt).toLocaleDateString(language === 'el' ? 'el-GR' : language === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <article className="panel p-5 sm:p-6 flex flex-col gap-4">
      <header className="flex items-start gap-4">
        {showCompany && (
          <Link href={`/companies/${job.company._id}`} className="shrink-0" aria-label={job.company.name}>
            <CompanyLogo name={job.company.name} logo={job.company.logo} size={52} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {showCompany && (
            <Link href={`/companies/${job.company._id}`} className="text-sm text-brand-text-secondary hover:text-brand-bone">
              {job.company.name}
            </Link>
          )}
          <h3 className="font-display text-xl font-bold text-brand-bone leading-snug text-balance">{job.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-text-muted">
            {job.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {job.city}
              </span>
            )}
            {job.employment && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {t(`jobs.emp.${job.employment}`)}
              </span>
            )}
            <span>{t('jobs.posted', { date })}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {job.roles.map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5 rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red-light">
            <Briefcase className="w-3.5 h-3.5" /> {t(`jobs.role.${r}`)}
          </span>
        ))}
        {job.genders.map((g) => (
          <span key={g} className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface/60 px-3 py-1 text-xs text-brand-text-secondary">
            <User className="w-3.5 h-3.5" /> {t(`jobs.gender.${g}`)}
          </span>
        ))}
      </div>

      <div className="text-sm leading-relaxed text-brand-text-secondary whitespace-pre-line">
        {text}
        {long && (
          <button onClick={() => setOpen((o) => !o)} className="ml-1 font-medium text-brand-red-light hover:underline">
            {open ? t('jobs.less') : t('jobs.more')}
          </button>
        )}
      </div>

      {(job.contactEmail || job.contactPhone) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {job.contactEmail && (
            <a
              href={`mailto:${job.contactEmail}?subject=${encodeURIComponent(job.title)}`}
              className="btn-primary inline-flex items-center gap-2 py-2! px-4! text-sm"
            >
              <Mail className="w-4 h-4" /> {t('jobs.email')}
            </a>
          )}
          {job.contactPhone && (
            <a href={`tel:${job.contactPhone.replace(/[^\d+]/g, '')}`} className="btn-outline inline-flex items-center gap-2 py-2! px-4! text-sm">
              <Phone className="w-4 h-4" /> {t('jobs.call')} · {job.contactPhone}
            </a>
          )}
        </div>
      )}
    </article>
  );
}
