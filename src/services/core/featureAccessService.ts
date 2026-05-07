import type { FeatureAccessEntry } from "@/domain/financeModels";
import type { PlanType } from "@/types/common";
import { mockStore } from "@/services/core/baseMockStore";

export const getFeatureAccessForPlan = async (plan: PlanType): Promise<FeatureAccessEntry[]> => {
  const base = mockStore.featureAccess.get();
  if (plan === "pro") {
    return base.map((item) => ({ ...item, access: "available", reason: "Included in Pro" }));
  }
  return base;
};
