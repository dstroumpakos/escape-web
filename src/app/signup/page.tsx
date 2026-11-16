'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
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
  const { signup, confirmSignup, resendSignupCode, isAuthenticated } = useAuth();
  // Step 2 of sign-up: the 6-digit code we emailed (convex/signupCodes.ts)
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');

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
      // Code emailed: ask for it (the account is created after that)
      setCode('');
      setInfo('');
      setStep('code');
    } catch (err: any) {
      // ConvexError puts the error code in err.data
      const code = err?.data ?? '';
      
      switch (code) {
        case 'EMAIL_EXISTS':
          setError(t('auth.error_email_exists'));
          break;
        case 'INVALID_EMAIL':
          setError(t('auth.error_invalid_email'));
          break;
        case 'NAME_REQUIRED':
          setError(t('auth.error_name_required'));
          break;
        case 'PASSWORD_LENGTH':
          setError(t('auth.error_password_length'));
          break;
        case 'PASSWORD_UPPERCASE':
          setError(t('auth.error_password_uppercase'));
          break;
        case 'PASSWORD_NUMBER':
          setError(t('auth.error_password_number'));
          break;
        case 'NAME_RESERVED':
          setError(t('auth.error_name_reserved'));
          break;
        case 'NAME_TOO_LONG':
          setError(t('auth.error_name_too_long'));
          break;
        case 'TOO_MANY_ATTEMPTS':
          setError(t('auth.code_too_many'));
          break;
        default:
          // Fallback: check message string for older error format
          const msg = [err?.message, err?.data, err?.toString?.()].filter(Boolean).join(' ');
          if (msg.includes('already exists') || msg.includes('EMAIL_EXISTS')) {
            setError(t('auth.error_email_exists'));
          } else if (msg.includes('Name is required')) {
            setError(t('auth.error_name_required'));
          } else {
            setError(t('auth.error_generic'));
          }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const CODE_ERRORS: Record<string, string> = {
    CODE_INVALID: 'auth.code_invalid',
    CODE_EXPIRED: 'auth.code_expired',
    TOO_MANY_ATTEMPTS: 'auth.code_too_many',
    EMAIL_EXISTS: 'auth.error_email_exists',
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      const err = await confirmSignup(email, code);
      if (err) setError(t(CODE_ERRORS[err] ?? 'auth.error_generic'));
      // Success: logged in, the useEffect above redirects
    } catch {
      setError(t('auth.error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      await resendSignupCode(email);
      setCode('');
      setInfo(t('auth.code_resent'));
    } catch (err: any) {
      setError(t(err?.data === 'TOO_MANY_ATTEMPTS' ? 'auth.code_too_many' : 'auth.error_generic'));
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-brand-bg via-brand-dark to-brand-bg" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-20">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center">
              <EyeKeyhole className="w-8 h-8" />
            </div>
            <span className="text-2xl font-display font-bold tracking-wider">
              UN<span className="text-brand-red-light">LOCKED</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold mb-2">{t('auth.create_account')}</h1>
          <p className="text-brand-text-secondary text-sm">
            {t('auth.signup_subtitle')}
          </p>
        </div>

        {/* Form */}
        <div className="card p-6 md:p-8">
          {step === 'code' ? (
            <form onSubmit={handleConfirm} className="space-y-5">
              <div className="text-center">
                <Mail className="w-10 h-10 mx-auto mb-3 text-brand-red-light" />
                <h2 className="text-lg font-bold mb-1">{t('auth.code_title')}</h2>
                <p className="text-sm text-brand-text-secondary">{t('auth.code_sent', { email: email.trim().toLowerCase() })}</p>
              </div>
              {error && (
                <div className="bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
              {info && (
                <div className="bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 text-sm rounded-xl px-4 py-3">{info}</div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-text-secondary">{t('auth.code_label')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                  required
                />
              </div>
              <button type="submit" disabled={isLoading || code.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? '…' : t('auth.code_confirm')}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => { setStep('form'); setError(''); setInfo(''); }} className="text-brand-text-secondary hover:text-white">
                  {t('auth.code_back')}
                </button>
                <button type="button" onClick={handleResend} className="text-brand-red-light hover:underline">
                  {t('auth.code_resend')}
                </button>
              </div>
            </form>
          ) : (
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
                  className="input-field pl-12!"
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
                  className="input-field pl-12!"
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
                  className="input-field pl-12! pr-12!"
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
                  className="input-field pl-12!"
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
                className="w-4 h-4 mt-0.5 rounded-sm border-brand-border bg-brand-surface text-brand-red-light focus:ring-brand-red/50"
              />
              <span className="text-sm text-brand-text-secondary">
                {t('auth.agree_to')}{' '}
                <Link href="/terms" target="_blank" className="text-brand-red-light hover:underline">
                  {t('auth.terms_of_service')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="/privacy" target="_blank" className="text-brand-red-light hover:underline">
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
          )}

          {/* Login link */}
          <p className="text-center text-sm text-brand-text-secondary mt-6">
            {t('auth.has_account')}{' '}
            <Link
              href="/login"
              className="text-brand-red-light hover:text-brand-red-light font-medium transition-colors"
            >
              {t('auth.login_link')}
            </Link>
          </p>
        </div>

        {/* Business signup */}
        <p className="text-center text-sm text-brand-text-muted mt-6">
          {t('auth.business_cta')}{' '}
          <Link
            href="/company/register"
            className="text-brand-text-secondary hover:text-white transition-colors underline"
          >
            {t('auth.register_business')}
          </Link>
        </p>
      </div>
    </section>
  );
}
