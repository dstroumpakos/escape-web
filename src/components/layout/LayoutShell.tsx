'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieConsent } from './CookieConsent';
import { PhonePrompt } from './PhonePrompt';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Unlock } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from '@/lib/i18n';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isCompanyRoute = pathname.startsWith('/company');
  const isPhotosApp = pathname.startsWith('/photos-app');

  // Detect subdomain via cookie set by middleware (works on first render, no SSR mismatch)
  const [isSubdomain, setIsSubdomain] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.includes('x-subdomain=');
    }
    return false;
  });
  const [isBusinessSubdomain, setIsBusinessSubdomain] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      if (h === 'photos.unlocked.gr' || h === 'business.unlocked.gr') {
        setIsSubdomain(true);
      }
      if (h === 'business.unlocked.gr') {
        setIsBusinessSubdomain(true);
      }
    }
  }, []);

  // On business subdomain, public pages (services, about, contact, etc.) should show Navbar/Footer
  const isPublicPage =
    pathname.startsWith('/services') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/for-escape-rooms');

  const hideMainLayout = isCompanyRoute || isPhotosApp || (isSubdomain && !isPublicPage);

  if (hideMainLayout) {
    // Company portal / Photos app have their own layout — no main Navbar/Footer
    return (
      <>
        {children}
        <CookieConsent />
      </>
    );
  }

  // Business subdomain public pages — minimal header (no consumer nav links)
  if (isBusinessSubdomain && isPublicPage) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 glass shadow-lg shadow-black/20">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-display font-bold tracking-wider">
                  UN<span className="text-brand-red">LOCKED</span>
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <LanguageToggle />
                <Link href="/company/login" className="btn-outline text-sm px-4 py-2">
                  {t('nav.login')}
                </Link>
                <Link href="/company/register" className="btn-primary text-sm px-4 py-2">
                  {t('nav.signup')}
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <main className="flex-1">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {children}
          </motion.div>
        </main>
        <Footer />
        <CookieConsent />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {children}
        </motion.div>
      </main>
      <Footer />
      <CookieConsent />
      <PhonePrompt />
    </>
  );
}
