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
        <div className="grid gap-2 pt-1 sm:grid-cols-2">
          {job.contactEmail && <ContactBox icon={Mail} label={t('jobs.email_label')} value={job.contactEmail} />}
          {job.contactPhone && <ContactBox icon={Phone} label={t('jobs.phone_label')} value={job.contactPhone} />}
        </div>
      )}
    </article>
  );
}

/**
 * Email or phone of an ad: hidden until you hover the box (tap on a phone),
 * with a copy button next to it. Nothing opens a mail or phone app.
 */
function ContactBox({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setShown(true); // clipboard blocked: at least show it to select by hand
    }
  };
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onMouseEnter={() => setShown(true)}
        onMouseLeave={() => setShown(false)}
        onFocus={() => setShown(true)}
        onBlur={() => setShown(false)}
        onClick={() => setShown((v) => !v)}
        aria-label={label}
        className="group min-w-0 flex-1 flex items-center gap-2.5 rounded-xl border border-brand-border bg-brand-surface/60 px-3 py-2 text-left hover:border-brand-red/50 transition-colors"
      >
        <Icon className="w-4 h-4 shrink-0 text-brand-red-light" />
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-wide text-brand-text-muted">{label}</span>
          <span
            className={`block text-sm truncate transition-[filter,opacity] ${
              shown ? 'text-brand-bone select-all' : 'text-brand-text-secondary blur-[5px] opacity-70 select-none'
            }`}
          >
            {value}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-brand-border px-3 text-xs font-medium text-brand-text-secondary hover:text-white hover:border-brand-red/50 transition-colors"
        aria-label={`${t('jobs.copy')} ${label}`}
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        {copied ? t('jobs.copied') : t('jobs.copy')}
      </button>
    </div>
  );
}
