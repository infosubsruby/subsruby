import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";
import es from "../../messages/es.json";
import de from "../../messages/de.json";
import fr from "../../messages/fr.json";

export const supportedLanguages = ["en", "tr", "es", "de", "fr"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const normalizeLanguage = (value: string): SupportedLanguage => {
  const lower = value.toLowerCase();
  const short = lower.split("-")[0];
  return (supportedLanguages.includes(short as SupportedLanguage) ? (short as SupportedLanguage) : "en") as SupportedLanguage;
};

const stored = localStorage.getItem("subsruby-language");
const initialLanguage = stored ? normalizeLanguage(stored) : normalizeLanguage(navigator.language || "en");

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
    es: { translation: es },
    de: { translation: de },
    fr: { translation: fr },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    prefix: "{",
    suffix: "}",
    escapeValue: false,
  },
});

export default i18n;
