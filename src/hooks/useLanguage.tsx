import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Language, Translations, languages } from "@/i18n/translations";
import i18n from "@/i18n/i18next";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "subsruby-language";
const supportedLanguages: Language[] = ["en", "tr", "de", "es", "fr"];

const normalizeLanguage = (value: string): Language => {
  const lower = value.toLowerCase();
  const short = lower.split("-")[0];
  return supportedLanguages.includes(short as Language) ? (short as Language) : "en";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
    return normalizeLanguage(navigator.language || "en");
  });
  const [userId, setUserId] = useState<string | null>(null);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    void i18n.changeLanguage(lang);
    if (userId) {
      void supabase
        .from("profiles")
        .upsert({ id: userId, language: lang }, { onConflict: "id" })
        .then(({ error }) => {
          if (error) console.error("Supabase Güncelleme Hatası:", error);
        });
    }
  };

  // Get current translations
  const t = translations[language];

  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    const applyProfileLanguage = async (nextUserId: string) => {
      const { data, error } = await supabase.from("profiles").select("language").eq("id", nextUserId).maybeSingle();
      if (error) {
        console.error("Supabase Çekme Hatası:", error);
        return;
      }
      const raw = data && typeof data === "object" ? (data as { language?: unknown }).language : null;
      const profileLang = typeof raw === "string" ? normalizeLanguage(raw) : null;
      if (profileLang) {
        setLanguageState(profileLang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, profileLang);
        void i18n.changeLanguage(profileLang);
        return;
      }
      await supabase.from("profiles").upsert({ id: nextUserId, language }, { onConflict: "id" });
    };

    void supabase.auth.getSession().then(({ data }) => {
      const nextUserId = data.session?.user?.id ?? null;
      setUserId(nextUserId);
      if (nextUserId) void applyProfileLanguage(nextUserId);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      setUserId(nextUserId);
      if (nextUserId) void applyProfileLanguage(nextUserId);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
