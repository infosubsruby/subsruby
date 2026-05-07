import { fetchAIInsights } from "@/services/core/aiInsightService";
import { fetchBudgets } from "@/services/core/budgetService";
import { getFeatureAccessForPlan } from "@/services/core/featureAccessService";
import { fetchGoals } from "@/services/core/goalService";
import { fetchReports } from "@/services/core/reportService";
import { fetchRubyAIConversations } from "@/services/core/rubyAIService";
import { fetchSubscriptions } from "@/services/core/subscriptionService";
import { fetchTransactions } from "@/services/core/transactionService";
import { fetchUserSettings } from "@/services/core/userSettingsService";
import { fetchWallets } from "@/services/core/walletService";
import type { PlanType } from "@/types/common";

export const getTransactions = (userId: string) => fetchTransactions(userId);
export const getSubscriptions = (userId: string) => fetchSubscriptions(userId);
export const getWallets = (userId: string) => fetchWallets(userId);
export const getGoals = (userId: string) => fetchGoals(userId);
export const getBudgets = (userId: string) => fetchBudgets(userId);
export const getAIInsights = (userId: string) => fetchAIInsights(userId);
export const getMonthlyReports = (userId: string) => fetchReports(userId);
export const getRubyAIConversations = (userId: string) => fetchRubyAIConversations(userId);
export const getUserSettings = (userId: string) => fetchUserSettings(userId);
export const getUserPlan = async (userId: string, plan: PlanType = "free") => {
  const resolvedPlan: PlanType = userId.trim().length > 0 ? plan : "free";
  return getFeatureAccessForPlan(resolvedPlan);
};
