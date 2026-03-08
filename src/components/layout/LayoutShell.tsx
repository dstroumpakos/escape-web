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

  const [isPhotosSubdomain, setIsPhotosSubdomain] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'photos.unlocked.gr') {
      setIsPhotosSubdomain(true);
    }
  }, []);

  if (isCompanyRoute || isPhotosApp || isPhotosSubdomain) {
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
