'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Unlock, Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useCompanyAuth } from '@/lib/companyAuth';

export default function CompanyLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useCompanyAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace('/company');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/company');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
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
            <span className="text-sm font-medium">Business Portal</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-brand-surface rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-brand-text-secondary text-sm mb-6">
            Sign in to manage your escape rooms
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="company@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Password</label>
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
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-brand-text-secondary mt-6">
            Don&apos;t have a business account?{' '}
            <Link href="/company/register" className="text-brand-red hover:underline">
              Register here
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-brand-text-secondary mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to UNLOCKED
          </Link>
        </p>
      </div>
    </div>
  );
}
