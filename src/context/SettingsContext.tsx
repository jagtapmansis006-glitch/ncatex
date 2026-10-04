import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface WebsiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  venue: string;
  dates: string;
}

export const DEFAULT_SETTINGS: WebsiteSettings = {
  heroTitle: "NCATEX",
  heroSubtitle: "National Conference on Advanced Trends in Electronics and Telecommunication Engineering",
  venue: "NCATEX Campus / Hybrid Virtual",
  dates: "April 10–11",
};

const SETTINGS_STORAGE_KEY = "ncatex_website_settings";

interface SettingsContextValue {
  settings: WebsiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<WebsiteSettings>) => Promise<WebsiteSettings>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  updateSettings: async () => DEFAULT_SETTINGS,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await axios.get<WebsiteSettings>("/api/settings");
      if (res.data) {
        setSettings(res.data);
        if (typeof window !== "undefined") {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(res.data));
        }
      }
    } catch {
      // Graceful fallback if offline or during static compilation
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<WebsiteSettings>) => {
      setLoading(true);
      try {
        const res = await axios.put<WebsiteSettings>("/api/settings", newSettings);
        const updated = res.data || { ...settings, ...newSettings };
        setSettings(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      } catch {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [settings],
  );

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
