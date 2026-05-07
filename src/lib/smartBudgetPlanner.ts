import type { Budget, Transaction } from "@/hooks/useFinance";
import type { AnalyticsIntelligence } from "@/lib/analyticsIntelligence";
import type { FinancialHealthResult } from "@/lib/financialHealthScore";
import type { PredictiveFinanceResult } from "@/lib/predictiveFinanceEngine";
import type { Subscription } from "@/hooks/subscriptions/types";

export type SmartBudgetRiskLevel = "Low" | "Medium" | "High";

export type SmartBudgetCategoryPlan = {
  category: string;
  planned: number;
  spent: number;
  remaining: number;
  usagePct: number;
  trendVsLastMonthPct: number;
  riskLabel: SmartBudgetRiskLevel;
  aiComment: string;
  projectedOverrun: number;
  adjustAction: string;
};

export type SmartBudgetRecommendation = {
  id: string;
  title: string;
  estimatedImpact: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  suggestedAction: string;
  relatedImpact: string;
};

export type SmartBudgetRiskAlert = {
  id: string;
  title: string;
  riskLevel: SmartBudgetRiskLevel;
  projectedImpact: string;
  preventionSuggestion: string;
  timeline: string;
};

export type SmartBudgetGoalPlan = {
  goalName: string;
  monthlyRequiredSaving: number;
  suggestedAdjustment: string;
  delayedByOverspending: boolean;
  accelerationTip: string;
};

export type SmartBudgetHistoryPoint = {
  label: string;
  plannedBudget: number;
  actualSpend: number;
  savingsRatePct: number;
  budgetDisciplinePct: number;
};

export type SmartBudgetPlannerResult = {
  monthLabel: string;
  summaryHero: {
    monthlyIncome: number;
    totalPlannedBudget: number;
    spentSoFar: number;
    remainingBudget: number;
    savingsTarget: number;
    safeToSpendToday: number;
    budgetHealthStatus: string;
    monthProgressPct: number;
    aiSummary: string;
  };
  monthlyOverview: {
    totalIncome: number;
    fixedExpenses: number;
    variableExpenses: number;
    subscriptions: number;
    savingsTarget: number;
    remainingFlexibleBudget: number;
    projectedEndOfMonthBalance: number;
  };
  categoryBudgets: SmartBudgetCategoryPlan[];
  aiRecommendations: SmartBudgetRecommendation[];
  safeToSpendSystem: {
    safeToday: number;
    safeThisWeek: number;
    remainingMonthlyFlexibleBudget: number;
    upcomingBillsImpact: number;
    projectedOverspendingRiskPct: number;
    aiExplanation: string;
  };
  riskAlerts: SmartBudgetRiskAlert[];
  goalBasedPlanning: {
    activeGoalsAffected: number;
    monthlyRequiredSaving: number;
    adjustmentToReachFaster: string;
    delayedGoalsDueToOverspending: number;
    savingsAccelerationSuggestion: string;
    goalPlans: SmartBudgetGoalPlan[];
  };
  adjustmentSuggestions: SmartBudgetRecommendation[];
  budgetHistoryComparison: {
    currentMonthPerformance: string;
    previousMonthComparison: string;
    bestCategoryImprovement: string;
    worstCategoryOverrun: string;
    savingsRateTrend: string;
    budgetDisciplineTrend: string;
    history: SmartBudgetHistoryPoint[];
  };
  rubyBudgetPrompts: string[];
};

type BuildSmartBudgetPlannerInput = {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  analytics: AnalyticsIntelligence;
  health: FinancialHealthResult;
  predictive: PredictiveFinanceResult;
  referenceDate?: Date;
};

const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, safe(value)));
const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Housing",
  "Entertainment",
  "Health",
  "Education",
  "Savings",
  "Other",
] as const;

