import { useTranslation } from "react-i18next";

export const useTranslations = (namespace?: string) => {
  const { t } = useTranslation();
  return (key: string, options?: Record<string, unknown>) =>
    namespace ? t(`${namespace}.${key}`, options) : t(key, options);
};
