'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Vault, ScrollText, BookOpen, Briefcase, Menu, X, LogOut, User, Bell, Ticket, MessageCircle } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useBackgroundKeySharing } from '@/lib/useChat';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { BOOKING_ENABLED } from '@/lib/features';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ModeToggle } from '@/components/ModeToggle';
import { BloodDrips } from '@/components/horror/BloodDrips';

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const icon = size === 'lg' ? 'w-8 h-8' : 'w-7 h-7';
  const text = size === 'lg' ? 'text-2xl' : 'text-base sm:text-lg';
  return (
    <span className="flex items-center gap-2.5 group">
      <span
        className={`logo-box relative ${box} rounded-md flex items-center justify-center bg-linear-to-b from-[#e0141f] to-brand-red border border-brand-red-light/40 shadow-[0_0_18px_rgba(var(--glow),0.55)] group-hover:animate-shake`}
      >
        <EyeKeyhole className={icon} blink />
      </span>
      <span className="flex flex-col items-center leading-none">
        <span className={`font-blood ${text} tracking-wider text-brand-bone`}>
          UN<span className="text-brand-red-light text-blood-glow animate-flicker">LOCKED</span>
        </span>
        {/* Category descriptor, so a first-time visitor reads "UNLOCKED Escape Rooms".
            English in every language on purpose: it is the term players search for.
            The negative right margin cancels the trailing letter-space so it centres. */}
        <span
          className={`mt-1 font-sans font-semibold uppercase whitespace-nowrap text-brand-red-light/90 ${
            size === 'lg' ? 'text-[11px] tracking-[0.42em] -mr-[0.42em]' : 'text-[8px] sm:text-[9px] tracking-[0.38em] -mr-[0.38em]'
          }`}
        >
          Escape Rooms
        </span>
      </span>
    </span>
  );
}

/** Registers this browser for encrypted chat and passes keys on to friends' new devices. */
function ChatKeySharer() {
  useBackgroundKeySharing();
  return null;
}

