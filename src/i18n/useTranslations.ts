import { useTranslation } from "react-i18next";

export const useTranslations = (namespace?: string) => {
  const { t } = useTranslation();
  return (key: string) => (namespace ? t(`${namespace}.${key}`) : t(key));
};

