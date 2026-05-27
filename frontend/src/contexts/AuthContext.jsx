import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi, tokenStorage } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenStorage.get());
  const [isLoading, setIsLoading] = useState(Boolean(tokenStorage.get()));

  useEffect(() => {
    let cancelled = false;
    const stored = tokenStorage.get();
    if (!stored) {
      setIsLoading(false);
      return undefined;
    }
    setIsLoading(true);
    userApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        if (!cancelled) {
          // Only clear the token on auth errors (401/403), not transient network errors
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            tokenStorage.clear();
            setToken(null);
            setUser(null);
          }
          // On network failure (no response), keep the token so the user stays logged in
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login({ email, password });
    const nextToken = result?.token || result?.accessToken || result?.data?.token;
    if (!nextToken) throw new Error('Phản hồi đăng nhập không hợp lệ.');
    tokenStorage.set(nextToken);
    setToken(nextToken);
    const me = await userApi.getMe();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* swallow — clear local state regardless */
    }
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      updateUser,
    }),
    [user, token, isLoading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>');
  return ctx;
}

export default AuthContext;
