import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { configureAuthClient } from '../api/axiosClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const forceLogout = useCallback(() => {
    setUser(null);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    configureAuthClient({ onUnauthorized: forceLogout });
  }, [forceLogout]);

  const refreshSetupStatus = useCallback(async () => {
    const status = await api.get('/auth/setup-status');
    setSetupRequired(Boolean(status.setupRequired));
    return Boolean(status.setupRequired);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const pendingSetup = await refreshSetupStatus();
      if (pendingSetup) {
        setUser(null);
        return;
      }
      const refreshed = await api.post('/auth/refresh', {});
      setUser(refreshed.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshSetupStatus]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    const payload = await api.post('/auth/login', { email, password });
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
    const payload = await api.post('/auth/change-password', { oldPassword, newPassword });
    setUser(payload.user);
    return payload.user;
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await api.get('/auth/me');
    setUser(me);
    return me;
  }, []);

  const completeSetup = useCallback(
    async ({ setupToken, email, name, password }) => {
      const result = await api.post('/auth/setup', { setupToken, email, name, password });
      await refreshSetupStatus();
      return result;
    },
    [refreshSetupStatus]
  );

  const resetPassword = useCallback(async ({ email, code, newPassword }) => {
    return api.post('/auth/reset-password', { email, code, newPassword });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setupRequired,
      isAuthenticated: Boolean(user),
      login,
      logout,
      changePassword,
      refreshMe,
      bootstrap,
      completeSetup,
      refreshSetupStatus,
      resetPassword,
    }),
    [
      user,
      loading,
      setupRequired,
      login,
      logout,
      changePassword,
      refreshMe,
      bootstrap,
      completeSetup,
      refreshSetupStatus,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
