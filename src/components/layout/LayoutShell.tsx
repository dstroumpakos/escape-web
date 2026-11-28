'use client';

import { usePathname, useSelectedLayoutSegments } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieConsent } from './CookieConsent';

import Link from 'next/link';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from '@/lib/i18n';
import { HorrorDefs } from '@/components/horror/HorrorDefs';
import { HorrorFX } from '@/components/horror/HorrorFX';
import { AmbientMusic } from '@/components/horror/AmbientMusic';
import { HorrorIntro } from '@/components/horror/HorrorIntro';
import { BloodDrips } from '@/components/horror/BloodDrips';
import { ChristmasDecor } from '@/components/seasonal/ChristmasDecor';
import { usePageMode } from '@/lib/mode';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  // Puzzle side: no fright effects at all. The home is always both sides (usePageMode).
  const mode = usePageMode();
  // On business./photos. subdomains the proxy rewrites /x to /company/x or
  // /photos-app/x. usePathname() shows the visible URL, but the route segments
  // are the rewritten ones on both server and client, so use them to recognise
  // the portals without a hydration mismatch.
  const segments = useSelectedLayoutSegments();
  const isCompanyRoute = pathname.startsWith('/company') || segments[0] === 'company';
  const isPhotosApp = pathname.startsWith('/photos-app') || segments[0] === 'photos-app';

  // Subdomain flag for the few pages served as-is on a subdomain (e.g. /p/ on photos.).
  // Set after mount: reading the cookie during the first render made the client
  // disagree with the server and threw a hydration error.
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isBusinessSubdomain, setIsBusinessSubdomain] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      if (
        document.cookie.includes('x-subdomain=') ||
        h === 'photos.unlocked.gr' ||
        h === 'business.unlocked.gr'
      ) {
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

  const isComingSoon = pathname === '/coming-soon';
  // Pages shown inside the phone app (WebView): no site chrome at all.
  const isEmbed = pathname.startsWith('/embed/');

  const hideMainLayout = isEmbed || isCompanyRoute || isPhotosApp || isComingSoon || (isSubdomain && !isPublicPage);

  // The company portal and photo app keep their own look whatever side the player picked
  useEffect(() => {
    if (mode === undefined) return; // still hydrating: the head script already set it
    const el = document.documentElement;
    if (hideMainLayout || !mode) el.removeAttribute('data-mode');
    else el.setAttribute('data-mode', mode);
  }, [hideMainLayout, mode]);

  if (hideMainLayout) {
    // Company portal / Photos app have their own layout — no main Navbar/Footer
    return (
      <>
        <HorrorDefs />
        {children}
        {/* Keep the coming-soon password form clear; consent is asked once inside */}
        {!isComingSoon && !isEmbed && <CookieConsent />}
      </>
    );
  }

  // Business subdomain public pages — minimal header (no consumer nav links)
  if (isBusinessSubdomain && isPublicPage) {
    return (
      <>
        <HorrorDefs />
        <header className="fixed top-0 left-0 right-0 z-50 glass shadow-lg shadow-black/40">
          <BloodDrips count={16} seed={5} maxLength={22} falling={false} className="top-full!" />
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-linear-to-b from-[#e0141f] to-brand-red rounded-md flex items-center justify-center shadow-[0_0_18px_rgba(200,16,27,0.6)]">
                  <EyeKeyhole className="w-7 h-7" blink />
                </div>
                <span className="font-blood text-lg tracking-wider text-brand-bone">
                  UN<span className="text-brand-red-light text-blood-glow">LOCKED</span>
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
          {children}
        </main>
        <Footer />
        <HorrorFX />
        {/* Lights and snow in the Christmas season only (lib/seasonal.ts) */}
        <ChristmasDecor />
        <CookieConsent />
      </>
    );
  }

  return (
    <>
      <HorrorDefs />
      {/* The cold open plays on the homepage only, never on a shared booking link */}
      {pathname === '/' && mode === 'horror' && <HorrorIntro />}
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      {mode !== 'puzzle' && <HorrorFX />}
      {/* Lights and snow in the Christmas season only (lib/seasonal.ts) */}
      <ChristmasDecor />
      {/* Quiet background music, both sides; the speaker in the navbar turns it off */}
      <AmbientMusic />
      <CookieConsent />
      {/* No phone popup: booking works without a phone, and players can add one in Settings */}
    </>
  );
}
