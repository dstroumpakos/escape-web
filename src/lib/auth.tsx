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
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
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
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const registerMutation = useMutation(api.users.register);
  const loginMutation = useMutation(api.users.login);

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
        setUser(JSON.parse(stored));
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
      const userId = await loginMutation({ email, password });
      const authUser: AuthUser = {
        id: userId as string,
        name: '',
        email: email.toLowerCase(),
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

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const userId = await registerMutation({ name, email, password });
      const authUser: AuthUser = {
        id: userId as string,
        name,
        email: email.toLowerCase(),
        avatar: '',
        title: 'Escape Rookie',
        played: 0,
        escaped: 0,
        awards: 0,
      };
      persistUser(authUser);
    },
    [registerMutation, persistUser]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('unlocked_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
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
