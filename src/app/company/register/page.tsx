'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Building2, Mail, Lock, Eye, EyeOff, Phone, MapPin, FileText, ArrowRight, Globe } from 'lucide-react';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useCompanyAuth, useCompanyPath, useMainSiteUrl } from '@/lib/companyAuth';
import { friendlyError } from '@/lib/errors';
import { CompanySignupCodeStep } from '@/components/auth/SignupCodeStep';

function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'cx.pw.too_short';
  if (!/[A-Z]/.test(pw)) return 'cx.pw.need_upper';
  if (!/[0-9]/.test(pw)) return 'cx.pw.need_number';
  return null;
}

export default function CompanyRegisterPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const p = useCompanyPath();
  const homeUrl = useMainSiteUrl();
  const registerMutation = useMutation(api.companies.startRegister);
  // Step 2: the 6-digit code we emailed (convex/signupCodes.ts)
  const [codeStep, setCodeStep] = useState(false);
  const { login } = useCompanyAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    vatNumber: '',
    website: '',
    description: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwProblem = passwordProblem(form.password);
    if (pwProblem) {
      setError(t(pwProblem));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('company.register.error_password_mismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await registerMutation({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        vatNumber: form.vatNumber || undefined,
        website: form.website.trim() || undefined,
        description: form.description,
        password: form.password,
        lang: language,
      });

      if (result && typeof result === 'object' && 'error' in result) {
        setError(friendlyError((result as { error: string }).error, t, 'company.register.error_failed'));
        return;
      }

      // Code emailed: the account is created after the right code.
      setCodeStep(true);
    } catch (err: any) {
      setError(friendlyError(err, t, 'company.register.error_failed'));
    } finally {
      setLoading(false);
    }
  };

  // After the right code: sign in and continue
  const finishSignup = async () => {
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      router.replace(p('/company/onboarding'));
    } catch {
      router.push(p('/company/login?registered=true'));
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
              <EyeKeyhole className="w-8 h-8" />
            </div>
            <span className="text-2xl font-display font-bold tracking-wider">
              UN<span className="text-brand-red-light">LOCKED</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-brand-text-secondary">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{t('company.register.title')}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-brand-surface rounded-2xl p-5 sm:p-8 border border-white/5">
          <h1 className="text-2xl font-bold mb-2">{t('company.register.heading')}</h1>
          <p className="text-brand-text-secondary text-sm mb-6">
            {t('company.register.subtitle')}
          </p>

          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

{codeStep ? (
  <CompanySignupCodeStep email={form.email} onConfirmed={finishSignup} onBack={() => setCodeStep(false)} />
) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.company_name')}</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder={t('company.register.company_name_placeholder')}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder={t('company.register.email_placeholder')}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder={t('company.register.phone_placeholder')}
                  required
                />
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.address')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                    placeholder={t('company.register.address_placeholder')}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.city')}</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder={t('company.register.city_placeholder')}
                  required
                />
              </div>
            </div>

            {/* VAT */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.vat')}</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={form.vatNumber}
                  onChange={(e) => updateField('vatNumber', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder={t('company.register.vat_placeholder')}
                />
              </div>
            </div>

            {/* Website: where "Book" on its rooms sends players */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('cx.register.website')}</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder={t('cx.register.website_placeholder')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.description')}</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors resize-none"
                placeholder={t('company.register.description_placeholder')}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={t('cx.auth.show_password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {[
                  { ok: form.password.length >= 8, key: 'cx.pw.rule_len' },
                  { ok: /[A-Z]/.test(form.password), key: 'cx.pw.rule_upper' },
                  { ok: /[0-9]/.test(form.password), key: 'cx.pw.rule_number' },
                ].map((r) => (
                  <li key={r.key} className={r.ok ? 'text-emerald-400' : 'text-brand-text-secondary'}>
                    {r.ok ? '✓' : '•'} {t(r.key)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.register.confirm_password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden transition-colors"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3! text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('company.register.submit')} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
)}

          <p className="text-center text-sm text-brand-text-secondary mt-6">
            {t('company.register.has_account')}{' '}
            <Link href={p('/company/login')} className="text-brand-red-light hover:underline">
              {t('company.register.sign_in')}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-brand-text-secondary mt-6">
          <a href={homeUrl} className="hover:text-white transition-colors">
            {t('company.register.back_to_site')}
          </a>
        </p>
      </div>
    </div>
  );
}
