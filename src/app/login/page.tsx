'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Unlock, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Redirect to home once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // Redirect handled by useEffect above
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-bg via-brand-dark to-brand-bg" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />

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
          <h1 className="text-2xl font-display font-bold mb-2">{t('auth.welcome_back')}</h1>
          <p className="text-brand-text-secondary text-sm">
            {t('auth.login_subtitle')}
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
                  placeholder={t('auth.password_placeholder')}
                  className="input-field !pl-12 !pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-brand-border bg-brand-surface text-brand-red focus:ring-brand-red/50"
                />
                <span className="text-sm text-brand-text-secondary">
                  {t('auth.remember_me')}
                </span>
              </label>
              <Link
                href="#"
                className="text-sm text-brand-red hover:text-brand-red-light transition-colors"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>

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
                  {t('auth.login_button')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-brand-text-secondary mt-6">
            {t('auth.no_account')}{' '}
            <Link
              href="/signup"
              className="text-brand-red hover:text-brand-red-light font-medium transition-colors"
            >
              {t('auth.signup_free')}
            </Link>
          </p>
        </div>

        {/* Company login */}
        <p className="text-center text-sm text-brand-text-muted mt-6">
          {t('auth.business_question')}{' '}
          <Link
            href="/login?type=company"
            className="text-brand-text-secondary hover:text-white transition-colors underline"
          >
            {t('auth.company_login')}
          </Link>
        </p>
      </div>
    </section>
  );
}
