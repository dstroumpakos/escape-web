'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Cookie, X, Shield } from 'lucide-react';
import Link from 'next/link';

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already responded
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay so it doesn't flash immediately on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-2xl mx-auto bg-brand-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-brand-red" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm md:text-base">
              {t('cookies.title')}
            </h3>
            <p className="text-brand-text-secondary text-xs md:text-sm mt-1 leading-relaxed">
              {t('cookies.description')}{' '}
              <Link
                href="/cookies"
                className="text-brand-red hover:text-brand-red/80 underline underline-offset-2 transition-colors"
              >
                {t('cookies.learn_more')}
              </Link>
            </p>
          </div>
          <button
            onClick={decline}
            className="text-brand-text-muted hover:text-white transition-colors flex-shrink-0 p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={accept}
            className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white font-medium text-sm py-2.5 px-5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-red/20"
          >
            {t('cookies.accept')}
          </button>
          <button
            onClick={decline}
            className="flex-1 bg-white/5 hover:bg-white/10 text-brand-text-secondary hover:text-white border border-white/10 font-medium text-sm py-2.5 px-5 rounded-xl transition-all duration-200"
          >
            {t('cookies.decline')}
          </button>
        </div>

        {/* Privacy note */}
        <div className="flex items-center gap-1.5 mt-3 justify-center">
          <Shield className="w-3 h-3 text-brand-text-muted" />
          <span className="text-[10px] md:text-xs text-brand-text-muted">
            {t('cookies.privacy_note')}
          </span>
        </div>
      </div>
    </div>
  );
}
