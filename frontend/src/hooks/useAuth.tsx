import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '../services/api';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../services/auth';
import type { AuthUser } from '../types/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable';
type AuthContextValue = {
  status: AuthStatus; user: AuthUser | null; error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>; refresh: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setStatus('loading'); setError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser); setStatus('authenticated');
    } catch (requestError) {
      setUser(null);
      if (requestError instanceof ApiError && requestError.status === 401) setStatus('unauthenticated');
      else { setStatus('unavailable'); setError(requestError instanceof Error ? requestError.message : 'Authentication service is unavailable.'); }
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    setUser(response.user); setStatus('authenticated'); setError(null);
    return response.user;
  }, []);
  const logout = useCallback(async () => {
    try { await logoutRequest(); setUser(null); setStatus('unauthenticated'); setError(null); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to sign out right now.'); throw requestError; }
  }, []);
  const value = useMemo(() => ({ status, user, error, login, logout, refresh }), [status, user, error, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
