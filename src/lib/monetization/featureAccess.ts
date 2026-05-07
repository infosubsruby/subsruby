import {
  FEATURE_LABELS,
  PLAN_FEATURES,
  PLAN_USAGE_LIMITS,
  type MonetizationFeatureKey,
  type PlanTier,
  type UsageLimitKey,
} from "@/lib/monetization/plans";

export const hasFeatureAccess = (plan: PlanTier, feature: MonetizationFeatureKey): boolean => {
  return PLAN_FEATURES[plan][feature];
};

export const getUsageLimit = (plan: PlanTier, limitKey: UsageLimitKey): number | null => {
  return PLAN_USAGE_LIMITS[plan][limitKey];
};

export const isWithinLimit = (plan: PlanTier, limitKey: UsageLimitKey, currentCount: number): boolean => {
  const limit = getUsageLimit(plan, limitKey);
  if (limit === null) return true;
  return currentCount < limit;
};

export const getLimitProgress = (plan: PlanTier, limitKey: UsageLimitKey, currentCount: number) => {
  const limit = getUsageLimit(plan, limitKey);
  if (limit === null) {
    return {
      label: "Unlimited",
      remaining: null,
      ratio: 0,
      reached: false,
    };
  }

  const normalizedCount = Math.max(0, currentCount);
  const remaining = Math.max(0, limit - normalizedCount);
  const ratio = limit > 0 ? Math.min(1, normalizedCount / limit) : 1;

  return {
    label: `${normalizedCount}/${limit}`,
    remaining,
    ratio,
    reached: normalizedCount >= limit,
  };
};

export const getFeatureUpgradeMessage = (feature: MonetizationFeatureKey): string => {
  return `${FEATURE_LABELS[feature]} is available in Ruby AI Pro.`;
};
