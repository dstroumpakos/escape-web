'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCompanyRoute = pathname.startsWith('/company');

  if (isCompanyRoute) {
    // Company portal has its own layout — no main Navbar/Footer
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
