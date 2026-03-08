'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Camera, LogOut, Unlock } from 'lucide-react';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { CompanyAuthProvider, useCompanyAuth } from '@/lib/companyAuth';
import { I18nProvider } from '@/lib/i18n';

function PhotosShell({ children }: { children: React.ReactNode }) {
  const { company, isLoading, isAuthenticated, logout } = useCompanyAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login' || pathname === '/photos-app/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoginPage) {
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

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <header className="h-14 bg-brand-surface border-b border-white/5 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-red rounded-lg flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-display font-bold tracking-wider">
            UN<span className="text-brand-red">LOCKED</span>
            <span className="text-brand-text-muted text-xs ml-1.5 font-normal">Photos</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-brand-text-secondary hidden sm:block">
            {company?.name}
          </span>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-brand-text-muted hover:text-brand-red"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}

export default function PhotosAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <I18nProvider>
        <CompanyAuthProvider>
          <PhotosShell>{children}</PhotosShell>
        </CompanyAuthProvider>
      </I18nProvider>
    </ConvexClientProvider>
  );
}
