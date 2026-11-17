'use client';

/**
 * "Continue with Google" and "Sign in with Apple" for players on the website.
 *
 * Google: Google Identity Services renders its own button and hands us an ID
 * token. Apple: Apple's JS opens a popup and hands us an id_token. Both
 * tokens go to Convex (users.loginWithGoogle / users.loginWithApple), which
 * checks the signature before signing anyone in.
 *
 * Each button shows only when its client id is set:
 *   NEXT_PUBLIC_GOOGLE_CLIENT_ID     Google OAuth client id (Web application)
 *   NEXT_PUBLIC_APPLE_SERVICES_ID    Apple Services ID (Sign in with Apple for the web)
 * The same ids must be in GOOGLE_CLIENT_IDS / APPLE_CLIENT_IDS on Convex.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const APPLE_SERVICES_ID = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID || '';

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const APPLE_SCRIPT =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

const BUTTON_MAX_PX = 320;

const scriptLoads: Record<string, Promise<void>> = {};
function loadScript(src: string): Promise<void> {
  if (!scriptLoads[src]) {
    scriptLoads[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        delete scriptLoads[src];
        reject(new Error('script failed: ' + src));
      };
      document.head.appendChild(s);
    });
  }
  return scriptLoads[src];
}

function errorKey(err: any): string {
  const code = typeof err?.data === 'string' ? err.data : '';
  return code === 'GOOGLE_EMAIL_UNVERIFIED' ? 'auth.google_email_unverified' : 'auth.social_error';
}

export function SocialSignIn({ mode }: { mode: 'signin' | 'signup' }) {
  const { t, language } = useTranslation();
  const { loginWithGoogle, loginWithApple } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);

  // Keep the latest callbacks for the Google button, which is set up once.
  const handlers = useRef({ loginWithGoogle, t });
  handlers.current = { loginWithGoogle, t };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadScript(GOOGLE_SCRIPT)
      .then(() => {
        const el = googleRef.current;
        if (cancelled || !el || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: async (resp: { credential?: string }) => {
            if (!resp.credential) return;
            setError('');
            setBusy(true);
            try {
              await handlers.current.loginWithGoogle(resp.credential);
              // The page redirects once signed in.
            } catch (err) {
              setError(handlers.current.t(errorKey(err)));
            } finally {
              setBusy(false);
            }
          },
        });
        el.innerHTML = '';
        window.google.accounts.id.renderButton(el, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          logo_alignment: 'center',
          // Same width as the Apple button (max 320px); Google allows 200–400px.
          width: Math.max(200, Math.min(BUTTON_MAX_PX, Math.floor(el.getBoundingClientRect().width) || BUTTON_MAX_PX)),
          locale: language,
        });
      })
      .catch(() => {
        // Blocked by an extension or offline: the email form still works.
      });
    return () => {
      cancelled = true;
    };
  }, [mode, language]);

  // Load Apple's script up front: browsers block the popup if the click has
  // to wait for a download first.
  useEffect(() => {
    if (!APPLE_SERVICES_ID) return;
    loadScript(APPLE_SCRIPT)
      .then(() => {
        window.AppleID?.auth.init({
          clientId: APPLE_SERVICES_ID,
          scope: 'name email',
          // Must match a Return URL on the Services ID in the Apple Developer portal.
          redirectURI: `${window.location.origin}/login`,
          usePopup: true,
        });
      })
      .catch(() => {});
  }, []);

  const handleApple = async () => {
    setError('');
    try {
      if (!window.AppleID?.auth) throw new Error('apple script not loaded');
      const res = await window.AppleID.auth.signIn();
      const idToken: string | undefined = res?.authorization?.id_token;
      if (!idToken) throw new Error('no token');
      // Apple sends the name only the first time someone signs in.
      const n = res?.user?.name;
      const fullName = [n?.firstName, n?.lastName].filter(Boolean).join(' ') || undefined;
      setBusy(true);
      await loginWithApple(idToken, fullName);
    } catch (err: any) {
      // Closing the popup is not an error.
      if (err?.error === 'popup_closed_by_user' || err?.error === 'user_cancelled_authorize') return;
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  if (!GOOGLE_CLIENT_ID && !APPLE_SERVICES_ID) return null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className={`space-y-3 ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
        {APPLE_SERVICES_ID && (
          <button
            type="button"
            onClick={handleApple}
            className="w-full max-w-[320px] mx-auto h-10 rounded-full bg-white text-black text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          >
            <svg viewBox="0 0 814 1000" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
            </svg>
            {t(mode === 'signup' ? 'auth.signup_apple' : 'auth.signin_apple')}
          </button>
        )}

        {GOOGLE_CLIENT_ID && <div ref={googleRef} className="w-full max-w-[320px] mx-auto flex justify-center min-h-10" />}
      </div>

      {mode === 'signup' && (
        <p className="text-xs text-brand-text-muted text-center">
          {t('auth.social_agree')}{' '}
          <Link href="/terms" target="_blank" className="text-brand-red-light hover:underline">
            {t('auth.terms_of_service')}
          </Link>{' '}
          {t('auth.and')}{' '}
          <Link href="/privacy" target="_blank" className="text-brand-red-light hover:underline">
            {t('auth.privacy_policy')}
          </Link>
          .
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-xs uppercase tracking-wider text-brand-text-muted">{t('auth.or')}</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>
    </div>
  );
}
