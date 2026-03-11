'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Unlock, Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Calendar, QrCode, BarChart2, Code, Globe } from 'lucide-react';
import { useCompanyAuth, useCompanyPath } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function CompanyLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, isAuthenticated } = useCompanyAuth();
  const p = useCompanyPath();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const adminLogin = useMutation(api.companies.adminLogin);

  if (isAuthenticated) {
    router.replace(p('/company'));
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Try admin login first
      try {
        const adminResult = await adminLogin({ email });
        if (adminResult?.isAdmin) {
          localStorage.setItem('unlocked_admin', JSON.stringify(adminResult));
          router.replace('/admin');
          return;
        }
      } catch {
        // Not an admin, continue with normal login
      }
      await login(email, password);
      router.replace(p('/company'));
    } catch (err: any) {
      setError(err?.message || t('company.auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
              <Unlock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-wider">
              UN<span className="text-brand-red">LOCKED</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-brand-text-secondary">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{t('company.auth.portal')}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-brand-surface rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-bold mb-2">{t('company.auth.welcome')}</h1>
          <p className="text-brand-text-secondary text-sm mb-6">
            {t('company.auth.subtitle')}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder={t('company.auth.email')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-3 text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('company.auth.login')} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-brand-text-secondary mt-6">
            {t('company.auth.no_account')}{' '}
            <Link href={p('/company/register')} className="text-brand-red hover:underline">
              {t('company.auth.register_link')}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-brand-text-secondary mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            {t('company.auth.back_to_unlocked')}
          </Link>
        </p>
      </div>

      {/* ── Features Section ── */}
      <div className="w-full max-w-4xl mt-16">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2">{t('company.auth.why_unlocked')}</h2>
          <p className="text-sm text-brand-text-secondary">{t('company.auth.why_unlocked_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Calendar, title: t('business.feature1.title'), desc: t('business.feature1.desc') },
            { icon: QrCode, title: t('business.feature2.title'), desc: t('business.feature2.desc') },
            { icon: BarChart2, title: t('business.feature3.title'), desc: t('business.feature3.desc') },
            { icon: Code, title: t('business.feature4.title'), desc: t('business.feature4.desc') },
            { icon: Globe, title: t('business.feature5.title'), desc: t('business.feature5.desc'), href: '/services/website' },
            { icon: Shield, title: t('company.auth.feature_free_title'), desc: t('company.auth.feature_free_desc') },
          ].map((f, i) => (
            <div key={i} className="bg-brand-surface rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
              <f.icon className="w-6 h-6 text-brand-red mb-3" />
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed">{f.desc}</p>
              {(f as any).href && (
                <Link href={(f as any).href} className="text-xs text-brand-red hover:underline mt-2 inline-block">
                  {t('company.auth.learn_more')} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
