'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieConsent } from './CookieConsent';
import { PhonePrompt } from './PhonePrompt';
import { motion, AnimatePresence } from 'framer-motion';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCompanyRoute = pathname.startsWith('/company');
  const isPhotosApp = pathname.startsWith('/photos-app');

  if (isCompanyRoute || isPhotosApp) {
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
