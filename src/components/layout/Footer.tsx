'use client';

import Link from 'next/link';
import {
  Unlock,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    product: [
      { label: t('footer.browse_rooms'), href: '/#rooms' },
      { label: t('footer.how_it_works'), href: '/#how-it-works' },
      { label: t('footer.leaderboard'), href: '/leaderboard' },
      { label: t('footer.download_app'), href: '/#download' },
    ],
    company: [
      { label: t('footer.about_us'), href: '/about' },
      { label: t('footer.for_businesses'), href: '/about#for-businesses' },
      { label: t('footer.contact'), href: '/contact' },
      { label: t('footer.careers'), href: '/contact' },
    ],
    legal: [
      { label: t('footer.privacy'), href: '#' },
      { label: t('footer.terms'), href: '#' },
      { label: t('footer.cookies'), href: '#' },
    ],
  };

  return (
    <footer className="bg-brand-dark border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center">
                <Unlock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-wider">
                UN<span className="text-brand-red">LOCKED</span>
              </span>
            </Link>
            <p className="text-brand-text-secondary text-sm leading-relaxed mb-6">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-brand-surface flex items-center justify-center text-brand-text-muted hover:text-brand-red hover:bg-brand-red/10 transition-all"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-brand-text-muted mb-4">
              {t('footer.product')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-brand-text-secondary hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-brand-text-muted mb-4">
              {t('footer.company')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-brand-text-secondary hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-brand-text-muted mb-4">
              {t('footer.contact_heading')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-brand-text-secondary text-sm">
                <Mail className="w-4 h-4 text-brand-red" />
                hello@unlocked.app
              </li>
              <li className="flex items-center gap-2 text-brand-text-secondary text-sm">
                <Phone className="w-4 h-4 text-brand-red" />
                +30 210 1234567
              </li>
              <li className="flex items-center gap-2 text-brand-text-secondary text-sm">
                <MapPin className="w-4 h-4 text-brand-red" />
                Athens, Greece
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-brand-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-brand-text-muted text-sm">
            © {new Date().getFullYear()} UNLOCKED. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-brand-text-muted hover:text-brand-text-secondary text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
