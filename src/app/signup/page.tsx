'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Unlock, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
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
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Passwords match', met: password.length > 0 && password === confirmPassword },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the terms and conditions.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password);
      // Redirect handled by useEffect above
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
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
          <h1 className="text-2xl font-display font-bold mb-2">Create Account</h1>
          <p className="text-brand-text-secondary text-sm">
            Join the community and start your escape journey
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
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
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
                I agree to the{' '}
                <Link href="#" className="text-brand-red hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-brand-red hover:underline">
                  Privacy Policy
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
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-xs text-brand-text-muted uppercase">or</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          {/* Apple */}
          <button className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Sign up with Apple
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-brand-text-secondary mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-brand-red hover:text-brand-red-light font-medium transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>

        {/* Business signup */}
        <p className="text-center text-sm text-brand-text-muted mt-6">
          Want to list your escape rooms?{' '}
          <Link
            href="/signup?type=company"
            className="text-brand-text-secondary hover:text-white transition-colors underline"
          >
            Register as a business
          </Link>
        </p>
      </div>
    </section>
  );
}
