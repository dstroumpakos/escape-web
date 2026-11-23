'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Bell, Crown, Diamond, Gift, Headphones, Rocket, ShoppingBag, Store, Tag, Timer, Smartphone } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { localeFor } from '@/lib/languages';

const PERKS = [
  { icon: Rocket, key: 'early_rooms' },
  { icon: Tag, key: 'merch_discount' },
  { icon: Timer, key: 'merch_drops' },
  { icon: Store, key: 'room_prices' },
  { icon: Gift, key: 'welcome_gift' },
  { icon: Diamond, key: 'badge' },
  { icon: Bell, key: 'notifications' },
  { icon: Headphones, key: 'support' },
] as const;

export default function PremiumPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const status = useQuery(api.premium.getStatus, user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip');
  const plans = useQuery(api.premium.getPlanInfo, {});

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto rounded-md bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center mb-5">
            <Crown className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-brand-bone">{t('premium.page.title')}</h1>
          <p className="text-brand-text-secondary mt-4 max-w-2xl mx-auto">{t('premium.page.subtitle')}</p>
          {status?.isPremium && status.premiumExpiresAt && (
            <p className="mt-5 inline-block rounded-md border border-brand-gold/40 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
              {t('premium.page.active_until', {
                date: new Date(status.premiumExpiresAt).toLocaleDateString(localeFor(language)),
              })}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {PERKS.map(({ icon: Icon, key }) => (
            <div key={key} className="panel p-5 flex gap-4">
              <div className="w-11 h-11 shrink-0 rounded-md bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <p className="font-display font-bold text-brand-bone">{t(`premium.perk.${key}`)}</p>
                <p className="text-sm text-brand-text-secondary mt-1">{t(`premium.perk.${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        {plans && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            <div className="panel p-6 text-center">
              <p className="horror-label mb-2">{t('premium.page.monthly')}</p>
              <p className="text-4xl font-display font-black text-brand-bone">€{plans.monthly.price}</p>
              <p className="text-sm text-brand-text-muted">{t('premium.page.per_month')}</p>
            </div>
            <div className="panel p-6 text-center border-brand-gold/40!">
              <p className="horror-label mb-2 text-brand-gold!">{t('premium.page.yearly')}</p>
              <p className="text-4xl font-display font-black text-brand-bone">€{plans.yearly.price}</p>
              <p className="text-sm text-brand-text-muted">{t('premium.page.per_year')}</p>
              <p className="text-xs text-brand-gold mt-2">{t('premium.page.yearly_gift')}</p>
            </div>
          </div>
        )}

        <div className="text-center space-y-4">
          {!status?.isPremium && (
            <Link href="/#download" className="btn-primary inline-flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> {t('premium.page.get_in_app')}
            </Link>
          )}
          <p className="text-sm text-brand-text-muted">{t('premium.page.app_note')}</p>
          <Link href="/shop" className="btn-ghost inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> {t('premium.page.visit_shop')}
          </Link>
        </div>
      </div>
    </section>
  );
}
