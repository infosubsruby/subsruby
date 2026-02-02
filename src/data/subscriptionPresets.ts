import { Play, Music, Film, Palette, ShoppingBag, Gamepad2, Cloud, BookOpen, Tv, CreditCard, PenTool, Shield, type LucideIcon } from "lucide-react";

// Plan types for tiered pricing
export type PlanType = "basic" | "standard" | "premium" | "family" | "individual" | "pro" | "free";

// Regional prices for each plan
export interface PlanPrices {
  USD: number;
  EUR: number;
  GBP: number;
  TRY: number;
  MXN: number;
  CAD: number;
  AUD: number;
  JPY: number;
  INR: number;
  BRL: number;
}

// A service can have multiple plans with different prices
export interface ServicePlans {
  [planName: string]: PlanPrices;
}

export interface SubscriptionPreset {
  name: string;
  slug: string;
  url: string; // Management URL
  color: string;
  icon: LucideIcon;
  category: string;
  plans: ServicePlans;
  defaultPlan: string;
}

export const subscriptionPresets: SubscriptionPreset[] = [
  {
    name: "Netflix",
    slug: "netflix",
    url: "https://www.netflix.com/youraccount",
    color: "#E50914",
    icon: Play,
    category: "Entertainment",
    defaultPlan: "standard",
    plans: {
      basic: { USD: 6.99, EUR: 5.99, GBP: 4.99, TRY: 99.99, MXN: 99, CAD: 9.99, AUD: 10.99, JPY: 990, INR: 199, BRL: 25.90 },
      standard: { USD: 15.49, EUR: 13.49, GBP: 10.99, TRY: 199.99, MXN: 219, CAD: 20.99, AUD: 22.99, JPY: 1990, INR: 649, BRL: 59.90 },
      premium: { USD: 22.99, EUR: 19.99, GBP: 17.99, TRY: 299.99, MXN: 299, CAD: 30.99, AUD: 33.99, JPY: 2990, INR: 899, BRL: 79.90 },
    },
  },
  {
    name: "Spotify",
    slug: "spotify",
    url: "https://www.spotify.com/account",
    color: "#1DB954",
    icon: Music,
    category: "Entertainment",
    defaultPlan: "individual",
    plans: {
      free: { USD: 0, EUR: 0, GBP: 0, TRY: 0, MXN: 0, CAD: 0, AUD: 0, JPY: 0, INR: 0, BRL: 0 },
      individual: { USD: 11.99, EUR: 10.99, GBP: 10.99, TRY: 59.99, MXN: 115, CAD: 11.99, AUD: 13.99, JPY: 980, INR: 119, BRL: 21.90 },
      duo: { USD: 16.99, EUR: 14.99, GBP: 14.99, TRY: 79.99, MXN: 149, CAD: 16.99, AUD: 19.99, JPY: 1280, INR: 179, BRL: 34.90 },
      family: { USD: 19.99, EUR: 17.99, GBP: 17.99, TRY: 99.99, MXN: 179, CAD: 19.99, AUD: 24.99, JPY: 1580, INR: 239, BRL: 44.90 },
    },
  },
  {
    name: "YouTube Premium",
    slug: "youtube-premium",
    url: "https://www.youtube.com/paid_memberships",
    color: "#FF0000",
    icon: Play,
    category: "Entertainment",
    defaultPlan: "individual",
    plans: {
      individual: { USD: 13.99, EUR: 12.99, GBP: 12.99, TRY: 79.99, MXN: 129, CAD: 13.99, AUD: 16.99, JPY: 1280, INR: 149, BRL: 34.90 },
      family: { USD: 22.99, EUR: 20.99, GBP: 20.99, TRY: 139.99, MXN: 199, CAD: 22.99, AUD: 27.99, JPY: 2280, INR: 269, BRL: 54.90 },
      student: { USD: 7.99, EUR: 6.99, GBP: 6.99, TRY: 49.99, MXN: 69, CAD: 7.99, AUD: 9.99, JPY: 780, INR: 79, BRL: 19.90 },
    },
  },
  {
    name: "Disney+",
    slug: "disney-plus",
    url: "https://www.disneyplus.com/account",
    color: "#113CCF",
    icon: Film,
    category: "Entertainment",
    defaultPlan: "standard",
    plans: {
      basic: { USD: 7.99, EUR: 5.99, GBP: 4.99, TRY: 64.99, MXN: 99, CAD: 7.99, AUD: 11.99, JPY: 990, INR: 299, BRL: 27.90 },
      standard: { USD: 13.99, EUR: 11.99, GBP: 10.99, TRY: 134.99, MXN: 179, CAD: 13.99, AUD: 17.99, JPY: 1320, INR: 499, BRL: 43.90 },
      premium: { USD: 17.99, EUR: 14.99, GBP: 13.99, TRY: 179.99, MXN: 229, CAD: 17.99, AUD: 22.99, JPY: 1790, INR: 699, BRL: 55.90 },
    },
  },
  {
    name: "Amazon Prime",
    slug: "amazon-prime",
    url: "https://www.amazon.com/gp/primecentral",
    color: "#FF9900",
    icon: ShoppingBag,
    category: "Shopping",
    defaultPlan: "monthly",
    plans: {
      monthly: { USD: 14.99, EUR: 8.99, GBP: 8.99, TRY: 39.99, MXN: 99, CAD: 9.99, AUD: 9.99, JPY: 600, INR: 299, BRL: 19.90 },
      annual: { USD: 139.00, EUR: 89.90, GBP: 95.00, TRY: 399.00, MXN: 899, CAD: 99.00, AUD: 79.00, JPY: 5900, INR: 1499, BRL: 166.00 },
    },
  },
  {
    name: "Apple Music",
    slug: "apple-music",
    url: "https://music.apple.com/account",
    color: "#FC3C44",
    icon: Music,
    category: "Entertainment",
    defaultPlan: "individual",
    plans: {
      individual: { USD: 10.99, EUR: 10.99, GBP: 10.99, TRY: 39.99, MXN: 99, CAD: 10.99, AUD: 14.99, JPY: 1080, INR: 99, BRL: 21.90 },
      family: { USD: 16.99, EUR: 16.99, GBP: 16.99, TRY: 64.99, MXN: 149, CAD: 16.99, AUD: 24.99, JPY: 1680, INR: 179, BRL: 34.90 },
      student: { USD: 5.99, EUR: 5.99, GBP: 5.99, TRY: 24.99, MXN: 59, CAD: 5.99, AUD: 7.99, JPY: 580, INR: 59, BRL: 12.90 },
    },
  },
  {
    name: "Adobe Creative Cloud",
    slug: "adobe-cc",
    url: "https://account.adobe.com/plans",
    color: "#FF0000",
    icon: Palette,
    category: "Productivity",
    defaultPlan: "individual",
    plans: {
      photography: { USD: 9.99, EUR: 11.99, GBP: 9.99, TRY: 269.99, MXN: 219, CAD: 12.99, AUD: 14.99, JPY: 1180, INR: 1099, BRL: 54.90 },
      individual: { USD: 54.99, EUR: 59.99, GBP: 54.99, TRY: 1249.99, MXN: 1099, CAD: 64.99, AUD: 79.99, JPY: 6980, INR: 4899, BRL: 289.00 },
      business: { USD: 84.99, EUR: 89.99, GBP: 79.99, TRY: 2099.99, MXN: 1699, CAD: 99.99, AUD: 119.99, JPY: 10780, INR: 7899, BRL: 449.00 },
    },
  },
  {
    name: "Canva",
    slug: "canva",
    url: "https://www.canva.com/settings/billing",
    color: "#00C4CC",
    icon: PenTool,
    category: "Productivity",
    defaultPlan: "pro",
    plans: {
      free: { USD: 0, EUR: 0, GBP: 0, TRY: 0, MXN: 0, CAD: 0, AUD: 0, JPY: 0, INR: 0, BRL: 0 },
      pro: { USD: 12.99, EUR: 11.99, GBP: 10.99, TRY: 159.99, MXN: 179, CAD: 16.99, AUD: 19.99, JPY: 1500, INR: 499, BRL: 44.99 },
      teams: { USD: 14.99, EUR: 13.99, GBP: 12.99, TRY: 199.99, MXN: 229, CAD: 19.99, AUD: 24.99, JPY: 1800, INR: 659, BRL: 54.99 },
    },
  },
  {
    name: "Proton VPN",
    slug: "proton-vpn",
    url: "https://account.protonvpn.com",
    color: "#6D4AFF",
    icon: Shield,
    category: "Security",
    defaultPlan: "plus",
    plans: {
      free: { USD: 0, EUR: 0, GBP: 0, TRY: 0, MXN: 0, CAD: 0, AUD: 0, JPY: 0, INR: 0, BRL: 0 },
      plus: { USD: 9.99, EUR: 9.99, GBP: 8.99, TRY: 269.99, MXN: 169, CAD: 11.99, AUD: 13.99, JPY: 1200, INR: 679, BRL: 47.90 },
      unlimited: { USD: 12.99, EUR: 12.99, GBP: 11.99, TRY: 359.99, MXN: 219, CAD: 14.99, AUD: 17.99, JPY: 1500, INR: 899, BRL: 59.90 },
    },
  },
  {
    name: "X Premium",
    slug: "x-twitter",
    url: "https://twitter.com/settings/manage_subscription",
    color: "#000000",
    icon: CreditCard,
    category: "Social",
    defaultPlan: "basic",
    plans: {
      basic: { USD: 3.00, EUR: 3.00, GBP: 2.50, TRY: 59.99, MXN: 49, CAD: 3.99, AUD: 4.99, JPY: 400, INR: 215, BRL: 14.90 },
      premium: { USD: 8.00, EUR: 8.00, GBP: 6.50, TRY: 169.99, MXN: 139, CAD: 9.99, AUD: 12.99, JPY: 1000, INR: 650, BRL: 39.90 },
      "premium+": { USD: 16.00, EUR: 16.00, GBP: 13.00, TRY: 449.99, MXN: 279, CAD: 19.99, AUD: 24.99, JPY: 2000, INR: 1300, BRL: 79.90 },
    },
  },
  {
    name: "Xbox Game Pass",
    slug: "xbox-game-pass",
    url: "https://account.xbox.com/subscriptions",
    color: "#107C10",
    icon: Gamepad2,
    category: "Gaming",
    defaultPlan: "standard",
    plans: {
      core: { USD: 9.99, EUR: 6.99, GBP: 5.99, TRY: 99.99, MXN: 129, CAD: 11.99, AUD: 15.95, JPY: 1100, INR: 499, BRL: 44.99 },
      standard: { USD: 14.99, EUR: 12.99, GBP: 10.99, TRY: 159.99, MXN: 199, CAD: 17.99, AUD: 21.95, JPY: 1450, INR: 749, BRL: 59.99 },
      ultimate: { USD: 19.99, EUR: 17.99, GBP: 14.99, TRY: 249.99, MXN: 299, CAD: 22.99, AUD: 29.95, JPY: 1800, INR: 999, BRL: 79.99 },
    },
  },
  {
    name: "PlayStation Plus",
    slug: "playstation-plus",
    url: "https://www.playstation.com/account/subscriptions",
    color: "#003087",
    icon: Gamepad2,
    category: "Gaming",
    defaultPlan: "essential",
    plans: {
      essential: { USD: 9.99, EUR: 8.99, GBP: 6.99, TRY: 179.99, MXN: 149, CAD: 9.99, AUD: 13.95, JPY: 850, INR: 499, BRL: 42.90 },
      extra: { USD: 14.99, EUR: 13.99, GBP: 10.99, TRY: 299.99, MXN: 219, CAD: 17.99, AUD: 21.95, JPY: 1300, INR: 749, BRL: 69.90 },
      premium: { USD: 17.99, EUR: 16.99, GBP: 13.49, TRY: 429.99, MXN: 299, CAD: 21.99, AUD: 27.95, JPY: 1550, INR: 999, BRL: 84.90 },
    },
  },
  {
    name: "iCloud+",
    slug: "icloud",
    url: "https://www.icloud.com/settings/",
    color: "#3693F3",
    icon: Cloud,
    category: "Cloud Storage",
    defaultPlan: "50gb",
    plans: {
      "50gb": { USD: 0.99, EUR: 0.99, GBP: 0.79, TRY: 14.99, MXN: 17, CAD: 1.29, AUD: 1.49, JPY: 130, INR: 75, BRL: 3.50 },
      "200gb": { USD: 2.99, EUR: 2.99, GBP: 2.49, TRY: 44.99, MXN: 49, CAD: 3.99, AUD: 4.49, JPY: 400, INR: 219, BRL: 10.90 },
      "2tb": { USD: 10.99, EUR: 10.99, GBP: 8.99, TRY: 149.99, MXN: 179, CAD: 13.99, AUD: 16.99, JPY: 1500, INR: 749, BRL: 39.90 },
    },
  },
  {
    name: "HBO Max",
    slug: "hbo-max",
    url: "https://www.max.com/account",
    color: "#5822B4",
    icon: Tv,
    category: "Entertainment",
    defaultPlan: "standard",
    plans: {
      "with-ads": { USD: 9.99, EUR: 5.99, GBP: 4.99, TRY: 79.99, MXN: 99, CAD: 9.99, AUD: 11.99, JPY: 990, INR: 399, BRL: 29.90 },
      standard: { USD: 15.99, EUR: 13.99, GBP: 9.99, TRY: 124.99, MXN: 199, CAD: 16.99, AUD: 19.99, JPY: 1490, INR: 699, BRL: 49.90 },
      ultimate: { USD: 20.99, EUR: 17.99, GBP: 14.99, TRY: 199.99, MXN: 299, CAD: 22.99, AUD: 27.99, JPY: 1990, INR: 999, BRL: 69.90 },
    },
  },
  {
    name: "Audible",
    slug: "audible",
    url: "https://www.audible.com/account",
    color: "#F8991D",
    icon: BookOpen,
    category: "Entertainment",
    defaultPlan: "plus",
    plans: {
      plus: { USD: 7.95, EUR: 7.95, GBP: 7.99, TRY: 24.99, MXN: 99, CAD: 9.99, AUD: 11.99, JPY: 1500, INR: 199, BRL: 24.90 },
      premium: { USD: 14.95, EUR: 9.95, GBP: 7.99, TRY: 49.99, MXN: 179, CAD: 14.95, AUD: 16.45, JPY: 1500, INR: 299, BRL: 39.90 },
    },
  },
];

