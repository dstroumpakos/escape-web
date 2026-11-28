'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

/**
 * Admin → Companies: delete a company and everything tied to it
 * (convex/companyDelete.ts). Shows what goes with it and asks for the name.
 */
export function DeleteCompanyDialog({
  companyId,
  sessionToken,
  onClose,
}: {
  companyId: string;
  sessionToken: string;
  onClose: (deletedName?: string) => void;
}) {
  const { t } = useTranslation();
  const preview = useQuery(api.companyDelete.adminDeletePreview, { sessionToken, companyId: companyId as any });
  const del = useMutation(api.companyDelete.adminDelete);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const name = preview?.name ?? '';
  const matches = !!name && typed.trim() === name.trim();
  const fmt = (n: number) => (n > 1000 ? '1000+' : String(n));

  const submit = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setError('');
    try {
      await del({ sessionToken, companyId: companyId as any, confirmName: typed });
      onClose(name);
    } catch (e: any) {
      setError(e?.data ?? e?.message ?? 'Error');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-red-500/30 bg-brand-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-bold text-red-400">
            <Trash2 className="h-5 w-5" /> {t('admin.del.title', { name: name || '…' })}
          </h3>
          <button onClick={() => !busy && onClose()} className="text-brand-text-secondary hover:text-white" aria-label={t('admin.cancel')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {preview === undefined ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-brand-text-secondary" /></div>
        ) : preview === null ? (
          <p className="text-sm text-brand-text-secondary">—</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-brand-text-secondary">{t('admin.del.intro')}</p>
            <ul className="mb-3 space-y-1 rounded-xl border border-white/5 bg-brand-bg p-3 text-sm">
              {([
                ['admin.del.rooms', preview.rooms],
                ['admin.del.bookings', preview.bookings],
                ['admin.del.followers', preview.followers],
                ['admin.del.posts', preview.posts],
                ['admin.del.invoices', preview.invoices],
              ] as const).map(([k, n]) => (
                <li key={k} className="flex justify-between gap-3">
                  <span className="text-brand-text-secondary">{t(k)}</span>
                  <span className={n > 0 ? 'font-semibold text-white' : 'text-brand-text-secondary'}>{fmt(n)}</span>
                </li>
              ))}
            </ul>
            <p className="mb-3 text-xs text-brand-text-secondary">{t('admin.del.also')}</p>
            {(preview.bookings > 0 || preview.invoices > 0) && (
              <p className="mb-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-2.5 text-xs text-yellow-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {t('admin.del.money')}
              </p>
            )}
            <label className="mb-1 block text-sm">{t('admin.del.type')}</label>
            <p className="mb-2 select-all font-mono text-sm text-white">{name}</p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              autoFocus
              className="mb-3 w-full rounded-xl border border-white/10 bg-brand-bg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-hidden"
            />
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => onClose()} disabled={busy} className="rounded-xl px-4 py-2 text-sm text-brand-text-secondary hover:text-white">
                {t('admin.cancel')}
              </button>
              <button
                onClick={submit}
                disabled={!matches || busy}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {busy ? t('admin.del.deleting') : t('admin.del.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
