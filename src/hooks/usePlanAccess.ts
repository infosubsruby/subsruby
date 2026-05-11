import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  hasFeatureAccess,
  getUsageLimit,
  getLimitProgress,
  isWithinLimit,
} from "@/lib/monetization/featureAccess";
import type { MonetizationFeatureKey, PlanTier, UsageLimitKey } from "@/lib/monetization/plans";

const PLAN_OVERRIDE_STORAGE_KEY = "rubyai.devPlanOverride";

const getStoredPlanOverride = (): PlanTier | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(PLAN_OVERRIDE_STORAGE_KEY);
  if (value === "free" || value === "pro") {
    return value;
  }
  return null;
};

export const usePlanAccess = () => {
  const { user, profile, isAdmin } = useAuth();
  const { isPro, loading } = useSubscription();
  const [devPlanOverride, setDevPlanOverrideState] = useState<PlanTier | null>(getStoredPlanOverride);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (devPlanOverride) {
      window.localStorage.setItem(PLAN_OVERRIDE_STORAGE_KEY, devPlanOverride);
    } else {
      window.localStorage.removeItem(PLAN_OVERRIDE_STORAGE_KEY);
    }
  }, [devPlanOverride]);

  const activePlan: PlanTier = useMemo(() => {
    const hasLifetimeAccess = Boolean(profile?.lifetime_access);
    if (isAdmin || hasLifetimeAccess) return "pro";
    if (devPlanOverride) return devPlanOverride;
    return isPro ? "pro" : "free";
  }, [devPlanOverride, isAdmin, isPro, profile?.lifetime_access]);

  const setDevPlanOverride = (plan: PlanTier | null) => {
    setDevPlanOverrideState(plan);
  };

  const canAccessFeature = (feature: MonetizationFeatureKey) => {
    return hasFeatureAccess(activePlan, feature);
  };

  const getLimit = (limitKey: UsageLimitKey) => {
    return getUsageLimit(activePlan, limitKey);
  };

  const isAllowed = (limitKey: UsageLimitKey, currentCount: number) => {
    return isWithinLimit(activePlan, limitKey, currentCount);
  };

  const getUsageStatus = (limitKey: UsageLimitKey, currentCount: number) => {
    return getLimitProgress(activePlan, limitKey, currentCount);
  };

  return {
    userId: user?.id ?? null,
    loading,
    activePlan,
    isProPlan: activePlan === "pro",
    hasUnlimitedAccess: isAdmin || Boolean(profile?.lifetime_access),
    accessTier: isAdmin ? "admin" : profile?.lifetime_access ? "lifetime" : activePlan,
    isDevOverrideEnabled: devPlanOverride !== null,
    devPlanOverride,
    setDevPlanOverride,
    canAccessFeature,
    getLimit,
    isAllowed,
    getUsageStatus,
  };
};
