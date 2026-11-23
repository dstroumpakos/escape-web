'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useAction, useMutation, useQueries } from 'convex/react';
import { getFunctionName } from 'convex/server';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import { cleanError } from './errors';
import { localeFor } from '@/lib/languages';

export interface CompanyUser {
  id: string;
  /** Server session (see convex/companySession.ts). Sent on every company call. */
  sessionToken: string;
  name: string;
  email: string;
  onboardingStatus: string;
  platformPlan?: string | null;
  billingPeriod?: string | null;
  stripePaymentStatus?: string | null;
  stripeCustomerId?: string | null;
  platformSubscribedAt?: number | null;
}

interface CompanyAuthContextType {
  company: CompanyUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCompany: (data: Partial<CompanyUser>) => void;
}

const CompanyAuthContext = createContext<CompanyAuthContextType>({
  company: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  refreshCompany: () => {},
});

// ── Session sharing across business./photos. subdomains ──
// localStorage is per-origin, so a login on business.unlocked.gr is invisible to
// photos.unlocked.gr. On the real domain the session is mirrored into a cookie
// scoped to .unlocked.gr so one login covers both portals.
const SESSION_KEY = 'unlocked_company';

function sharedCookieDomain(): string | null {
  if (typeof window === 'undefined') return null;
  const h = window.location.hostname;
  return h === 'unlocked.gr' || h.endsWith('.unlocked.gr') ? '.unlocked.gr' : null;
}

function readSharedSession(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|; )unlocked_company=([^;]*)/);
  if (!m || !m[1]) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

/**
 * The company logged in on this browser, read straight from storage, for pages
 * outside the portal (no CompanyAuthProvider there), e.g. a company opening
 * its own public profile. The server still checks the token.
 */
export function readStoredCompanySession(): { id: string; sessionToken: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY) || readSharedSession();
    const c = raw ? JSON.parse(raw) : null;
    return c?.id && c?.sessionToken ? { id: String(c.id), sessionToken: String(c.sessionToken) } : null;
  } catch {
    return null;
  }
}

function writeSharedSession(value: string | null) {
  const domain = sharedCookieDomain();
  if (!domain) return;
  const base = `${SESSION_KEY}=${value ? encodeURIComponent(value) : ''}; domain=${domain}; path=/; SameSite=Lax; Secure`;
  document.cookie = value ? `${base}; max-age=${60 * 60 * 24 * 30}` : `${base}; max-age=0`;
}

export function CompanyAuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useMutation(api.companies.loginCompany);
  const resumeMutation = useMutation(api.companies.resumeSession);
  const logoutMutation = useMutation(api.companies.logoutCompany);

  const clearSession = useCallback(() => {
    setCompany(null);
    localStorage.removeItem(SESSION_KEY);
    writeSharedSession(null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY) || readSharedSession();
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CompanyUser;
        if (!parsed.sessionToken) throw new Error('pre-session login'); // log in again
        setCompany(parsed);
        localStorage.setItem(SESSION_KEY, stored);
        // Check the token is still live (and slide its expiry) in the background.
        resumeMutation({ sessionToken: parsed.sessionToken })
          .then((r) => {
            if (!r) clearSession();
          })
          .catch(() => {
            /* offline etc.: keep the stored session, calls will re-check */
          });
      } catch {
        clearSession();
      }
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistCompany = useCallback((c: CompanyUser) => {
    setCompany(c);
    const json = JSON.stringify(c);
    localStorage.setItem(SESSION_KEY, json);
    writeSharedSession(json);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password, client: 'web' });
      // Wrong password / locked out come back as { error } (see companies.loginCompany).
      if ('error' in result) throw new Error(result.error);
      const companyUser: CompanyUser = {
        id: result._id as string,
        sessionToken: result.sessionToken,
        name: result.name,
        email: email.toLowerCase(),
        onboardingStatus: result.onboardingStatus || 'approved',
        platformPlan: (result as any).platformPlan || null,
        billingPeriod: (result as any).billingPeriod || null,
        stripePaymentStatus: (result as any).stripePaymentStatus || null,
        stripeCustomerId: (result as any).stripeCustomerId || null,
        platformSubscribedAt: (result as any).platformSubscribedAt || null,
      };
      persistCompany(companyUser);
    },
    [loginMutation, persistCompany]
  );

  const logout = useCallback(() => {
    const token = company?.sessionToken;
    if (token) logoutMutation({ sessionToken: token }).catch(() => {});
    clearSession();
  }, [company?.sessionToken, logoutMutation, clearSession]);

  const refreshCompany = useCallback(
    (data: Partial<CompanyUser>) => {
      if (company) {
        const updated = { ...company, ...data };
        persistCompany(updated);
      }
    },
    [company, persistCompany]
  );

  return (
    <CompanyAuthContext.Provider
      value={{
        company,
        isLoading,
        isAuthenticated: !!company,
        login,
        logout,
        refreshCompany,
      }}
    >
      {children}
    </CompanyAuthContext.Provider>
  );
}

