'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useCompanyMutation, useCompanyQuery } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/company/Toast';
import { friendlyError } from '@/lib/errors';
import { InstagramIcon } from '@/components/rooms/InstagramStrip';

/** Settings: opt in to showing the latest Instagram posts on room pages (convex/instagram.ts). */
export function InstagramSettingsCard({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const settings = useCompanyQuery(api.instagram.settingsForCompany, { companyId: companyId as any });
  const save = useCompanyMutation(api.instagram.setForCompany);

  const [username, setUsername] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (settings && !loaded) {
      setUsername(settings.username ? `@${settings.username}` : '');
      setEnabled(settings.enabled);
      setLoaded(true);
    }
  }, [settings, loaded]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await save({ companyId: companyId as any, username, enabled });
      toast({ kind: 'success', message: res?.syncing ? t('cx.ig.saved_syncing') : t('cx.ig.saved') });
      setLoaded(false); // pick up the cleaned username
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setSaving(false);
    }
  };

  let status: string | null = null;
  if (settings?.enabled) {
    if (settings.error) status = t(`cx.ig.err.${settings.error}`);
    else if (settings.syncedAt)
      status = t('cx.ig.status_synced', {
        count: String(settings.postCount),
        when: new Date(settings.syncedAt).toLocaleString(),
      });
    else status = t('cx.ig.status_pending');
  }

  return (
    <form onSubmit={onSave} className="mt-6 bg-brand-surface rounded-2xl border border-white/10 p-6 space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <InstagramIcon className="w-5 h-5 text-brand-red-light" />
          {t('cx.ig.title')}
        </h3>
        <p className="text-sm text-brand-text-secondary mt-1">{t('cx.ig.desc')}</p>
      </div>

      <div>
        <label htmlFor="ig-username" className="block text-sm text-brand-text-secondary mb-1.5">
          {t('cx.ig.username')}
        </label>
        <input
          id="ig-username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@yourescaperoom"
          className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 accent-brand-red"
        />
        <span className="text-sm text-white">{t('cx.ig.enabled')}</span>
      </label>

      {status && (
        <p className={`text-xs ${settings?.error ? 'text-amber-400' : 'text-brand-text-secondary'}`}>{status}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !settings}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" /> {t('cx.ig.save')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
