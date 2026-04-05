import i18n from "@/i18n/i18next";

export const getActiveLocale = () => {
  const raw = i18n.language || "en";
  const short = raw.toLowerCase().split("-")[0];
  switch (short) {
    case "tr":
      return "tr-TR";
    case "de":
      return "de-DE";
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    default:
      return "en-US";
  }
};

export const formatDate = (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getActiveLocale(), options ?? { dateStyle: "medium" }).format(date);
};

export const formatMonthShortYear = (value: Date | string | number) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getActiveLocale(), { month: "short", year: "2-digit" }).format(date);
};