export function useCompanyAuth() {
  return useContext(CompanyAuthContext);
}

// ── Session-aware Convex hooks ──
// Use these instead of useQuery/useMutation/useAction for company-scoped
// functions: they add the session token, and an expired session logs out
// (the shells then redirect to the login page) instead of crashing the page.

/** Must match SESSION_EXPIRED in convex/companySession.ts. */
const SESSION_EXPIRED = 'Your session has expired. Please log in again.';

export function isSessionExpired(err: unknown): boolean {
  return cleanError(err) === SESSION_EXPIRED;
}

type WithoutToken<F extends FunctionReference<any>> = Omit<FunctionArgs<F>, 'sessionToken'>;

export function useCompanyQuery<Q extends FunctionReference<'query'>>(
  query: Q,
  args: WithoutToken<Q> | 'skip'
): FunctionReturnType<Q> | undefined {
  const { company, logout } = useCompanyAuth();
  const token = company?.sessionToken;
  const argsKey = args === 'skip' ? 'skip' : JSON.stringify(args);
  // `api.x.y` is a new Proxy on every render; its name is stable. Keying the
  // memo on `query` itself re-subscribed every render (React error #301).
  const queryName = getFunctionName(query);
  const queries = useMemo(
    (): Record<string, { query: Q; args: FunctionArgs<Q> }> =>
      args === 'skip' || !token
        ? {}
        : { q: { query, args: { ...(args as object), sessionToken: token } as FunctionArgs<Q> } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryName, argsKey, token]
  );
  const result = useQueries(queries).q;
  const expired = result instanceof Error && isSessionExpired(result);
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  useEffect(() => {
    if (expired) logoutRef.current();
  }, [expired]);
  if (result instanceof Error) {
    if (expired) return undefined;
    throw result;
  }
  return result as FunctionReturnType<Q> | undefined;
}

function useWithToken<F extends FunctionReference<'mutation' | 'action'>>(
  call: (args: FunctionArgs<F>) => Promise<FunctionReturnType<F>>
) {
  const { company, logout } = useCompanyAuth();
  const token = company?.sessionToken;
  return useCallback(
    async (args: WithoutToken<F>): Promise<FunctionReturnType<F>> => {
      try {
        return await call({ ...(args as object), sessionToken: token } as FunctionArgs<F>);
      } catch (err) {
        if (isSessionExpired(err)) logout();
        throw err;
      }
    },
    [call, token, logout]
  );
}

export function useCompanyMutation<M extends FunctionReference<'mutation'>>(mutation: M) {
  return useWithToken<M>(useMutation(mutation) as any);
}

export function useCompanyAction<A extends FunctionReference<'action'>>(action: A) {
  return useWithToken<A>(useAction(action) as any);
}

// Returns a function that maps company paths for the current domain.
// On business.unlocked.gr: "/company/rooms" → "/rooms"
// On main domain: "/company/rooms" → "/company/rooms" (unchanged)
export function useCompanyPath() {
  const [isBusinessSubdomain, setIsBusinessSubdomain] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      setIsBusinessSubdomain(h === 'business.unlocked.gr' || h === 'business.localhost');
    }
  }, []);

  const p = useCallback(
    (path: string) => {
      if (isBusinessSubdomain && path.startsWith('/company')) {
        return path.replace(/^\/company/, '') || '/';
      }
      return path;
    },
    [isBusinessSubdomain]
  );

  return p;
}

/**
 * A link to the players' site. On business./photos. subdomains "/" is the
 * portal itself, so "back to UNLOCKED" must leave the subdomain, or it loops
 * back to the business login.
 */
export function mainSiteUrl(path = '/'): string {
  if (typeof window === 'undefined') return path;
  const { hostname, port, protocol } = window.location;
  if (hostname.endsWith('.localhost')) return `${protocol}//localhost${port ? ':' + port : ''}${path}`;
  if (hostname.endsWith('.unlocked.gr')) return `https://unlocked.gr${path}`;
  return path;
}

/** mainSiteUrl() after mount (the server can't know the host the same way). */
export function useMainSiteUrl(path = '/'): string {
  const [url, setUrl] = useState(path);
  useEffect(() => setUrl(mainSiteUrl(path)), [path]);
  return url;
}

/** URL of the Photos portal for the current environment. */
export function photosPortalUrl(): string {
  if (typeof window === 'undefined') return 'https://photos.unlocked.gr';
  const { hostname, port, protocol } = window.location;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return `${protocol}//photos.localhost${port ? ':' + port : ''}`;
  }
  return 'https://photos.unlocked.gr';
}

/** Locale for Intl date formatting in the chosen UI language. */
export function uiLocale(language: string): string {
  return localeFor(language);
}

/** Today's date as YYYY-MM-DD in the browser's local time zone (not UTC). */
export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
