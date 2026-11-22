'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { Building2, MapPin, Search, Loader2, ChevronRight, DoorOpen } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { themeLabel } from '@/lib/roomThemes';
import { CompanyLogo } from '@/components/companies/CompanyLogo';

/** Companies section: every public escape room company with its rooms (convex/companyPages.ts). */
export default function CompaniesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const companies = useQuery(api.companyPages.list);
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!companies) return [];
    if (!s) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(s) || c.city.toLowerCase().includes(s));
  }, [companies, q]);

  // The profile is for logged-in players: remember where to come back to.
  const openProfile = (id: string) => {
    if (isAuthenticated) return router.push(`/companies/${id}`);
    try { sessionStorage.setItem('unlocked_after_login', `/companies/${id}`); } catch {}
    router.push('/login');
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-24 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-7 h-7 text-brand-red-light" />
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bone">{t('co.title')}</h1>
      </div>
      <p className="text-brand-text-secondary mb-6">{t('co.subtitle')}</p>

      <div className="relative max-w-md mb-8">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('co.search')}
          className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-brand-red focus:outline-hidden"
        />
      </div>

      {!companies ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>
      ) : shown.length === 0 ? (
        <p className="text-brand-text-secondary py-12 text-center">{t('co.none')}</p>
      ) : (
        <div className="space-y-5">
          {shown.map((c) => (
            <div key={c._id} className="rounded-2xl border border-brand-border bg-brand-surface/60 p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <button onClick={() => openProfile(c._id)} className="shrink-0" aria-label={c.name}>
                  <CompanyLogo name={c.name} logo={c.logo} size={56} />
                </button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => openProfile(c._id)} className="text-left">
                    <h2 className="text-lg font-display font-bold text-brand-bone hover:text-brand-red-light truncate">{c.name}</h2>
                  </button>
                  <p className="text-xs text-brand-text-secondary flex items-center gap-3 mt-0.5">
                    {c.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{c.city}</span>}
                    <span className="flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5" />{c.roomCount === 1 ? t('co.rooms_one') : t('co.rooms_many', { n: String(c.roomCount) })}</span>
                  </p>
                </div>
                <button onClick={() => openProfile(c._id)} className="hidden sm:flex btn-ghost text-sm items-center gap-1 shrink-0">
                  {isAuthenticated ? t('co.view_profile') : t('co.login_to_view')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Their rooms */}
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {c.rooms.map((r) => (
                  <Link key={r._id} href={`/rooms/${r._id}`} className="group w-44 shrink-0">
                    <div className="aspect-4/3 rounded-lg overflow-hidden bg-black/40 border border-brand-border">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><DoorOpen className="w-8 h-8 text-brand-red/60" /></div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-brand-bone mt-1.5 truncate group-hover:text-brand-red-light">{r.title}</p>
                    <p className="text-[11px] text-brand-text-muted truncate">{themeLabel(t, r.theme)}</p>
                  </Link>
                ))}
              </div>

              <button onClick={() => openProfile(c._id)} className="sm:hidden mt-3 w-full btn-ghost text-sm flex items-center justify-center gap-1">
                {isAuthenticated ? t('co.view_profile') : t('co.login_to_view')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
