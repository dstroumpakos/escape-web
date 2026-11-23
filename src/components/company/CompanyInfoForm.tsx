'use client';

import { useEffect, useState } from 'react';
import { Building2, FileText, Globe, MapPin, Phone, Save } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useCompanyAuth, useCompanyMutation, useCompanyQuery } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/company/Toast';
import { friendlyError } from '@/lib/errors';

const input = 'w-full bg-brand-bg border border-white/10 rounded-xl py-3 text-white focus:border-brand-red focus:outline-hidden';
const icon = 'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary';

/** Name, contact details and description of the company (its public profile). */
export function CompanyInfoForm() {
  const { company, refreshCompany } = useCompanyAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const companyId = company?.id;
  const data = useCompanyQuery(api.companies.getById, companyId ? { id: companyId as any } : 'skip');
  const updateProfile = useCompanyMutation(api.companies.updateProfile);

  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', vatNumber: '', description: '', website: '' });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data || loaded) return;
    const d = data as any;
    setForm({
      name: d.name || '',
      phone: d.phone || '',
      address: d.address || '',
      city: d.city || '',
      vatNumber: d.vatNumber || '',
      description: d.description || '',
      website: d.website || '',
    });
    setLoaded(true);
  }, [data, loaded]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        id: companyId as any,
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        vatNumber: form.vatNumber || undefined,
        description: form.description,
        website: form.website,
      });
      refreshCompany({ name: form.name });
      toast({ kind: 'success', message: t('company.settings.profile_success') });
    } catch (err: any) {
      setError(friendlyError(err, t, 'company.settings.profile_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      {error && <div className="rounded-xl p-3 text-sm bg-red-500/10 text-red-400">{error}</div>}

      <div>
        <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.company_name')}</label>
        <div className="relative">
          <Building2 className={icon} />
          <input type="text" value={form.name} onChange={set('name')} className={`${input} pl-11 pr-4`} required />
        </div>
      </div>

      <div>
        <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.description')}</label>
        <textarea value={form.description} onChange={set('description')} rows={4} className={`${input} px-4 resize-y`} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.phone')}</label>
          <div className="relative">
            <Phone className={icon} />
            <input type="tel" value={form.phone} onChange={set('phone')} className={`${input} pl-11 pr-4`} required />
          </div>
        </div>
        <div>
          <label className="block text-sm text-brand-text-secondary mb-1.5">{t('cx.website.label')}</label>
          <div className="relative">
            <Globe className={icon} />
            <input type="url" inputMode="url" value={form.website} onChange={set('website')} placeholder="https://" className={`${input} pl-11 pr-4`} />
          </div>
        </div>
      </div>
      <p className="text-xs text-brand-text-secondary -mt-2">{t('cx.website.hint')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.address')}</label>
          <div className="relative">
            <MapPin className={icon} />
            <input type="text" value={form.address} onChange={set('address')} className={`${input} pl-11 pr-4`} required />
          </div>
        </div>
        <div>
          <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.city')}</label>
          <input type="text" value={form.city} onChange={set('city')} className={`${input} px-4`} required />
        </div>
      </div>

      <div>
        <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.vat')}</label>
        <div className="relative">
          <FileText className={icon} />
          <input type="text" value={form.vatNumber} onChange={set('vatNumber')} className={`${input} pl-11 pr-4`} />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs text-brand-text-secondary mb-3">{t('company.settings.email_readonly', { email: company?.email || '' })}</p>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" /> {t('company.settings.save_profile')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
