import { getActiveLocale } from "@/i18n/date";

export const formatCurrency = (
  value: number,
  currency: string,
  options?: Intl.NumberFormatOptions
) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  try {
    return new Intl.NumberFormat(getActiveLocale(), {
      style: "currency",
      currency,
      ...options,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

