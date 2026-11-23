'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Mail, MapPin, Phone, User, Copy, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CompanyLogo } from '@/components/companies/CompanyLogo';
import type { PublicJob } from '@/lib/jobs';
import { cityLabel, countryName } from '@/lib/geo';
import { localeFor } from '@/lib/languages';

const LONG = 280;

/** One job ad, as players see it on /jobs and on the company's profile. */
export function JobCard({ job, showCompany = true }: { job: PublicJob; showCompany?: boolean }) {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(job.contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the address is on screen to select by hand */
    }
  };
  const long = job.description.length > LONG;
  const text = long && !open ? job.description.slice(0, LONG).trimEnd() + '…' : job.description;
  const where = [job.city && cityLabel(job.city, job.country, language), job.country && countryName(job.country, localeFor(language))].filter(Boolean).join(', ');
  const date = new Date(job.createdAt).toLocaleDateString(localeFor(language), {
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
            {where && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {where}
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

      {job.photos.length > 0 && (
        <div className={`grid gap-2 ${job.photos.length === 1 ? 'grid-cols-1' : job.photos.length === 2 ? 'grid-cols-2' : job.photos.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {job.photos.map((src, i) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${job.title} ${i + 1}`}
                loading="lazy"
                className={`w-full object-cover hover:scale-[1.03] transition-transform ${job.photos.length === 1 ? 'max-h-80' : 'aspect-square'}`}
              />
            </a>
          ))}
        </div>
      )}

      {(job.contactEmail || job.contactPhone) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {job.contactEmail && (
            // Only the address, to copy: no mailto, so no mail app pops up
            <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-surface/60 pl-3 pr-1 py-1 text-sm text-brand-bone max-w-full">
              <Mail className="w-4 h-4 shrink-0 text-brand-red-light" />
              <span className="select-all break-all">{job.contactEmail}</span>
              <button
                type="button"
                onClick={copyEmail}
                className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-text-secondary hover:text-white hover:bg-white/5"
                aria-label={t('jobs.copy_email')}
                title={t('jobs.copy_email')}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('jobs.copied') : t('jobs.copy')}
              </button>
            </div>
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
