'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Unlock, Building2, Mail, Lock, Eye, EyeOff, Phone, MapPin, FileText, ArrowRight } from 'lucide-react';

export default function CompanyRegisterPage() {
  const router = useRouter();
  const registerMutation = useMutation(api.companies.register);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    vatNumber: '',
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
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
        description: form.description,
        password: form.password,
      });

      if (result && typeof result === 'object' && 'error' in result) {
        setError((result as { error: string }).error);
        return;
      }

      // Registration successful — redirect to login
      router.push('/company/login?registered=true');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
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
            <span className="text-sm font-medium">Register Your Business</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-brand-surface rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-bold mb-2">Create business account</h1>
          <p className="text-brand-text-secondary text-sm mb-6">
            List your escape rooms on UNLOCKED and reach thousands of players
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="Your Company Name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="company@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="+30 6XX XXX XXXX"
                  required
                />
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-brand-text-secondary mb-1.5">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                    placeholder="Street Address"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-brand-text-secondary mb-1.5">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="Athens"
                  required
                />
              </div>
            </div>

            {/* VAT */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">VAT Number (optional)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={form.vatNumber}
                  onChange={(e) => updateField('vatNumber', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="EL XXXXXXXXX"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors resize-none"
                placeholder="Tell us about your escape room business..."
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
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
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-brand-text-secondary mt-6">
            Already have a business account?{' '}
            <Link href="/company/login" className="text-brand-red hover:underline">
              Sign in
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
