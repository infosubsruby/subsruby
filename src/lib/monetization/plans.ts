import type { BillingCycle as CommonBillingCycle, PlanType } from "@/types/common";

export type PlanTier = PlanType;
export type BillingCycle = Extract<CommonBillingCycle, "monthly" | "yearly">;

export type MonetizationFeatureKey =
  | "ruby_ai_full_access"
  | "advanced_ai_insights"
  | "predictive_finance"
  | "monthly_reports"
  | "report_export"
  | "smart_budget_planner"
  | "advanced_analytics"
  | "subscription_optimizer"
  | "unlimited_goals"
  | "smart_transaction_ai";

export type UsageLimitKey =
  | "transactions_per_month"
  | "subscriptions"
  | "goals"
  | "ruby_ai_prompts_per_month";

type PlanPrice = {
  monthly: number;
  yearly: number;
  yearlyDiscountLabel: string;
};

export type PricingPlanDefinition = {
  id: PlanTier;
  name: string;
  tagline: string;
  description: string;
  recommended?: boolean;
  ctaLabel: string;
  price: PlanPrice;
  highlights: string[];
};

export type PlanUsageLimits = Record<UsageLimitKey, number | null>;

export const PLAN_FEATURES: Record<PlanTier, Record<MonetizationFeatureKey, boolean>> = {
  free: {
    ruby_ai_full_access: false,
    advanced_ai_insights: false,
    predictive_finance: false,
    monthly_reports: false,
    report_export: false,
    smart_budget_planner: false,
    advanced_analytics: false,
    subscription_optimizer: false,
    unlimited_goals: false,
    smart_transaction_ai: false,
  },
  pro: {
    ruby_ai_full_access: true,
    advanced_ai_insights: true,
    predictive_finance: true,
    monthly_reports: true,
    report_export: true,
    smart_budget_planner: true,
    advanced_analytics: true,
    subscription_optimizer: true,
    unlimited_goals: true,
    smart_transaction_ai: true,
  },
};

export const PLAN_USAGE_LIMITS: Record<PlanTier, PlanUsageLimits> = {
  free: {
    transactions_per_month: 30,
    subscriptions: 5,
    goals: 3,
    ruby_ai_prompts_per_month: 25,
  },
  pro: {
    transactions_per_month: null,
    subscriptions: null,
    goals: null,
    ruby_ai_prompts_per_month: null,
  },
};

export const PRICING_PLANS: PricingPlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For users starting out",
    description: "Manual finance tracking with basic AI guidance and core dashboards.",
    ctaLabel: "Current plan",
    price: {
      monthly: 0,
      yearly: 0,
      yearlyDiscountLabel: "Always free",
    },
    highlights: [
      "Manual transaction tracking",
      "Basic subscriptions and goals",
      "Basic dashboard and wallet tracking",
      "Limited AI insights",
      "Monthly report preview",
    ],
  },
  {
    id: "pro",
    name: "Ruby AI Pro",
    tagline: "For the full AI finance experience",
    description: "Predictive finance, deep analysis, and personal CFO-level planning.",
    recommended: true,
    ctaLabel: "Upgrade to Pro",
    price: {
      monthly: 6.99,
      yearly: 59,
      yearlyDiscountLabel: "Save 30% yearly",
    },
    highlights: [
      "Ruby AI assistant with deep analysis",
      "Advanced AI insights and predictive finance",
      "Smart budget planner and advanced safe-to-spend",
      "Monthly reports with export-ready workflow",
      "Subscription optimizer and advanced analytics",
      "Unlimited goals and priority feature access",
    ],
  },
];

export const FEATURE_LABELS: Record<MonetizationFeatureKey, string> = {
  ruby_ai_full_access: "Ruby AI personal CFO mode",
  advanced_ai_insights: "Advanced AI insights",
  predictive_finance: "Predictive finance forecasts",
  monthly_reports: "Monthly financial reports",
  report_export: "Monthly report export",
  smart_budget_planner: "Smart budget planner",
  advanced_analytics: "Advanced analytics",
  subscription_optimizer: "Subscription optimizer",
  unlimited_goals: "Unlimited goals",
  smart_transaction_ai: "Smart transaction intelligence",
};

export const PLAN_COMPARISON_ROWS: Array<{
  feature: string;
  free: string;
  pro: string;
}> = [
  { feature: "Transactions", free: "Up to 30 per month", pro: "Unlimited" },
  { feature: "Subscriptions", free: "Up to 5", pro: "Unlimited + optimizer details" },
  { feature: "Goals", free: "Up to 3", pro: "Unlimited goals" },
  { feature: "Ruby AI prompts", free: "Limited monthly prompts", pro: "Full personal CFO mode" },
  { feature: "AI insights", free: "Basic insight cards", pro: "Advanced recommendations + scoring" },
  { feature: "Predictive finance", free: "Preview only", pro: "Full forecasting layer" },
  { feature: "Monthly reports", free: "Preview only", pro: "Full monthly reports" },
  { feature: "Report export", free: "Not included", pro: "Export-ready workflow" },
  { feature: "Analytics", free: "Basic analytics", pro: "Advanced analytics + forecasts" },
];

export const PRICING_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Is payment live right now?",
    answer:
      "Pricing is available as product UI and plan architecture. Billing infrastructure can be connected later without changing your app routes.",
  },
  {
    question: "Can I keep using the app on Free?",
    answer:
      "Yes. Free keeps core tracking, wallet visibility, basic goals, and limited AI insights for everyday money management.",
  },
  {
    question: "Why upgrade to Ruby AI Pro?",
    answer:
      "Pro unlocks predictive forecasts, deeper recommendations, advanced budget planning, full monthly reports, and richer optimization workflows.",
  },
];
