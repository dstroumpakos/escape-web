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

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  onboardingStatus: string;
  platformPlan?: string | null;
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

export function CompanyAuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useMutation(api.companies.loginCompany);

  useEffect(() => {
    const stored = localStorage.getItem('unlocked_company');
    if (stored) {
      try {
        setCompany(JSON.parse(stored));
      } catch {
        localStorage.removeItem('unlocked_company');
      }
    }
    setIsLoading(false);
  }, []);

  const persistCompany = useCallback((c: CompanyUser) => {
    setCompany(c);
    localStorage.setItem('unlocked_company', JSON.stringify(c));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password });
      const companyUser: CompanyUser = {
        id: result._id as string,
        name: result.name,
        email: email.toLowerCase(),
        onboardingStatus: result.onboardingStatus || 'approved',
        platformPlan: (result as any).platformPlan || null,
      };
      persistCompany(companyUser);
    },
    [loginMutation, persistCompany]
  );

  const logout = useCallback(() => {
    setCompany(null);
    localStorage.removeItem('unlocked_company');
  }, []);

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