export const currencies = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "TRY", label: "TRY (₺)", symbol: "₺" },
  { value: "MXN", label: "MXN ($)", symbol: "$" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "BRL", label: "BRL (R$)", symbol: "R$" },
] as const;

export type Currency = (typeof currencies)[number]["value"];

/**
 * Get all available plan names for a preset
 */
export const getPlansForPreset = (preset: SubscriptionPreset): string[] => {
  return Object.keys(preset.plans);
};

/**
 * Get price for a specific plan and currency
 */
export const getPlanPrice = (
  preset: SubscriptionPreset,
  planName: string,
  currency: Currency
): number => {
  const plan = preset.plans[planName];
  return plan?.[currency] ?? 0;
};

/**
 * Format plan name for display (e.g., "50gb" -> "50GB", "with-ads" -> "With Ads")
 */
export const formatPlanName = (planName: string): string => {
  // Handle size suffixes
  if (/^\d+[gt]b$/i.test(planName)) {
    return planName.toUpperCase();
  }
  // Handle hyphenated names
  return planName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Find preset by name or slug
 */
export const findPreset = (name: string): SubscriptionPreset | undefined => {
  const searchName = name.toLowerCase().trim();
  return subscriptionPresets.find(
    (preset) =>
      preset.name.toLowerCase().includes(searchName) ||
      preset.slug.includes(searchName)
  );
};

/**
 * Generate slug from name
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/**
 * Generate a fallback management URL for custom subscriptions
 */
export const generateFallbackUrl = (name: string): string => {
  const encodedName = encodeURIComponent(`manage ${name} subscription`);
  return `https://www.google.com/search?q=${encodedName}`;
};