/** Unread-chats badge. */
function UnreadBadge({ n, className = '' }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={`min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center ${className}`}>
      {n > 9 ? '9+' : n}
    </span>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const token = user?.sessionToken;
  const unread = useQuery(api.messages.unreadCount, token ? { sessionToken: token } : 'skip') ?? 0;
  const me = useQuery(api.users.getById, token ? { sessionToken: token } : 'skip');
  const myAvatar = (me as any)?.avatar || user?.avatar || '';
  // Live name from the profile (the one saved at login can be empty); never the email
  const myName: string = (me as any)?.name || user?.name || '';

  // Shop and contact show as small icons on the desktop bar (a vault, a scroll).
  const navLinks: { href: string; label: string; Icon?: React.ElementType }[] = [
    { href: '/', label: t('nav.home') },
    { href: '/discover', label: t('nav.discover') },
    { href: '/companies', label: t('nav.companies') },
    ...(BOOKING_ENABLED ? [{ href: '/offers', label: t('nav.offers') }] : []),
    { href: '/map', label: t('nav.map') },
    // The community is for logged-in players only.
    ...(isAuthenticated ? [{ href: '/social', label: t('nav.social') }] : []),
    { href: '/leaderboard', label: t('nav.leaderboard') },
    ...(isAuthenticated ? [{ href: '/passport', label: t('nav.passport'), Icon: BookOpen }] : []),
    { href: '/jobs', label: t('nav.jobs'), Icon: Briefcase },
    { href: '/shop', label: t('nav.shop'), Icon: Vault },
    { href: '/contact', label: t('nav.contact'), Icon: ScrollText },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const linkClass = (active: boolean) =>
    `relative px-3.5 py-2 text-sm font-medium transition-colors duration-200 group/link ${
      active ? 'text-brand-red-light text-blood-glow' : 'text-brand-text-secondary hover:text-brand-bone'
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || isOpen
          ? 'bg-black/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]'
          : 'bg-linear-to-b from-black/80 to-transparent'
      }`}
    >
      {/* Blood running off the bottom edge once the bar is solid */}
      <div className={`transition-opacity duration-700 ${isScrolled || isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <BloodDrips count={18} seed={7} maxLength={26} speed={5} className="top-full!" />
      </div>

      {isAuthenticated && <ChatKeySharer />}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" aria-label="UNLOCKED">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.Icon ? `${linkClass(active)} px-2.5!` : linkClass(active)}
                  title={link.Icon ? link.label : undefined}
                  aria-label={link.Icon ? link.label : undefined}
                >
                  {link.Icon ? (
                    <link.Icon className="w-5 h-5 transition-transform duration-300 group-hover/link:scale-110 group-hover/link:drop-shadow-[0_0_6px_rgba(var(--glow-hi),0.8)]" />
                  ) : (
                    link.label
                  )}
                  {/* Scratch underline */}
                  <span
                    className={`absolute left-3 right-3 -bottom-0.5 h-[2px] origin-left bg-linear-to-r from-brand-red-light via-brand-red to-transparent transition-transform duration-300 ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover/link:scale-x-100'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />
            <LanguageToggle />
            {isAuthenticated ? (
              <>
                <Link
                  href="/messages"
                  className="p-2 rounded-md text-brand-text-secondary hover:text-brand-red-light hover:bg-brand-red/10 transition-colors relative"
                  aria-label={t('nav.messages')}
                  title={t('nav.messages')}
                >
                  <MessageCircle className="w-5 h-5" />
                  <UnreadBadge n={unread} className="absolute -top-0.5 -right-0.5" />
                </Link>
                <Link
                  href="/notifications"
                  className="p-2 rounded-md text-brand-text-secondary hover:text-brand-red-light hover:bg-brand-red/10 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                </Link>
                {BOOKING_ENABLED && (
                <Link
                  href="/tickets"
                  className="p-2 rounded-md text-brand-text-secondary hover:text-brand-red-light hover:bg-brand-red/10 transition-colors"
                >
                  <Ticket className="w-5 h-5" />
                </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-border bg-black/40 hover:border-brand-red/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-red/20 border border-brand-red/40 flex items-center justify-center text-brand-red-light text-xs font-bold overflow-hidden">
                    {myAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={myAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      myName.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                    )}
                  </div>
                  {myName && <span className="text-sm font-medium max-w-[120px] truncate">{myName}</span>}
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1.5" aria-label={t('nav.logout')}>
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">
                  {t('nav.login')}
                </Link>
                <Link href="/signup" className="btn-primary text-sm py-2.5! px-6!">
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative p-2 rounded-md text-brand-text-secondary hover:text-brand-red-light hover:bg-brand-red/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            {!isOpen && unread > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand-red" />}
          </button>
        </div>

        {/* Mobile Nav */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-[80vh] pb-4 overflow-y-auto' : 'max-h-0 overflow-hidden'
          }`}
        >
          <div className="flex flex-col gap-1 pt-2 border-t border-brand-red/20 mt-2">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-md text-base font-display font-semibold transition-all flex items-center gap-3 ${
                  pathname === link.href
                    ? 'text-brand-red-light bg-brand-red/10 text-blood-glow'
                    : 'text-brand-text-secondary hover:text-brand-bone hover:bg-brand-red/5'
                }`}
                style={isOpen ? { animation: `fade-up 0.5s ease-out ${i * 0.05}s both` } : undefined}
              >
                <span className="font-type text-xs text-brand-red/70">{String(i + 1).padStart(2, '0')}</span>
                {link.label}
              </Link>
            ))}
            <div className="border-t border-brand-red/20 mt-2 pt-3 flex flex-col gap-1 px-4">
              <div className="mb-2 flex items-center gap-2"><ModeToggle withLabels /><LanguageToggle /></div>
              {isAuthenticated ? (
                <>
                  {BOOKING_ENABLED && (
                  <Link href="/tickets" className="px-4 py-3 rounded-md text-sm font-medium text-brand-text-secondary hover:text-brand-bone hover:bg-brand-red/5 flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> {t('nav.tickets')}
                  </Link>
                  )}
                  <Link href="/profile" className="px-4 py-3 rounded-md text-sm font-medium text-brand-text-secondary hover:text-brand-bone hover:bg-brand-red/5 flex items-center gap-2">
                    <User className="w-4 h-4" /> {t('nav.profile')}
                  </Link>
                  <Link href="/messages" className="px-4 py-3 rounded-md text-sm font-medium text-brand-text-secondary hover:text-brand-bone hover:bg-brand-red/5 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> {t('nav.messages')}
                    <UnreadBadge n={unread} className="ml-auto" />
                  </Link>
                  <Link href="/notifications" className="px-4 py-3 rounded-md text-sm font-medium text-brand-text-secondary hover:text-brand-bone hover:bg-brand-red/5 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> {t('nav.notifications')}
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost text-sm flex-1 text-center flex items-center justify-center gap-1.5 mt-2">
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3 mt-1">
                    <Link href="/login" className="btn-ghost text-sm flex-1 text-center">
                      {t('nav.login')}
                    </Link>
                    <Link href="/signup" className="btn-primary text-sm py-2.5! flex-1 text-center">
                      {t('nav.signup')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