const getMonthTotals = (transactions: Transaction[], targetMonth: string) => {
  let income = 0;
  let expenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    const date = new Date(tx.date);
    if (Number.isNaN(date.getTime()) || monthKey(date) !== targetMonth) continue;
    const amount = safe(Number(tx.amount));
    if (tx.type === "income") {
      income += amount;
    } else {
      expenses += amount;
      categoryTotals[tx.category] = safe(categoryTotals[tx.category]) + amount;
    }
  }

  return { income: safe(income), expenses: safe(expenses), categoryTotals };
};

const monthlySubscriptionCost = (subscriptions: Subscription[]) =>
  subscriptions.reduce((sum, sub) => {
    const amount = safe(Number(sub.price));
    return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);

export const buildSmartBudgetPlanner = ({
  transactions,
  budgets,
  subscriptions,
  analytics,
  health,
  predictive,
  referenceDate,
}: BuildSmartBudgetPlannerInput): SmartBudgetPlannerResult => {
  const now = referenceDate ?? new Date();
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentKey = monthKey(now);
  const previousKey = monthKey(previousDate);
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const current = getMonthTotals(transactions, currentKey);
  const previous = getMonthTotals(transactions, previousKey);
  const subscriptionCost = monthlySubscriptionCost(subscriptions);

  const budgetMap = budgets.reduce<Record<string, number>>((acc, budget) => {
    acc[budget.category] = safe(Number(budget.limit_amount));
    return acc;
  }, {});

  const fixedCategories = new Set(["Housing", "Subscriptions", "Education"]);
  const fixedExpenses = CATEGORIES.reduce((sum, category) => {
    if (!fixedCategories.has(category)) return sum;
    const base = category === "Subscriptions" ? subscriptionCost : safe(current.categoryTotals[category]);
    return sum + base;
  }, 0);
  const variableExpenses = Math.max(0, current.expenses - (safe(current.categoryTotals.Housing) + safe(current.categoryTotals.Education)));

  const totalPlannedBudget = CATEGORIES.reduce((sum, category) => {
    if (category === "Savings") {
      return sum + Math.max(current.income * 0.15, safe(budgetMap.Savings));
    }
    if (category === "Subscriptions") {
      return sum + Math.max(subscriptionCost, safe(budgetMap.Subscriptions));
    }
    const categorySpent = safe(current.categoryTotals[category]);
    const previousSpent = safe(previous.categoryTotals[category]);
    const inferred = previousSpent > 0 ? previousSpent * 1.03 : categorySpent > 0 ? categorySpent * 1.08 : current.income * 0.05;
    return sum + Math.max(safe(budgetMap[category]), inferred);
  }, 0);

  const spentSoFar = current.expenses + subscriptionCost;
  const savingsTarget = Math.max(current.income * 0.2, safe(budgetMap.Savings), 120);
  const remainingBudget = totalPlannedBudget - spentSoFar;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
  const safeToSpendToday = Math.max(0, (remainingBudget - savingsTarget * 0.35) / remainingDays);
  const monthProgressPct = clamp((now.getDate() / Math.max(1, daysInMonth)) * 100, 0, 100);

  const categoryBudgets: SmartBudgetCategoryPlan[] = CATEGORIES.map((category) => {
    const planned =
      category === "Savings"
        ? Math.max(savingsTarget, safe(budgetMap.Savings))
        : category === "Subscriptions"
        ? Math.max(subscriptionCost, safe(budgetMap.Subscriptions))
        : Math.max(
            safe(budgetMap[category]),
            safe(previous.categoryTotals[category]) * 1.03,
            safe(current.income) * 0.03
          );
    const spent =
      category === "Savings"
        ? Math.max(0, current.income - current.expenses - subscriptionCost)
        : category === "Subscriptions"
        ? subscriptionCost + safe(current.categoryTotals.Subscriptions)
        : safe(current.categoryTotals[category]);
    const remaining = planned - spent;
    const usagePct = planned > 0 ? (spent / planned) * 100 : 0;
    const previousSpent = category === "Subscriptions" ? subscriptionCost + safe(previous.categoryTotals.Subscriptions) : safe(previous.categoryTotals[category]);
    const trendVsLastMonthPct = previousSpent > 0 ? ((spent - previousSpent) / previousSpent) * 100 : spent > 0 ? 100 : 0;
    const projectedMonthSpend = spent + safe(predictive.spendingProjection.weeklyPrediction) * (remainingDays / 7) * 0.45;
    const projectedOverrun = Math.max(0, projectedMonthSpend - planned);

    const riskLabel: SmartBudgetRiskLevel =
      usagePct >= 95 || projectedOverrun > planned * 0.12 ? "High" : usagePct >= 75 || trendVsLastMonthPct > 14 ? "Medium" : "Low";
    const aiComment =
      riskLabel === "High"
        ? `${category} is running above a healthy pace and could exceed target this month.`
        : riskLabel === "Medium"
        ? `${category} is slightly above trend; a small adjustment keeps it controlled.`
        : `${category} is stable and aligned with your monthly budget pace.`;
    const adjustAction =
      riskLabel === "High"
        ? `Reduce ${category.toLowerCase()} by ${Math.ceil(Math.max(15, projectedOverrun * 0.5))} this week.`
        : `Maintain ${category.toLowerCase()} pace and review weekly.`;

    return {
      category,
      planned,
      spent,
      remaining,
      usagePct,
      trendVsLastMonthPct,
      riskLabel,
      aiComment,
      projectedOverrun,
      adjustAction,
    };
  });

  const highestRiskCategory = categoryBudgets
    .slice()
    .sort((a, b) => (b.riskLabel === "High" ? 2 : b.riskLabel === "Medium" ? 1 : 0) - (a.riskLabel === "High" ? 2 : a.riskLabel === "Medium" ? 1 : 0))[0];

  const aiRecommendations: SmartBudgetRecommendation[] = [
    {
      id: "rec-food-cut",
      title: "Reduce Food & Dining by $80 to increase savings rate.",
      estimatedImpact: "+1.5% savings rate",
      difficulty: "Medium",
      category: "Food & Dining",
      suggestedAction: "Set a weekly food cap and move recovered amount to savings.",
      relatedImpact: "Health score and emergency fund",
    },
    {
      id: "rec-shopping-shift",
      title: "Move $50 from Shopping to Emergency Fund.",
      estimatedImpact: "Improves cash buffer stability",
      difficulty: "Easy",
      category: "Shopping",
      suggestedAction: "Lower shopping cap and automate transfer to emergency goal.",
      relatedImpact: "Goal acceleration",
    },
    {
      id: "rec-subs-ok",
      title: "Your subscription budget is healthy.",
      estimatedImpact: "Recurring cost remains controlled",
      difficulty: "Easy",
      category: "Subscriptions",
      suggestedAction: "Keep recurring burden below 15% of income.",
      relatedImpact: "Financial health stability",
    },
    {
      id: "rec-transport-stable",
      title: "Transportation spending is stable compared to last month.",
      estimatedImpact: "Supports budget discipline trend",
      difficulty: "Easy",
      category: "Transportation",
      suggestedAction: "Maintain current transport usage baseline.",
      relatedImpact: "Consistency score",
    },
    {
      id: "rec-health-boost",
      title: "Increasing savings by $100 could improve your Health Score.",
      estimatedImpact: `+${Math.max(3, Math.round(health.monthlyScoreChange + 4))} score points potential`,
      difficulty: "Medium",
      category: "Savings",
      suggestedAction: "Increase monthly savings allocation with one extra transfer.",
      relatedImpact: "Health score improvement",
    },
  ];

  const upcomingBillsImpact = predictive.subscriptionImpact.monthlyCost;
  const remainingFlexibleBudget = Math.max(0, current.income - fixedExpenses - savingsTarget);
  const safeThisWeek = Math.max(0, safeToSpendToday * 7);
  const projectedOverspendingRiskPct = clamp(predictive.budgetRisk.scorePct * 0.82, 0, 100);

  const riskAlerts: SmartBudgetRiskAlert[] = [
    {
      id: "risk-food",
      title: `${highestRiskCategory?.category ?? "Food budget"} may exceed limit soon.`,
      riskLevel: highestRiskCategory?.riskLabel ?? "Medium",
      projectedImpact: `${Math.ceil(highestRiskCategory?.projectedOverrun ?? 40)} potential overrun if pace continues`,
      preventionSuggestion: "Apply a weekly limit and reduce non-essential transactions in this category.",
      timeline: "Next 5-7 days",
    },
    {
      id: "risk-shopping",
      title: "Shopping is above your normal pace.",
      riskLevel: "Medium",
      projectedImpact: `${Math.abs(analytics.categoryIntelligence.fastestGrowing?.growthPct ?? 14).toFixed(1)}% above trend`,
      preventionSuggestion: "Use a cool-off period for discretionary purchases this week.",
      timeline: "This week",
    },
    {
      id: "risk-subs",
      title: "Upcoming subscriptions will reduce flexible budget.",
      riskLevel: projectedOverspendingRiskPct > 55 ? "High" : "Medium",
      projectedImpact: `${Math.round(upcomingBillsImpact)} expected recurring impact`,
      preventionSuggestion: "Delay one variable category purchase and reserve recurring cash first.",
      timeline: "Next billing cycle",
    },
    {
      id: "risk-weekend",
      title: "Weekend spending pattern may affect savings target.",
      riskLevel: analytics.financialBehavior.weekendSpendingPct > 36 ? "High" : "Medium",
      projectedImpact: `${analytics.financialBehavior.weekendSpendingPct.toFixed(1)}% weekend share`,
      preventionSuggestion: "Set weekend-only cap and check safe-to-spend before discretionary spend.",
      timeline: "Upcoming weekend",
    },
  ];

  const monthlyRequiredSaving = Math.max(150, Math.round(Math.max(0, predictive.goalForecast.accelerationPct) * 1.4));
  const delayedGoals = predictive.goalForecast.delayed ? Math.min(2, Math.max(1, budgets.length)) : 0;
  const goalPlans: SmartBudgetGoalPlan[] = budgets.slice(0, 3).map((budget, index) => ({
    goalName: `${budget.category} Goal`,
    monthlyRequiredSaving: Math.max(60, monthlyRequiredSaving - index * 20),
    suggestedAdjustment: `Shift ${Math.max(20, Math.round((safe(budget.limit_amount) || 100) * 0.07))} from ${budget.category} volatility budget to savings.`,
    delayedByOverspending: delayedGoals > 0 && index === 0,
    accelerationTip: "Use automatic weekly transfers after payday.",
  }));

  const history: SmartBudgetHistoryPoint[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(date);
    const totals = getMonthTotals(transactions, key);
    const subCost = monthlySubscriptionCost(subscriptions);
    const spend = totals.expenses + subCost;
    const planned = Math.max(spend * 1.06, totalPlannedBudget * (0.88 + index * 0.02));
    const savingsRatePct = totals.income > 0 ? ((totals.income - spend) / totals.income) * 100 : 0;
    const budgetDisciplinePct = planned > 0 ? clamp((planned - spend) / planned * 100 + 50, 0, 100) : 50;
    return {
      label: date.toLocaleString("en-US", { month: "short" }),
      plannedBudget: planned,
      actualSpend: spend,
      savingsRatePct,
      budgetDisciplinePct,
    };
  });

  const bestCategoryImprovement = categoryBudgets
    .slice()
    .sort((a, b) => a.trendVsLastMonthPct - b.trendVsLastMonthPct)[0];
  const worstCategoryOverrun = categoryBudgets
    .slice()
    .sort((a, b) => b.projectedOverrun - a.projectedOverrun)[0];
  const currentSavingsRate = history.at(-1)?.savingsRatePct ?? 0;
  const prevSavingsRate = history.at(-2)?.savingsRatePct ?? 0;
  const currentDiscipline = history.at(-1)?.budgetDisciplinePct ?? 0;
  const prevDiscipline = history.at(-2)?.budgetDisciplinePct ?? 0;

  const budgetHealthStatus =
    projectedOverspendingRiskPct > 62
      ? "Needs Attention"
      : projectedOverspendingRiskPct > 38
      ? "Cautious"
      : "On Track";

  const rubyBudgetPrompts = [
    "Create a budget for my income.",
    "Where should I reduce spending?",
    "How can I save $200 this month?",
    "Can I afford this purchase?",
    "Adjust my budget for my goals.",
    "Explain why I'm over budget.",
  ];

  return {
    monthLabel,
    summaryHero: {
      monthlyIncome: current.income,
      totalPlannedBudget,
      spentSoFar,
      remainingBudget,
      savingsTarget,
      safeToSpendToday,
      budgetHealthStatus,
      monthProgressPct,
      aiSummary: `Ruby AI reviewed your budget. You are ${budgetHealthStatus.toLowerCase()} overall, but ${
        highestRiskCategory?.category ?? "Food & Dining"
      } is trending ${Math.abs(highestRiskCategory?.trendVsLastMonthPct ?? 18).toFixed(1)}% above plan.`,
    },
    monthlyOverview: {
      totalIncome: current.income,
      fixedExpenses,
      variableExpenses,
      subscriptions: subscriptionCost,
      savingsTarget,
      remainingFlexibleBudget,
      projectedEndOfMonthBalance: predictive.monthlyProjection.projectedEndBalance,
    },
    categoryBudgets,
    aiRecommendations,
    safeToSpendSystem: {
      safeToday: safeToSpendToday,
      safeThisWeek,
      remainingMonthlyFlexibleBudget: Math.max(0, remainingBudget),
      upcomingBillsImpact,
      projectedOverspendingRiskPct,
      aiExplanation: `You can safely spend about ${safeToSpendToday.toFixed(
        2
      )} today while staying aligned with your monthly savings target and recurring obligations.`,
    },
    riskAlerts,
    goalBasedPlanning: {
      activeGoalsAffected: budgets.length,
      monthlyRequiredSaving,
      adjustmentToReachFaster: "Reduce entertainment and shopping by 8-12% and reroute the difference to goal buckets.",
      delayedGoalsDueToOverspending: delayedGoals,
      savingsAccelerationSuggestion: "Automate a weekly contribution increase on high-income days.",
      goalPlans,
    },
    adjustmentSuggestions: aiRecommendations.slice(0, 4),
    budgetHistoryComparison: {
      currentMonthPerformance: `${budgetHealthStatus} with ${Math.max(0, remainingBudget).toFixed(0)} remaining budget.`,
      previousMonthComparison: `${safe(currentSavingsRate).toFixed(1)}% savings rate vs ${prevSavingsRate.toFixed(
        1
      )}% last month.`,
      bestCategoryImprovement: `${bestCategoryImprovement?.category ?? "Transportation"} improved by ${Math.abs(
        bestCategoryImprovement?.trendVsLastMonthPct ?? 0
      ).toFixed(1)}%.`,
      worstCategoryOverrun: `${worstCategoryOverrun?.category ?? "Food & Dining"} has the highest overrun risk.`,
      savingsRateTrend: `${currentSavingsRate >= prevSavingsRate ? "Upward" : "Downward"} trend (${currentSavingsRate.toFixed(1)}%).`,
      budgetDisciplineTrend: `${currentDiscipline >= prevDiscipline ? "Improving" : "Weakening"} (${currentDiscipline.toFixed(1)}%).`,
      history,
    },
    rubyBudgetPrompts,
  };
};
