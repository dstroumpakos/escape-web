'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
  CreditCard,
  Camera,
  BookOpen,
  Globe,
  Clock,
  MoreHorizontal,
  X,
  ExternalLink,
  Wallet,
  ShoppingBag,
  Flame,
  Stamp,
} from 'lucide-react';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { CompanyAuthProvider, useCompanyAuth, useCompanyPath, photosPortalUrl, useMainSiteUrl } from '@/lib/companyAuth';
import { ToastProvider } from '@/components/company/Toast';
import { LanguageToggle } from '@/components/LanguageToggle';
import { PlanBadge } from './PlanBadge';
import { useTranslation } from '@/lib/i18n';
import { BOOKING_ENABLED } from '@/lib/features';

type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
  external?: boolean;
};

function CompanyShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { company, isLoading, isAuthenticated, logout } = useCompanyAuth();
  const homeUrl = useMainSiteUrl();
  const router = useRouter();
  const pathname = usePathname();
  const p = useCompanyPath();
  const [moreOpen, setMoreOpen] = useState(false);
  const [photosUrl, setPhotosUrl] = useState('https://photos.unlocked.gr');

  useEffect(() => setPhotosUrl(photosPortalUrl()), []);

  // Main links (also the phone bottom bar) and the rest (sidebar + "More" sheet).
  const primaryLinks: NavLink[] = [
    { href: p('/company'), label: t('company.nav.dashboard'), icon: LayoutDashboard },
    { href: p('/company/slots'), label: t('cx.nav.slots'), icon: Clock },
    { href: p('/company/passport'), label: t('cx.nav.passport'), icon: Stamp },
    { href: p('/company/bookings'), label: t('company.nav.bookings'), icon: CalendarDays },
    { href: p('/company/rooms'), label: t('company.nav.rooms'), icon: DoorOpen },
  ];
  const secondaryLinks: NavLink[] = [
    ...(BOOKING_ENABLED ? [{ href: p('/company/offers'), label: t('cx.nav.offers'), icon: Flame }] : []),
    { href: photosUrl, label: t('company.nav.photos'), icon: Camera, external: true },
    { href: p('/company/merch'), label: t('shop.portal.nav'), icon: ShoppingBag },
    { href: p('/company/payments'), label: t('company.nav.payments'), icon: Wallet },
    { href: p('/company/billing'), label: t('company.nav.billing'), icon: CreditCard },
    { href: p('/company/settings'), label: t('company.nav.settings'), icon: Settings },
    { href: p('/company/docs'), label: t('company.nav.docs'), icon: BookOpen },
    { href: '/services/website', label: t('company.nav.web_services'), icon: Globe },
  ];
  const allLinks = [...primaryLinks, ...secondaryLinks];

  const isActive = (href: string) =>
    href === p('/company')
      ? pathname === '/company' || pathname === p('/company')
      : !href.startsWith('http') && pathname.startsWith(href);

  // Allow auth pages without redirect (check both /company/... and subdomain /... paths)
  const isAuthPage =
    pathname === '/company/login' || pathname === '/company/register' ||
    pathname === '/login' || pathname === '/register' ||
    pathname === '/company/forgot-password' || pathname === '/forgot-password';
  const isOnboardingPage =
    pathname.startsWith('/company/onboarding') || pathname.startsWith('/onboarding');

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage) {
      router.replace(p('/company/login'));
    }
  }, [isLoading, isAuthenticated, isAuthPage, router, p]);

  // Redirect non-approved companies to onboarding
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      company?.onboardingStatus &&
      company.onboardingStatus !== 'approved' &&
      !isAuthPage &&
      !isOnboardingPage
    ) {
      router.replace(p('/company/onboarding'));
    }
  }, [isLoading, isAuthenticated, company?.onboardingStatus, isAuthPage, isOnboardingPage, router, p]);

  // Browser tab title: "<page> · UNLOCKED Business"
  useEffect(() => {
    const current = [...allLinks].reverse().find((l) => isActive(l.href));
    const page = isAuthPage
      ? pathname.endsWith('register')
        ? t('company.register.title')
        : t('company.auth.portal')
      : isOnboardingPage
      ? t('cx.onboarding.tab_title')
      : current?.label;
    document.title = page ? `${page} · UNLOCKED Business` : 'UNLOCKED Business';
  });

  // Close the "More" sheet when navigating
  useEffect(() => setMoreOpen(false), [pathname]);

  // Auth & onboarding pages render without sidebar
  if (isAuthPage || isOnboardingPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push(p('/company/login'));
  };

  const renderLink = (link: NavLink, className: string, inner: React.ReactNode) =>
    link.external ? (
      <a key={link.href} href={link.href} className={className}>
        {inner}
      </a>
    ) : (
      <Link key={link.href} href={link.href} className={className}>
        {inner}
      </Link>
    );

  const moreActive = secondaryLinks.some((l) => isActive(l.href));

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-brand-surface border-r border-white/5 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between gap-2 px-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
              <EyeKeyhole className="w-6 h-6" />
            </div>
            <span className="text-lg font-display font-bold tracking-wider">
              UN<span className="text-brand-red-light">LOCKED</span>
            </span>
          </div>
          <LanguageToggle />
        </div>

        {/* Company info */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red-light font-bold">
              {company?.name?.charAt(0)?.toUpperCase() || <Building2 className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{company?.name}</p>
              <p className="text-xs text-brand-text-secondary truncate">{company?.email}</p>
            </div>
          </div>
          {company?.platformPlan && (
            <Link href={p('/company/billing')} className="inline-block mt-3" title={t('company.nav.billing')}>
              <PlanBadge plan={company.platformPlan} />
            </Link>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allLinks.map((link, i) => {
            const active = isActive(link.href);
            return (
              <div key={link.href}>
                {i === primaryLinks.length && <div className="h-px bg-white/5 my-3 mx-3" />}
                {renderLink(
                  link,
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-red/10 text-brand-red-light'
                      : 'text-brand-text-secondary hover:text-white hover:bg-white/5'
                  }`,
                  <>
                    <link.icon className="w-5 h-5" />
                    {link.label}
                    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                    {link.external && <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-text-secondary hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            {t('company.nav.logout')}
          </button>
          <Link
            href={homeUrl}
            className="flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-xs text-brand-text-secondary/60 hover:text-brand-text-secondary transition-all"
          >
            {t('company.nav.back_to_site')}
          </Link>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand-surface border-b border-white/5 h-14 flex items-center justify-between px-4">
        <Link href={p('/company')} className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-brand-red rounded-lg flex items-center justify-center shrink-0">
            <EyeKeyhole className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold truncate">{company?.name}</span>
        </Link>
        <LanguageToggle />
      </div>

      {/* Mobile Bottom Nav: 4 main links + More */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-surface border-t border-white/5 flex pb-[env(safe-area-inset-bottom)]">
        {primaryLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? 'text-brand-red-light' : 'text-brand-text-secondary'
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="truncate max-w-full px-1">{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            moreActive ? 'text-brand-red-light' : 'text-brand-text-secondary'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="truncate max-w-full px-1">{t('cx.nav.more')}</span>
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-brand-surface rounded-t-2xl border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="min-w-0">
                <p className="font-semibold truncate">{company?.name}</p>
                <p className="text-xs text-brand-text-secondary truncate">{company?.email}</p>
              </div>
              <button onClick={() => setMoreOpen(false)} className="p-2 -mr-2" aria-label={t('cx.common.close')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {secondaryLinks.map((link) =>
                renderLink(
                  link,
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                    isActive(link.href) ? 'bg-brand-red/10 text-brand-red-light' : 'text-white hover:bg-white/5'
                  }`,
                  <>
                    <link.icon className="w-5 h-5 text-brand-text-secondary" />
                    {link.label}
                    {link.external && <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />}
                  </>
                )
              )}
              <div className="h-px bg-white/5 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="w-5 h-5" />
                {t('company.nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen min-w-0">
        <div className="pt-14 md:pt-0 pb-24 md:pb-0">{children}</div>
      </main>
    </div>
  );
}

export function CompanyLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <CompanyAuthProvider>
        <ToastProvider>
          <CompanyShell>{children}</CompanyShell>
        </ToastProvider>
      </CompanyAuthProvider>
    </ConvexClientProvider>
  );
}
