'use client';

import { useState } from 'react';
import { Briefcase, Plus, Loader2, Pencil, Trash2, X, Lock, Unlock, ExternalLink, MapPin, Info } from 'lucide-react';
import { useCompanyQuery, useCompanyMutation, useMainSiteUrl } from '@/lib/companyAuth';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { useToast } from '@/components/company/Toast';
import { JOB_ROLES, JOB_GENDERS, JOB_EMPLOYMENT } from '@/lib/jobs';

type Form = {
  title: string;
  description: string;
  roles: string[];
  genders: string[];
  employment: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
};

const input =
  'w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-brand-text-muted focus:border-brand-red focus:outline-hidden';

function Chips({ options, value, onChange, label, multi = true }: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  label: (o: string) => string;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={on}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : on ? [] : [o])}
            className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
              on ? 'border-brand-red bg-brand-red/15 text-brand-red-light' : 'border-white/10 text-brand-text-secondary hover:border-white/25 hover:text-white'
            }`}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Company portal: write job ads ("we are looking for a game master / actor"). Shown on /jobs. */
export default function CompanyJobsPage() {
  const { t, language } = useTranslation();
  const toast = useToast();
  const jobsUrl = useMainSiteUrl('/jobs');
  const data = useCompanyQuery(api.jobs.mine, {});
  const create = useCompanyMutation(api.jobs.create);
  const update = useCompanyMutation(api.jobs.update);
  const setStatus = useCompanyMutation(api.jobs.setStatus);
  const remove = useCompanyMutation(api.jobs.remove);
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState<Id<'jobPosts'> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const blank = (): Form => ({
    title: '',
    description: '',
    roles: [],
    genders: [],
    employment: '',
    city: data?.defaults.city ?? '',
    contactEmail: data?.defaults.contactEmail ?? '',
    contactPhone: data?.defaults.contactPhone ?? '',
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const startNew = () => {
    setEditing(null);
    setForm(blank());
  };

  const startEdit = (p: NonNullable<typeof data>['posts'][number]) => {
    setEditing(p._id);
    setForm({
      title: p.title,
      description: p.description,
      roles: p.roles,
      genders: p.genders,
      employment: p.employment ?? '',
      city: p.city,
      contactEmail: p.contactEmail ?? '',
      contactPhone: p.contactPhone ?? '',
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy('save');
    const args = { ...form, employment: form.employment || undefined };
    try {
      if (editing) {
        await update({ postId: editing, ...args });
        toast({ kind: 'success', message: t('cx.jobs.saved') });
      } else {
        await create(args);
        toast({ kind: 'success', message: t('cx.jobs.published') });
      }
      setForm(null);
      setEditing(null);
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (id: Id<'jobPosts'>, status: 'open' | 'closed') => {
    setBusy(id);
    try {
      await setStatus({ postId: id, status });
      toast({ kind: 'success', message: t(status === 'open' ? 'cx.jobs.status_open' : 'cx.jobs.status_closed') });
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setBusy(null);
    }
  };

  const del = async (id: Id<'jobPosts'>) => {
    if (!window.confirm(t('cx.jobs.delete_confirm'))) return;
    setBusy(id);
    try {
      await remove({ postId: id });
      toast({ kind: 'success', message: t('cx.jobs.deleted') });
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setBusy(null);
    }
  };

  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(language === 'el' ? 'el-GR' : language === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-brand-red-light" /> {t('cx.jobs.title')}
          </h1>
          <p className="text-brand-text-secondary mt-1 text-sm max-w-xl">{t('cx.jobs.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <a href={jobsUrl} target="_blank" rel="noreferrer" className="btn-ghost text-sm py-2! inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> {t('cx.jobs.view_public')}
          </a>
          {!form && (
            <button onClick={startNew} disabled={data === undefined} className="btn-primary text-sm py-2! inline-flex items-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {t('cx.jobs.new')}
            </button>
          )}
        </div>
      </div>

      {form && (
        <form onSubmit={save} className="bg-brand-surface rounded-2xl border border-white/5 p-5 md:p-6 mb-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{editing ? t('cx.jobs.edit') : t('cx.jobs.new')}</h2>
            <button type="button" onClick={() => { setForm(null); setEditing(null); }} className="p-1.5 rounded-lg hover:bg-white/5" aria-label={t('cx.jobs.cancel')}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-brand-text-secondary mb-1.5">{t('cx.jobs.f_title')}</span>
            <input className={input} value={form.title} maxLength={90} required placeholder={t('cx.jobs.f_title_ph')} onChange={(e) => set('title', e.target.value)} />
          </label>

          <fieldset>
            <legend className="block text-sm font-medium text-brand-text-secondary mb-2">{t('cx.jobs.f_roles')}</legend>
            <Chips options={JOB_ROLES} value={form.roles} onChange={(v) => set('roles', v)} label={(o) => t(`jobs.role.${o}`)} />
          </fieldset>

          <fieldset>
            <legend className="block text-sm font-medium text-brand-text-secondary mb-1">{t('cx.jobs.f_genders')}</legend>
            <p className="text-xs text-brand-text-muted mb-2">{t('cx.jobs.f_genders_hint')}</p>
            <Chips options={JOB_GENDERS} value={form.genders} onChange={(v) => set('genders', v)} label={(o) => t(`jobs.gender.${o}`)} />
          </fieldset>

          <fieldset>
            <legend className="block text-sm font-medium text-brand-text-secondary mb-2">{t('cx.jobs.f_employment')}</legend>
            <Chips
              options={JOB_EMPLOYMENT}
              value={form.employment ? [form.employment] : []}
              onChange={(v) => set('employment', v[0] ?? '')}
              label={(o) => t(`jobs.emp.${o}`)}
              multi={false}
            />
          </fieldset>

          <label className="block">
            <span className="block text-sm font-medium text-brand-text-secondary mb-1.5">{t('cx.jobs.f_desc')}</span>
            <textarea
              className={`${input} min-h-40 resize-y`}
              value={form.description}
              maxLength={3000}
              required
              placeholder={t('cx.jobs.f_desc_ph')}
              onChange={(e) => set('description', e.target.value)}
            />
            <span className="block text-right text-[11px] text-brand-text-muted mt-1">{form.description.length}/3000</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="block text-sm font-medium text-brand-text-secondary mb-1.5">{t('cx.jobs.f_city')}</span>
              <input className={input} value={form.city} maxLength={60} onChange={(e) => set('city', e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brand-text-secondary mb-1.5">{t('cx.jobs.f_email')}</span>
              <input className={input} type="email" value={form.contactEmail} maxLength={120} onChange={(e) => set('contactEmail', e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brand-text-secondary mb-1.5">{t('cx.jobs.f_phone')}</span>
              <input className={input} type="tel" value={form.contactPhone} maxLength={30} onChange={(e) => set('contactPhone', e.target.value)} />
            </label>
          </div>
          <p className="flex gap-2 text-xs text-brand-text-muted -mt-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {t('cx.jobs.f_contact_hint')}
          </p>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setForm(null); setEditing(null); }} className="btn-ghost text-sm py-2.5!">
              {t('cx.jobs.cancel')}
            </button>
            <button type="submit" disabled={busy === 'save' || form.roles.length === 0} className="btn-primary text-sm py-2.5! inline-flex items-center gap-2 disabled:opacity-50">
              {busy === 'save' && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? t('cx.jobs.save') : t('cx.jobs.publish')}
            </button>
          </div>
        </form>
      )}

      {data === undefined ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-brand-surface border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : data.posts.length === 0 ? (
        !form && (
          <div className="text-center py-16 bg-brand-surface rounded-2xl border border-white/5">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-brand-text-secondary/30" />
            <p className="text-sm text-brand-text-secondary mb-4">{t('cx.jobs.empty')}</p>
            <button onClick={startNew} className="btn-primary text-sm py-2! inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('cx.jobs.new')}
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {data.posts.map((p) => {
            const open = p.status === 'open';
            return (
              <div key={p._id} className={`bg-brand-surface rounded-2xl border border-white/5 p-4 md:p-5 ${open ? '' : 'opacity-60'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${open ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-brand-text-secondary'}`}>
                        {t(open ? 'cx.jobs.open' : 'cx.jobs.closed')}
                      </span>
                      <span className="text-xs text-brand-text-muted">{fmt(p.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{p.title}</h3>
                    <p className="mt-1 text-xs text-brand-text-secondary flex flex-wrap gap-x-3 gap-y-1">
                      <span>{p.roles.map((r) => t(`jobs.role.${r}`)).join(' · ')}</span>
                      {p.genders.length > 0 && <span>{p.genders.map((g) => t(`jobs.gender.${g}`)).join(' / ')}</span>}
                      {p.employment && <span>{t(`jobs.emp.${p.employment}`)}</span>}
                      {p.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => startEdit(p)} disabled={!!busy} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50" title={t('cx.jobs.edit')} aria-label={t('cx.jobs.edit')}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggle(p._id, open ? 'closed' : 'open')}
                      disabled={!!busy}
                      className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
                      title={t(open ? 'cx.jobs.close' : 'cx.jobs.reopen')}
                      aria-label={t(open ? 'cx.jobs.close' : 'cx.jobs.reopen')}
                    >
                      {busy === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : open ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button onClick={() => del(p._id)} disabled={!!busy} className="p-2 rounded-lg hover:bg-red-500/10 text-red-300 disabled:opacity-50" title={t('cx.jobs.delete')} aria-label={t('cx.jobs.delete')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-brand-text-secondary line-clamp-2 whitespace-pre-line">{p.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
