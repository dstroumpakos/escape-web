'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Lock, Unlock, LogOut, User, Bell, Ticket, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Discover' },
  { href: '/map', label: 'Map' },
  { href: '/social', label: 'Social' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center group-hover:animate-glow-pulse transition-all">
              <Unlock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-wider">
              UN<span className="text-brand-red">LOCKED</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? 'text-brand-red bg-brand-red/10'
                    : 'text-brand-text-secondary hover:text-white hover:bg-brand-surface/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/notifications"
                  className="p-2 rounded-lg text-brand-text-secondary hover:text-white hover:bg-brand-surface/50 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                </Link>
                <Link
                  href="/tickets"
                  className="p-2 rounded-lg text-brand-text-secondary hover:text-white hover:bg-brand-surface/50 transition-colors"
                >
                  <Ticket className="w-5 h-5" />
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-surface/50 hover:bg-brand-surface transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{user?.name || user?.email}</span>
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/company/login"
                  className="text-sm text-brand-text-secondary hover:text-white transition-colors flex items-center gap-1"
                >
                  <Building2 className="w-4 h-4" /> Business
                </Link>
                <Link href="/login" className="btn-ghost text-sm">
                  Log In
                </Link>
                <Link href="/signup" className="btn-primary text-sm !py-2.5 !px-6">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-brand-text-secondary hover:text-white hover:bg-brand-surface/50 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-80 pb-4' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'text-brand-red bg-brand-red/10'
                    : 'text-brand-text-secondary hover:text-white hover:bg-brand-surface/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-1 mt-2 px-4">
              {isAuthenticated ? (
                <>
                  <Link href="/tickets" className="px-4 py-3 rounded-lg text-sm font-medium text-brand-text-secondary hover:text-white hover:bg-brand-surface/50 flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> My Tickets
                  </Link>
                  <Link href="/profile" className="px-4 py-3 rounded-lg text-sm font-medium text-brand-text-secondary hover:text-white hover:bg-brand-surface/50 flex items-center gap-2">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link href="/notifications" className="px-4 py-3 rounded-lg text-sm font-medium text-brand-text-secondary hover:text-white hover:bg-brand-surface/50 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Notifications
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost text-sm flex-1 text-center flex items-center justify-center gap-1.5 mt-2">
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" className="btn-ghost text-sm flex-1 text-center">
                    Log In
                  </Link>
                  <Link href="/signup" className="btn-primary text-sm !py-2.5 flex-1 text-center">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
