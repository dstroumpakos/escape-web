import { redirect } from 'next/navigation';
import { WEB_SERVICES_ENABLED } from '@/lib/features';

// The paid website packages are off for now (src/lib/features.ts).
export default function Layout({ children }: { children: React.ReactNode }) {
  if (!WEB_SERVICES_ENABLED) redirect('/');
  return children;
}
