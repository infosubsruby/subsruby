import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettings {
  emailAlerts: boolean;
  monthlyReport: boolean;
  billReminders: boolean;
}

interface SettingsContextType {
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  notifications: NotificationSettings;
  setNotificationSetting: (key: keyof NotificationSettings, value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = "subsruby-settings";

interface StoredSettings {
  defaultCurrency: string;
  theme: "light" | "dark" | "system";
  notifications: NotificationSettings;
}

const defaultSettings: StoredSettings = {
  defaultCurrency: "USD",
  theme: "dark",
  notifications: {
    emailAlerts: true,
    monthlyReport: false,
    billReminders: true,
  },
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<StoredSettings>(() => {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [loadedProfileCurrencyFor, setLoadedProfileCurrencyFor] = useState<string | null>(null);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
    } else {
      root.classList.toggle("dark", settings.theme === "dark");
    }
  }, [settings.theme]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setLoadedProfileCurrencyFor(null);
    });
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const nextUserId = userId;
    if (!nextUserId) return;
    if (loadedProfileCurrencyFor === nextUserId) return;

    const loadProfileCurrency = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("default_currency")
        .eq("id", nextUserId)
        .maybeSingle();

      if (error) {
        console.error("Supabase Çekme Hatası:", error);
        setLoadedProfileCurrencyFor(nextUserId);
        return;
      }

      const valueRaw = data && typeof data === "object" ? (data as { default_currency?: unknown }).default_currency : null;
      const value = typeof valueRaw === "string" ? valueRaw : null;
      if (value) {
        setSettings((prev) => ({ ...prev, defaultCurrency: value }));
      }
      setLoadedProfileCurrencyFor(nextUserId);
    };

    void loadProfileCurrency();
  }, [userId, loadedProfileCurrencyFor]);

  const persistDefaultCurrency = useCallback(
    async (currency: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, default_currency: currency }, { onConflict: "id" });
      if (error) {
        console.error("Supabase Güncelleme Hatası:", error);
      }
    },
    [userId]
  );

  const setDefaultCurrency = (currency: string) => {
    setSettings((prev) => ({ ...prev, defaultCurrency: currency }));
    void persistDefaultCurrency(currency);
  };

  const setTheme = (theme: "light" | "dark" | "system") => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const setNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        defaultCurrency: settings.defaultCurrency,
        setDefaultCurrency,
        theme: settings.theme,
        setTheme,
        notifications: settings.notifications,
        setNotificationSetting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
