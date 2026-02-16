import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axiosClient.js';
import { useAuth } from './AuthContext.jsx';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    if (!isAuthenticated) {
      setSettings(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading, isAuthenticated]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
        loading,
        error,
        refresh: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}

