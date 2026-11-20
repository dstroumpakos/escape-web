'use client';

import { useEffect, useState } from 'react';
import { useCompanyAction, useCompanyMutation, useCompanyQuery, useCompanyAuth } from '@/lib/companyAuth';
import { api } from '../../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/company/Toast';
import { friendlyError } from '@/lib/errors';
import { BOOKING_ENABLED } from '@/lib/features';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Percent,
  Save,
  ShieldCheck,
  Unplug,
  Wallet,
} from 'lucide-react';

type Provider = 'stripe' | 'viva';

const inputCls =
  'w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-hidden';
const labelCls = 'block text-sm text-brand-text-secondary mb-1.5';

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input {...props} className={inputCls} />
      {hint && <p className="text-xs text-brand-text-secondary mt-1.5">{hint}</p>}
    </div>
  );
}

/** Players are sent back to the main site, never to business. or photos. */
function useReturnUrl() {
  const [url, setUrl] = useState('https://unlocked.gr/booking/viva-return');
  useEffect(() => {
    const origin = window.location.origin.replace('://business.', '://').replace('://photos.', '://');
    setUrl(`${origin}/booking/viva-return`);
  }, []);
  return url;
}

export default function CompanyPaymentsPage() {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const companyId = company?.id as any;

  const settings = useCompanyQuery(api.companyPaymentsData.getCompanySettings, companyId ? { companyId } : 'skip');
  const connectStripe = useCompanyAction(api.companyPayments.connectStripe);
  const connectViva = useCompanyAction(api.companyPayments.connectViva);
  const disconnect = useCompanyAction(api.companyPayments.disconnect);
  const updateSettings = useCompanyMutation(api.companyPaymentsData.updateSettings);
  const returnUrl = useReturnUrl();

  // Connect form
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState<Provider>('stripe');
  const [stripeKey, setStripeKey] = useState('');
  const [viva, setViva] = useState({
    mode: 'live' as 'live' | 'test',
    clientId: '',
    clientSecret: '',
    sourceCode: '',
    merchantId: '',
    apiKey: '',
  });
  const [connectPw, setConnectPw] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectErr, setConnectErr] = useState('');

  // Disconnect
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnectPw, setDisconnectPw] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);

  // Settings form
  const [deposit, setDeposit] = useState('20');
  const [feeOn, setFeeOn] = useState(false);
  const [fee, setFee] = useState('');
  const [settingsPw, setSettingsPw] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (settings && !loaded) {
      setDeposit(String(settings.depositPercent));
      setFeeOn(settings.bookingFeeEnabled);
      setFee(settings.bookingFeeAmount ? String(settings.bookingFeeAmount) : '');
      if (settings.provider) setProvider(settings.provider);
      setLoaded(true);
    }
  }, [settings, loaded]);

  if (!company || settings === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-text-secondary" />
      </div>
    );
  }
  if (settings === null) return null;

  const connected = !!settings.provider;
  const showForm = !connected || editing;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setConnectErr('');
    try {
      if (provider === 'stripe') {
        await connectStripe({ companyId, password: connectPw, secretKey: stripeKey });
      } else {
        await connectViva({ companyId, password: connectPw, ...viva });
      }
      toast({ kind: 'success', message: t('cx.pay.connected_toast') });
      setStripeKey('');
      setViva((v) => ({ ...v, clientSecret: '', apiKey: '' }));
      setConnectPw('');
      setEditing(false);
    } catch (err) {
      setConnectErr(friendlyError(err, t));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnect({ companyId, password: disconnectPw });
      toast({ kind: 'success', message: t('cx.pay.disconnected_toast') });
      setConfirmDisconnect(false);
      setDisconnectPw('');
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const result = await updateSettings({
        companyId,
        password: settingsPw,
        depositPercent: Number(deposit),
        bookingFeeEnabled: feeOn,
        bookingFeeAmount: feeOn ? Number(fee || 0) : 0,
      });
      // Wrong password / locked out come back as { error } (counted on the server).
      if (result && 'error' in result) {
        toast({ kind: 'error', message: friendlyError(result.error, t) });
        return;
      }
      toast({ kind: 'success', message: t('cx.pay.settings_saved') });
      setSettingsPw('');
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setSavingSettings(false);
    }
  };

  const copyReturnUrl = async () => {
    try {
      await navigator.clipboard.writeText(returnUrl);
      toast({ kind: 'success', message: t('cx.pay.copied') });
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('cx.pay.title')}</h1>
        <p className="text-brand-text-secondary mt-1">{t(BOOKING_ENABLED ? 'cx.pay.subtitle' : 'cx.pay.subtitle_merch')}</p>
      </div>

      {!settings.serverReady && (
        <div className="flex items-start gap-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-sm text-yellow-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-yellow-400" />
          {t('cx.pay.server_not_ready')}
        </div>
      )}

      {/* ── Account ── */}
      <section className="bg-brand-surface rounded-2xl border border-white/5 p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-brand-red-light" />
          {t('cx.pay.account_title')}
        </h2>

        {connected && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-semibold">
                {settings.provider === 'stripe' ? 'Stripe' : 'Viva'} {t('cx.pay.is_connected')}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  settings.mode === 'live' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}
              >
                {settings.mode === 'live' ? t('cx.pay.mode_live') : t('cx.pay.mode_test')}
              </span>
            </div>
            <p className="text-sm text-brand-text-secondary mt-1 break-all">{settings.accountLabel}</p>
            {settings.mode === 'test' && (
              <p className="text-xs text-yellow-300/80 mt-2">{t('cx.pay.test_mode_note')}</p>
            )}
            {settings.provider === 'viva' && (
              <p className="text-xs text-brand-text-secondary mt-2">
                {t('cx.pay.viva_return_reminder')} <span className="text-white break-all">{returnUrl}</span>
              </p>
            )}
            {!editing && !confirmDisconnect && (
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:border-white/20"
                >
                  {t('cx.pay.replace_keys')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(true)}
                  className="px-4 py-2 rounded-xl border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Unplug className="w-4 h-4" /> {t('cx.pay.disconnect')}
                </button>
              </div>
            )}
            {confirmDisconnect && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-red-200">{t(BOOKING_ENABLED ? 'cx.pay.disconnect_warning' : 'cx.pay.disconnect_warning_merch')}</p>
                <Field
                  label={t('cx.pay.your_password')}
                  type="password"
                  autoComplete="current-password"
                  value={disconnectPw}
                  onChange={(e) => setDisconnectPw(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={!disconnectPw || disconnecting}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {disconnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('cx.pay.disconnect_confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnect(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-sm"
                  >
                    {t('cx.common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!connected && <p className="text-sm text-brand-text-secondary mb-4">{t(BOOKING_ENABLED ? 'cx.pay.not_connected' : 'cx.pay.not_connected_merch')}</p>}

        {showForm && (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-brand-bg rounded-xl p-1">
              {(['stripe', 'viva'] as Provider[]).map((pv) => (
                <button
                  key={pv}
                  type="button"
                  onClick={() => setProvider(pv)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                    provider === pv ? 'bg-brand-red text-white' : 'text-brand-text-secondary hover:text-white'
                  }`}
                >
                  {pv === 'stripe' ? 'Stripe' : 'Viva'}
                </button>
              ))}
            </div>

            {provider === 'stripe' ? (
              <>
                <ol className="text-sm text-brand-text-secondary list-decimal pl-5 space-y-1">
                  <li>{t('cx.pay.stripe_step1')}</li>
                  <li>{t('cx.pay.stripe_step2')}</li>
                  <li>{t('cx.pay.stripe_step3')}</li>
                </ol>
                <Field
                  label={t('cx.pay.stripe_secret')}
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="sk_live_…"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  required
                />
              </>
            ) : (
              <>
                <ol className="text-sm text-brand-text-secondary list-decimal pl-5 space-y-1">
                  <li>{t('cx.pay.viva_step1')}</li>
                  <li>{t('cx.pay.viva_step2')}</li>
                  <li>{t('cx.pay.viva_step3')}</li>
                </ol>
                <div className="rounded-xl border border-white/10 bg-brand-bg p-3">
                  <p className="text-sm mb-2">{t('cx.pay.viva_return_title')}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-white break-all">{returnUrl}</code>
                    <button
                      type="button"
                      onClick={copyReturnUrl}
                      className="p-2 rounded-lg border border-white/10 hover:border-white/20"
                      aria-label={t('cx.pay.copy')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('cx.pay.viva_env')}</label>
                  <select
                    value={viva.mode}
                    onChange={(e) => setViva({ ...viva, mode: e.target.value as 'live' | 'test' })}
                    className={inputCls}
                  >
                    <option value="live">{t('cx.pay.viva_env_live')}</option>
                    <option value="test">{t('cx.pay.viva_env_demo')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Smart Checkout Client ID" autoComplete="off" spellCheck={false} value={viva.clientId}
                    onChange={(e) => setViva({ ...viva, clientId: e.target.value })} required />
                  <Field label="Smart Checkout Client Secret" type="password" autoComplete="off" value={viva.clientSecret}
                    onChange={(e) => setViva({ ...viva, clientSecret: e.target.value })} required />
                  <Field label="Merchant ID" autoComplete="off" spellCheck={false} value={viva.merchantId}
                    onChange={(e) => setViva({ ...viva, merchantId: e.target.value })} required />
                  <Field label="API Key" type="password" autoComplete="off" value={viva.apiKey}
                    onChange={(e) => setViva({ ...viva, apiKey: e.target.value })} required />
                  <Field label={t('cx.pay.viva_source')} hint={t('cx.pay.viva_source_hint')} inputMode="numeric"
                    autoComplete="off" placeholder="1234" value={viva.sourceCode}
                    onChange={(e) => setViva({ ...viva, sourceCode: e.target.value })} required />
                </div>
              </>
            )}

            <Field
              label={t('cx.pay.your_password')}
              hint={t('cx.pay.password_why')}
              type="password"
              autoComplete="current-password"
              value={connectPw}
              onChange={(e) => setConnectPw(e.target.value)}
              required
            />

            {connectErr && (
              <div className="rounded-xl p-3 text-sm bg-red-500/10 text-red-400">{connectErr}</div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={connecting || !settings.serverReady}
                className="px-5 py-3 rounded-xl bg-brand-red text-white font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {connecting ? t('cx.pay.checking') : t('cx.pay.connect')}
              </button>
              {editing && (
                <button type="button" onClick={() => setEditing(false)} className="text-sm text-brand-text-secondary">
                  {t('cx.common.cancel')}
                </button>
              )}
            </div>
            <p className="text-xs text-brand-text-secondary flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" /> {t('cx.pay.security_note')}
            </p>
          </form>
        )}
      </section>

      {/* ── Deposit & fee (room bookings only) ── */}
      {BOOKING_ENABLED && (
      <section className="bg-brand-surface rounded-2xl border border-white/5 p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Percent className="w-5 h-5 text-brand-red-light" />
          {t('cx.pay.settings_title')}
        </h2>
        <p className="text-sm text-brand-text-secondary mb-4">{t('cx.pay.settings_desc')}</p>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className={labelCls}>{t('cx.pay.default_deposit')}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className={`${inputCls} w-28!`}
                required
              />
              <span className="text-brand-text-secondary">%</span>
            </div>
            <p className="text-xs text-brand-text-secondary mt-1.5">{t('cx.pay.default_deposit_hint')}</p>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span>
                <span className="block font-medium">{t('cx.pay.fee_toggle')}</span>
                <span className="block text-xs text-brand-text-secondary mt-0.5">{t('cx.pay.fee_hint')}</span>
              </span>
              <input
                type="checkbox"
                checked={feeOn}
                onChange={(e) => setFeeOn(e.target.checked)}
                className="w-5 h-5 accent-brand-red shrink-0"
              />
            </label>
            {feeOn && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-brand-text-secondary">€</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="3.99"
                  className={`${inputCls} w-28!`}
                  required
                />
              </div>
            )}
          </div>

          <Field
            label={t('cx.pay.your_password')}
            type="password"
            autoComplete="current-password"
            value={settingsPw}
            onChange={(e) => setSettingsPw(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={savingSettings}
            className="px-5 py-3 rounded-xl bg-brand-red text-white font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('cx.pay.save')}
          </button>
        </form>
      </section>
      )}

      {/* ── How it works ── */}
      <section className="bg-brand-surface rounded-2xl border border-white/5 p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-red-light" />
          {t('cx.pay.how_title')}
        </h2>
        <ul className="text-sm text-brand-text-secondary space-y-2 list-disc pl-5">
          <li>{t(BOOKING_ENABLED ? 'cx.pay.how_1' : 'cx.pay.how_1_merch')}</li>
          <li>{t('cx.pay.how_2')}</li>
          {BOOKING_ENABLED && <li>{t('cx.pay.how_3')}</li>}
          <li>{t('cx.pay.how_4')}</li>
        </ul>
      </section>
    </div>
  );
}
