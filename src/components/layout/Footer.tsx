'use client';

import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';
import { BloodDrips } from '@/components/horror/BloodDrips';
import { Logo } from './Navbar';

// lucide-react 1.x dropped brand icons, so these keep the original line-style glyphs
function BrandIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const Instagram = ({ className }: { className?: string }) => (
  <BrandIcon className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </BrandIcon>
);

const Facebook = ({ className }: { className?: string }) => (
  <BrandIcon className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </BrandIcon>
);

const Twitter = ({ className }: { className?: string }) => (
  <BrandIcon className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </BrandIcon>
);

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    product: [
      { label: t('footer.browse_rooms'), href: '/#rooms' },
      { label: t('footer.how_it_works'), href: '/#how-it-works' },
      { label: t('footer.leaderboard'), href: '/leaderboard' },
      { label: t('nav.shop'), href: '/shop' },
      { label: t('footer.premium'), href: '/premium' },
      { label: t('footer.download_app'), href: '/#download' },
    ],
    company: [
      { label: t('footer.about_us'), href: '/about' },
      { label: t('footer.web_services'), href: '/services/website' },
      { label: t('footer.contact'), href: '/contact' },
      { label: t('footer.careers'), href: '/contact' },
    ],
    legal: [
      { label: t('footer.privacy'), href: '/privacy' },
      { label: t('footer.terms'), href: '/terms' },
      { label: t('footer.cookies'), href: '/cookies' },
    ],
  };

  return (
    <footer className="relative bg-black border-t border-brand-red/30 overflow-hidden">
      <BloodDrips count={26} seed={19} maxLength={50} speed={6} />
      {/* Giant name sinking into the fog */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-6 md:-bottom-10 text-center font-blood text-[18vw] leading-none text-brand-red/[0.07] select-none whitespace-nowrap"
        style={{ maskImage: 'linear-gradient(180deg, #000 20%, transparent 95%)' }}
      >
        UNLOCKED
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <StaggerContainer stagger={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <StaggerItem animation="fadeUp" className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4" aria-label="UNLOCKED">
              <Logo />
            </Link>
            <p className="text-brand-text-secondary text-sm leading-relaxed mb-3">
              {t('footer.description')}
            </p>
            <p className="font-type text-xs tracking-[0.2em] text-brand-red-light/80 mb-6 animate-flicker">
              {t('horror.footer_tag')}
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-md border border-brand-border bg-black flex items-center justify-center text-brand-text-muted hover:text-brand-red-light hover:border-brand-red hover:shadow-[0_0_16px_rgba(var(--glow),0.5)] hover:animate-shake transition-all"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </StaggerItem>

          {/* Product */}
          <StaggerItem animation="fadeUp">
            <h4 className="font-type text-xs uppercase tracking-[0.25em] text-brand-red-light/70 mb-4">
              {t('footer.product')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-brand-text-secondary hover:text-brand-red-light hover:pl-1 text-sm transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Company */}
          <StaggerItem animation="fadeUp">
            <h4 className="font-type text-xs uppercase tracking-[0.25em] text-brand-red-light/70 mb-4">
              {t('footer.company')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-brand-text-secondary hover:text-brand-red-light hover:pl-1 text-sm transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Contact */}
          <StaggerItem animation="fadeUp">
            <h4 className="font-type text-xs uppercase tracking-[0.25em] text-brand-red-light/70 mb-4">
              {t('footer.contact_heading')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-brand-text-secondary text-sm">
                <Mail className="w-4 h-4 text-brand-red-light" />
                hello@unlocked.gr
              </li>
              <li className="flex items-center gap-2 text-brand-text-secondary text-sm">
                <Phone className="w-4 h-4 text-brand-red-light" />
                +30 698 379 5767
              </li>
              <li className="flex items-center gap-2 text-brand-text-secondary text-sm">
                <MapPin className="w-4 h-4 text-brand-red-light" />
                Athens, Greece
              </li>
            </ul>
          </StaggerItem>
        </StaggerContainer>

        {/* Bottom */}
        <AnimateIn animation="fadeIn" delay={0.4}>
        <div className="mt-12 pt-8 border-t border-brand-red/20 flex flex-col md:flex-row items-center justify-between gap-4">
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
        </AnimateIn>
      </div>
    </footer>
  );
}
