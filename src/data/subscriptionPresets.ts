import { Play, Music, Film, Palette, ShoppingBag, Gamepad2, Cloud, BookOpen, Tv, CreditCard, PenTool, Shield, type LucideIcon } from "lucide-react";

export interface SubscriptionPreset {
  name: string;
  slug: string;
  url: string; // Management URL
  color: string;
  icon: LucideIcon;
  category: string;
}

export const subscriptionPresets: SubscriptionPreset[] = [
  {
    name: "Netflix",
    slug: "netflix",
    url: "https://www.netflix.com/youraccount",
    color: "#E50914",
    icon: Play,
    category: "Entertainment",
  },
  {
    name: "Spotify",
    slug: "spotify",
    url: "https://www.spotify.com/account",
    color: "#1DB954",
    icon: Music,
    category: "Entertainment",
  },
  {
    name: "YouTube Premium",
    slug: "youtube-premium",
    url: "https://www.youtube.com/paid_memberships",
    color: "#FF0000",
    icon: Play,
    category: "Entertainment",
  },
  {
    name: "Disney+",
    slug: "disney-plus",
    url: "https://www.disneyplus.com/account",
    color: "#113CCF",
    icon: Film,
    category: "Entertainment",
  },
  {
    name: "Amazon Prime",
    slug: "amazon-prime",
    url: "https://www.amazon.com/gp/primecentral",
    color: "#FF9900",
    icon: ShoppingBag,
    category: "Shopping",
  },
  {
    name: "Apple Music",
    slug: "apple-music",
    url: "https://music.apple.com/account",
    color: "#FC3C44",
    icon: Music,
    category: "Entertainment",
  },
  {
    name: "Adobe Creative Cloud",
    slug: "adobe-cc",
    url: "https://account.adobe.com/plans",
    color: "#FF0000",
    icon: Palette,
    category: "Productivity",
  },
  {
    name: "Canva",
    slug: "canva",
    url: "https://www.canva.com/settings/billing",
    color: "#00C4CC",
    icon: PenTool,
    category: "Productivity",
  },
  {
    name: "Proton VPN",
    slug: "proton-vpn",
    url: "https://account.protonvpn.com",
    color: "#6D4AFF",
    icon: Shield,
    category: "Security",
  },
  {
    name: "X Premium",
    slug: "x-twitter",
    url: "https://twitter.com/settings/manage_subscription",
    color: "#000000",
    icon: CreditCard,
    category: "Social",
  },
  {
    name: "Xbox Game Pass",
    slug: "xbox-game-pass",
    url: "https://account.xbox.com/subscriptions",
    color: "#107C10",
    icon: Gamepad2,
    category: "Gaming",
  },
  {
    name: "PlayStation Plus",
    slug: "playstation-plus",
    url: "https://www.playstation.com/account/subscriptions",
    color: "#003087",
    icon: Gamepad2,
    category: "Gaming",
  },
  {
    name: "iCloud+",
    slug: "icloud",
    url: "https://www.icloud.com/settings/",
    color: "#3693F3",
    icon: Cloud,
    category: "Cloud Storage",
  },
  {
    name: "HBO Max",
    slug: "hbo-max",
    url: "https://www.max.com/account",
    color: "#5822B4",
    icon: Tv,
    category: "Entertainment",
  },
  {
    name: "Audible",
    slug: "audible",
    url: "https://www.audible.com/account",
    color: "#F8991D",
    icon: BookOpen,
    category: "Entertainment",
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
