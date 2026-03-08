'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Building2, Mail, Lock, Eye, EyeOff, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function PhotosRegisterPage() {
  const router = useRouter();
  const registerMutation = useMutation(api.companies.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await registerMutation({
        name,
        email,
        phone,
        address: city,
        city,
        description: '',
        password,
      });

      if (result && typeof result === 'object' && 'error' in result) {
        setError((result as { error: string }).error);
        return;
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-wider">
              UN<span className="text-brand-red">LOCKED</span>
              <span className="text-brand-text-muted text-sm ml-1.5 font-normal">Photos</span>
            </span>
          </div>
          <p className="text-brand-text-secondary text-sm">
            Create your account to get started
          </p>
        </div>

        {/* Form */}
        <div className="bg-brand-surface rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-bold mb-6">Create Account</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="Your escape room business"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="+30 210 1234567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="Athens"
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

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
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
        </div>

        <p className="text-center text-sm text-brand-text-secondary mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-red hover:underline font-medium">
            Sign In
          </Link>
        </p>

        <p className="text-center text-xs text-brand-text-muted mt-4">
          Powered by <span className="text-brand-red font-bold">UNLOCKED</span>
        </p>
      </div>
    </div>
  );
}
