import { useTranslation } from "react-i18next";

export const useTranslations = (namespace?: string) => {
  const { t } = useTranslation();
  return (key: string, options?: Record<string, unknown>) => {
    const result = namespace ? t(`${namespace}.${key}`, options) : t(key, options);
    if (!options) return result;
    return Object.entries(options).reduce((acc, [k, v]) => {
      const value = String(v);
      return acc.replaceAll(`{${k}}`, value).replaceAll(`%{${k}}`, value);
    }, String(result));
  };
};
