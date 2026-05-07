import type { FinancialHealthScore } from "@/domain/financeModels";
import { calculateBudgetUsagePercentage, calculateHealthScore, calculateSavingsRate, calculateSubscriptionBurden } from "@/lib/financeCalculations";
import { fetchBudgets } from "@/services/core/budgetService";
import { fetchSubscriptions } from "@/services/core/subscriptionService";
import { fetchTransactions } from "@/services/core/transactionService";

export const getFinancialHealthScore = async (userId: string): Promise<FinancialHealthScore> => {
  const [transactions, subscriptions, budgets] = await Promise.all([
    fetchTransactions(userId),
    fetchSubscriptions(userId),
    fetchBudgets(userId),
  ]);

  const monthlyIncome = Math.max(
    1,
    transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0)
  );
  const averageBudgetUsage =
    budgets.length === 0 ? 0 : budgets.reduce((sum, item) => sum + calculateBudgetUsagePercentage(item), 0) / budgets.length;

  const score = calculateHealthScore({
    savingsRate: calculateSavingsRate(transactions),
    subscriptionBurden: calculateSubscriptionBurden(subscriptions, monthlyIncome),
    averageBudgetUsage,
  });

  return {
    id: `health-${userId}`,
    userId,
    score,
    status: score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "moderate" : score >= 40 ? "risky" : "critical",
    riskLevel: score >= 75 ? "low" : score >= 55 ? "medium" : "high",
    factors: [
      { key: "savings_rate", score: calculateSavingsRate(transactions), weight: 0.2 },
      { key: "subscription_burden", score: calculateSubscriptionBurden(subscriptions, monthlyIncome), weight: 0.15 },
      { key: "budget_usage", score: averageBudgetUsage, weight: 0.15 },
    ],
    generatedAt: new Date().toISOString(),
  };
};
