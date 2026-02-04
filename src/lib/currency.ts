// Currency conversion utilities with hardcoded exchange rates

export const EXCHANGE_RATES: Record<string, number> = {
  // All rates relative to USD as base (1 USD = X)
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  TRY: 34,
  MXN: 17.5,
  CAD: 1.36,
  AUD: 1.54,
  JPY: 149,
  INR: 83,
  BRL: 4.97,
};

export type CurrencyCode = keyof typeof EXCHANGE_RATES;

/**
 * Convert an amount from one currency to another using dynamic rates
 * Assumes rates are all relative to the SAME base (e.g. EUR)
 * Formula: (amount / rateFrom) * rateTo
 */
export const convertWithDynamicRates = (
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number => {
  if (from === to) return amount;
  
  // Treat 'EUR' as 1 if not present in rates (since it's the base)
  const fromRate = from === 'EUR' ? 1 : rates[from];
  const toRate = to === 'EUR' ? 1 : rates[to];
  
  // If rates are missing, fallback to static rates or 1:1 if really unknown
  if (!fromRate || !toRate) {
    // Try static rates if dynamic ones fail
    if (EXCHANGE_RATES[from] && EXCHANGE_RATES[to]) {
      return convertCurrency(amount, from, to);
    }
    return amount;
  }
  
  // Convert from source currency to Base (EUR), then to target currency
  return (amount / fromRate) * toRate;
};

/**
 * Convert an amount from one currency to another
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
};

/**
 * Convert an amount to USD
 */
export const toUSD = (amount: number, fromCurrency: string): number => {
  return convertCurrency(amount, fromCurrency, "USD");
};

/**
 * Get the currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    TRY: "₺",
    MXN: "$",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    INR: "₹",
    BRL: "R$",
  };
  return symbols[currency] || "$";
};

/**
 * Format currency amount with symbol
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  // Japanese Yen doesn't use decimals
  if (currency === "JPY") {
    return `${symbol}${Math.round(amount)}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
};
