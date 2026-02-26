'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Unlock, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';

export default function SignupPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();

  // Redirect to home once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const passwordChecks = [
    { label: t('auth.check_length'), met: password.length >= 8 },
    { label: t('auth.check_number'), met: /\d/.test(password) },
    { label: t('auth.check_uppercase'), met: /[A-Z]/.test(password) },
    { label: t('auth.check_match'), met: password.length > 0 && password === confirmPassword },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.error_password_mismatch'));
      return;
    }
    if (!agreed) {
      setError(t('auth.error_accept_terms'));
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password);
      // Redirect handled by useEffect above
    } catch (err: any) {
      setError(err?.message || t('auth.error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-bg via-brand-dark to-brand-bg" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-20">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center">
              <Unlock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-wider">
              UN<span className="text-brand-red">LOCKED</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold mb-2">{t('auth.create_account')}</h1>
          <p className="text-brand-text-secondary text-sm">
            {t('auth.signup_subtitle')}
          </p>
        </div>

        {/* Form */}
        <div className="card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                {t('auth.full_name')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.name_placeholder')}
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_hint')}
                  className="input-field !pl-12 !pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                {t('auth.confirm_password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirm_password_placeholder')}
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="space-y-2">
                {passwordChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        check.met
                          ? 'bg-green-500'
                          : 'bg-brand-surface border border-brand-border'
                      }`}
                    >
                      {check.met && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`text-xs ${
                        check.met ? 'text-green-400' : 'text-brand-text-muted'
                      }`}
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-brand-border bg-brand-surface text-brand-red focus:ring-brand-red/50"
              />
              <span className="text-sm text-brand-text-secondary">
                {t('auth.agree_to')}{' '}
                <Link href="#" className="text-brand-red hover:underline">
                  {t('auth.terms_of_service')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="#" className="text-brand-red hover:underline">
                  {t('auth.privacy_policy')}
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.create_account')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-xs text-brand-text-muted uppercase">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          {/* Apple */}
          <button disabled className="w-full flex items-center justify-center gap-3 bg-white/60 text-black/50 font-semibold py-3 rounded-xl cursor-not-allowed relative group">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            {t('auth.signup_apple')}
            <span className="ml-2 text-xs text-black/40">({t('common.coming_soon')})</span>
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-brand-text-secondary mt-6">
            {t('auth.has_account')}{' '}
            <Link
              href="/login"
              className="text-brand-red hover:text-brand-red-light font-medium transition-colors"
            >
              {t('auth.login_link')}
            </Link>
          </p>
        </div>

        {/* Business signup */}
        <p className="text-center text-sm text-brand-text-muted mt-6">
          {t('auth.business_cta')}{' '}
          <Link
            href="/signup?type=company"
            className="text-brand-text-secondary hover:text-white transition-colors underline"
          >
            {t('auth.register_business')}
          </Link>
        </p>
      </div>
    </section>
  );
}
