/**
 * Authentication context for UNLOCKED web app.
 * Uses Convex mutations for register/login (same backend as the mobile app).
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useMutation, useQuery, useAction, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTranslation } from './i18n';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  sessionToken: string;
  avatar: string;
  title: string;
  played: number;
  escaped: number;
  awards: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Google Identity Services ID token ("credential"). */
  loginWithGoogle: (idToken: string) => Promise<void>;
  /** Apple JS id_token; Apple only sends the name on the very first sign-in. */
  loginWithApple: (idToken: string, fullName?: string) => Promise<void>;
  /** Step 1 of sign-up: checks the form and emails a 6-digit code (no account yet). */
  signup: (name: string, email: string, password: string) => Promise<void>;
  /** Step 2: the code from the email. Creates the account and logs in. Returns an error code or null. */
  confirmSignup: (email: string, code: string) => Promise<string | null>;
  resendSignupCode: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  loginWithApple: async () => {},
  signup: async () => {},
  confirmSignup: async () => null,
  resendSignupCode: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startRegister = useMutation(api.users.startRegister);
  const confirmRegister = useMutation(api.users.confirmRegister);
  const resendCode = useMutation(api.signupCodes.resend);
  const loginMutation = useAction(api.users.login);
  const googleAction = useAction(api.users.loginWithGoogle);
  const appleAction = useAction(api.users.loginWithApple);
  const logoutMutation = useMutation(api.userSession.logout);
  const { language } = useTranslation();

  // Hydrate session from localStorage on mount.
  // If the Convex backend URL changed (e.g. dev → prod), clear the stale session.
  useEffect(() => {
    const currentUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';
    const savedUrl = localStorage.getItem('unlocked_convex_url');
    if (savedUrl && savedUrl !== currentUrl) {
      // Backend changed — old session is invalid
      localStorage.removeItem('unlocked_user');
      localStorage.removeItem('unlocked_company');
      localStorage.setItem('unlocked_convex_url', currentUrl);
      setIsLoading(false);
      return;
    }
    localStorage.setItem('unlocked_convex_url', currentUrl);

    const stored = localStorage.getItem('unlocked_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Saved before server sessions existed: ask for a fresh login.
        if (parsed?.sessionToken) setUser(parsed);
        else localStorage.removeItem('unlocked_user');
      } catch {
        localStorage.removeItem('unlocked_user');
      }
    }
    setIsLoading(false);
  }, []);

  const persistUser = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem('unlocked_user', JSON.stringify(u));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { userId, sessionToken } = await loginMutation({ email, password, client: 'web' });
      const authUser: AuthUser = {
        id: userId as string,
        name: '',
        email: email.toLowerCase(),
        sessionToken,
        avatar: '',
        title: '',
        played: 0,
        escaped: 0,
        awards: 0,
      };
      persistUser(authUser);
    },
    [loginMutation, persistUser]
  );

  // Social sign-in: the server takes the email from the verified token, so
  // read the profile back for the name and email the navbar shows.
  const convex = useConvex();
  const persistSocial = useCallback(
    async (r: { userId: string; sessionToken: string }) => {
      let profile: { name?: string; email?: string } | null = null;
      try {
        profile = await convex.query(api.users.getById, { sessionToken: r.sessionToken });
      } catch {
        // Signed in anyway; the name just shows up later.
      }
      persistUser({
        id: r.userId,
        name: profile?.name ?? '',
        email: profile?.email ?? '',
        sessionToken: r.sessionToken,
        avatar: '',
        title: '',
        played: 0,
        escaped: 0,
        awards: 0,
      });
    },
    [convex, persistUser]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      await persistSocial(await googleAction({ idToken, lang: language, client: 'web' }));
    },
    [googleAction, persistSocial, language]
  );

  const loginWithApple = useCallback(
    async (idToken: string, fullName?: string) => {
      await persistSocial(await appleAction({ identityToken: idToken, fullName, lang: language, client: 'web' }));
    },
    [appleAction, persistSocial, language]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      await startRegister({ name, email, password, lang: language });
    },
    [startRegister, language]
  );

  const confirmSignup = useCallback(
    async (email: string, code: string): Promise<string | null> => {
      const r = await confirmRegister({ email, code, client: 'web' });
      if ('error' in r) return r.error;
      persistUser({
        id: r.userId as string,
        name: '',
        email: email.trim().toLowerCase(),
        sessionToken: r.sessionToken,
        avatar: '',
        title: 'Escape Rookie',
        played: 0,
        escaped: 0,
        awards: 0,
      });
      return null;
    },
    [confirmRegister, persistUser]
  );

  const resendSignupCode = useCallback(
    async (email: string) => {
      await resendCode({ kind: 'player', email });
    },
    [resendCode]
  );

  const logout = useCallback(() => {
    const token = user?.sessionToken;
    if (token) logoutMutation({ sessionToken: token }).catch(() => {});
    setUser(null);
    localStorage.removeItem('unlocked_user');
  }, [user, logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithApple,
        signup,
        confirmSignup,
        resendSignupCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
