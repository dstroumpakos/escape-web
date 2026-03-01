'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Unlock,
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { CompanyAuthProvider, useCompanyAuth } from '@/lib/companyAuth';
import { PlanBadge } from './PlanBadge';
import { useTranslation } from '@/lib/i18n';

function CompanyShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { company, isLoading, isAuthenticated, logout } = useCompanyAuth();
  const router = useRouter();
  const pathname = usePathname();

  const sidebarLinks = [
    { href: '/company', label: t('company.nav.dashboard'), icon: LayoutDashboard },
    { href: '/company/bookings', label: t('company.nav.bookings'), icon: CalendarDays },
    { href: '/company/rooms', label: t('company.nav.rooms'), icon: DoorOpen },
    { href: '/company/settings', label: t('company.nav.settings'), icon: Settings },
  ];

  // Allow auth pages without redirect
  const isAuthPage =
    pathname === '/company/login' || pathname === '/company/register';
  const isOnboardingPage = pathname === '/company/onboarding';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage) {
      router.replace('/company/login');
    }
  }, [isLoading, isAuthenticated, isAuthPage, router]);

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
      router.replace('/company/onboarding');
    }
  }, [isLoading, isAuthenticated, company?.onboardingStatus, isAuthPage, isOnboardingPage, router]);

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
    router.push('/company/login');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-brand-surface border-r border-white/5 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-white/5">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
            <Unlock className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-display font-bold tracking-wider">
            UN<span className="text-brand-red">LOCKED</span>
          </span>
        </div>

        {/* Company info */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red font-bold">
              {company?.name?.charAt(0)?.toUpperCase() || <Building2 className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{company?.name}</p>
              <p className="text-xs text-brand-text-secondary truncate">{company?.email}</p>
            </div>
          </div>
          {company?.platformPlan && (
            <PlanBadge plan={company.platformPlan} className="mt-3" />
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === '/company'
                ? pathname === '/company'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-red/10 text-brand-red'
                    : 'text-brand-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
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
            href="/"
            className="flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-xs text-brand-text-secondary/60 hover:text-brand-text-secondary transition-all"
          >
            {t('company.nav.back_to_site')}
          </Link>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand-surface border-b border-white/5 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-red rounded-lg flex items-center justify-center">
            <Unlock className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-display font-bold">
            UN<span className="text-brand-red">LOCKED</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-brand-text-secondary hover:text-white"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-surface border-t border-white/5 flex">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href === '/company'
              ? pathname === '/company'
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-brand-red' : 'text-brand-text-secondary'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="pt-14 md:pt-0 pb-20 md:pb-0">{children}</div>
      </main>
    </div>
  );
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <CompanyAuthProvider>
        <CompanyShell>{children}</CompanyShell>
      </CompanyAuthProvider>
    </ConvexClientProvider>
  );
}
