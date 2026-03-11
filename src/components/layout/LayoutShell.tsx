'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieConsent } from './CookieConsent';
import { PhonePrompt } from './PhonePrompt';
import { motion, AnimatePresence } from 'framer-motion';

export function LayoutShell({ children }: { children: React.ReactNode }) {
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
    pathname.startsWith('/cookies');

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
