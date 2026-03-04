'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { Phone, X } from 'lucide-react';

/**
 * Shows a one-time popup asking users for their phone number
 * if they are logged in but don't have one saved.
 */
export function PhonePrompt() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const convexUser = useQuery(
    api.users.getById,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const updateProfile = useMutation(api.users.updateProfile);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !convexUser) return;
    // Check if user already has a phone
    if ((convexUser as any).phone) return;
    // Check if already dismissed this session
    const dismissedKey = `unlocked_phone_prompt_${user?.id}`;
    if (sessionStorage.getItem(dismissedKey)) return;
    // Show with a slight delay so it doesn't flash immediately
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, convexUser, user?.id]);

  if (!show || dismissed) return null;

  const handleSave = async () => {
    const trimmed = phone.trim();
    if (!trimmed || !user?.id) return;
    setSaving(true);
    try {
      await updateProfile({ userId: user.id as any, phone: trimmed });
      setShow(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    const dismissedKey = `unlocked_phone_prompt_${user?.id}`;
    sessionStorage.setItem(dismissedKey, '1');
    setDismissed(true);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-brand-red" />
            </div>
            <h2 className="text-lg font-bold">{t('phone_prompt.title')}</h2>
          </div>
          <button onClick={handleDismiss} className="p-1 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-brand-text-secondary" />
          </button>
        </div>

        <p className="text-sm text-brand-text-secondary mb-5">
          {t('phone_prompt.description')}
        </p>

        <div className="mb-4">
          <label className="block text-sm text-brand-text-secondary mb-1.5">
            {t('phone_prompt.label')}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+30 6XX XXX XXXX"
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-brand-text-secondary hover:bg-white/10 transition-colors text-sm font-medium"
          >
            {t('phone_prompt.later')}
          </button>
          <button
            onClick={handleSave}
            disabled={!phone.trim() || saving}
            className="flex-1 btn-primary !py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('phone_prompt.save')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
