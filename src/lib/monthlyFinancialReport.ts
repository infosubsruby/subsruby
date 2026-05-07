import type { Budget, Transaction } from "@/hooks/useFinance";
import type { Subscription } from "@/hooks/subscriptions/types";
import type { AIInsight } from "@/lib/aiInsights";
import type { AnalyticsIntelligence } from "@/lib/analyticsIntelligence";
import type { FinancialHealthResult } from "@/lib/financialHealthScore";
import type { PredictiveFinanceResult } from "@/lib/predictiveFinanceEngine";

export type MonthlyReportCategoryItem = {
  category: string;
  total: number;
  percentageOfExpenses: number;
  previousMonthTotal: number;
  changePct: number;
  aiComment: string;
  suggestedAction: string;
};

export type MonthlyReportInsight = {
  id: string;
  title: string;
  category: string;
  financialImpact: string;
  severity: "low" | "medium" | "high";
  suggestedNextStep: string;
};

export type MonthlyReportAction = {
  id: string;
  title: string;
  expectedImpact: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeline: string;
  relatedCategory: string;
};

export type MonthlyReportResult = {
  monthLabel: string;
  hero: {
    income: number;
    expenses: number;
    netSavings: number;
    savingsRatePct: number;
    healthScoreChange: number;
    biggestImprovement: string;
    biggestWarning: string;
    aiSummary: string;
  };
  incomeVsExpenses: {
    currentIncome: number;
    currentExpenses: number;
    netCashFlow: number;
    previousIncome: number;
    previousExpenses: number;
    incomeTrendPct: number;
    expenseTrendPct: number;
    history: Array<{ label: string; income: number; expenses: number; savings: number }>;
  };
  savingsSummary: {
    totalSaved: number;
    savingsRatePct: number;
    savedDelta: number;
    contributionToGoals: number;
    projectedSavingsNextMonth: number;
  };
  financialHealthChange: {
    currentScore: number;
    previousScore: number;
    scoreChange: number;
    improvedFactors: string[];
    decreasedFactors: string[];
    aiExplanation: string;
  };
  topCategories: MonthlyReportCategoryItem[];
  subscriptionImpact: {
    monthlyCost: number;
    yearlyProjectedCost: number;
    burdenPct: number;
    highestCostSubscription: string;
    possibleSavingsYearly: number;
    renewalRiskCount: number;
  };
  goalProgressSummary: {
    activeGoals: number;
    amountAddedThisMonth: number;
    progressChangePct: number;
    predictedCompletion: string;
    goalsAhead: number;
    goalsDelayed: number;
    aiSavingTip: string;
  };
  monthlyInsights: MonthlyReportInsight[];
  nextMonthActionPlan: MonthlyReportAction[];
};

type BuildMonthlyFinancialReportInput = {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  health: FinancialHealthResult;
  predictive: PredictiveFinanceResult;
  analytics: AnalyticsIntelligence;
  aiInsights: AIInsight[];
  currency: string;
  referenceDate?: Date;
};

const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, safe(value)));
const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

const toSeverity = (value: number): "low" | "medium" | "high" => {
  if (value >= 14) return "high";
  if (value >= 6) return "medium";
  return "low";
};

const getMonthTotals = (transactions: Transaction[], targetMonth: string) => {
  let income = 0;
  let expenses = 0;
  const categoryMap: Record<string, number> = {};
  for (const tx of transactions) {
    const date = new Date(tx.date);
    if (Number.isNaN(date.getTime()) || monthKey(date) !== targetMonth) continue;
    const amount = safe(Number(tx.amount));
    if (tx.type === "income") {
      income += amount;
    } else {
      expenses += amount;
      categoryMap[tx.category] = safe(categoryMap[tx.category]) + amount;
    }
  }
  return { income: safe(income), expenses: safe(expenses), categoryMap };
};

const isSubscriptionActiveInMonth = (subscription: Subscription, monthDate: Date) => {
  const startDate = subscription.start_date ? new Date(subscription.start_date) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) return true;
  const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  return startDate <= endOfMonth;
};

const monthlySubscriptionCostForMonth = (subscriptions: Subscription[], monthDate: Date) =>
  subscriptions
    .filter((sub) => isSubscriptionActiveInMonth(sub, monthDate))
    .reduce((sum, sub) => {
      const amount = safe(Number(sub.price));
      return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
    }, 0);

export const buildMonthlyFinancialReport = ({
  transactions,
  budgets,
  subscriptions,
  health,
  predictive,
  analytics,
  aiInsights,
  referenceDate,
}: BuildMonthlyFinancialReportInput): MonthlyReportResult => {
  const now = referenceDate ?? new Date();
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentKey = monthKey(now);
  const previousKey = monthKey(previousDate);
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const currentTotals = getMonthTotals(transactions, currentKey);
  const previousTotals = getMonthTotals(transactions, previousKey);
  const currentMonthlySubscriptionCost = safe(monthlySubscriptionCostForMonth(subscriptions, now));
  const previousMonthlySubscriptionCost = safe(monthlySubscriptionCostForMonth(subscriptions, previousDate));

  const currentExpensesTotal = safe(currentTotals.expenses + currentMonthlySubscriptionCost);
  const previousExpensesTotal = safe(previousTotals.expenses + previousMonthlySubscriptionCost);
  const currentNetSavings = safe(currentTotals.income - currentExpensesTotal);
  const previousNetSavings = safe(previousTotals.income - previousExpensesTotal);
  const currentSavingsRate = currentTotals.income > 0 ? (currentNetSavings / currentTotals.income) * 100 : 0;

  const incomeTrendPct =
    previousTotals.income > 0 ? ((currentTotals.income - previousTotals.income) / previousTotals.income) * 100 : 0;
  const expenseTrendPct =
    previousExpensesTotal > 0 ? ((currentExpensesTotal - previousExpensesTotal) / previousExpensesTotal) * 100 : 0;

  const topCategorySource = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Subscriptions",
    "Housing",
    "Entertainment",
  ];
  const currentCategoryMap: Record<string, number> = {
    ...currentTotals.categoryMap,
    Subscriptions:
      safe(currentTotals.categoryMap.Subscriptions) +
      currentMonthlySubscriptionCost,
  };
  const previousCategoryMap: Record<string, number> = {
    ...previousTotals.categoryMap,
    Subscriptions:
      safe(previousTotals.categoryMap.Subscriptions) +
      previousMonthlySubscriptionCost,
  };
  const totalCategoryExpenses = Object.values(currentCategoryMap).reduce((sum, value) => sum + safe(value), 0);

  const topCategories = topCategorySource
    .map((category) => {
      const total = safe(currentCategoryMap[category]);
      const previous = safe(previousCategoryMap[category]);
      const changePct = previous > 0 ? ((total - previous) / previous) * 100 : total > 0 ? 100 : 0;
      return {
        category,
        total,
        previousMonthTotal: previous,
        changePct,
        percentageOfExpenses: totalCategoryExpenses > 0 ? (total / totalCategoryExpenses) * 100 : 0,
        aiComment:
          changePct > 10
            ? `${category} is rising faster than your monthly baseline.`
            : changePct < -5
            ? `${category} pressure is improving versus last month.`
            : `${category} is relatively stable this month.`,
        suggestedAction:
          changePct > 12
            ? `Apply a weekly cap for ${category.toLowerCase()}.`
            : `Maintain current ${category.toLowerCase()} controls.`,
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const highestCostSubscription = subscriptions
    .slice()
    .sort((a, b) => {
      const aMonthly = a.billing_cycle === "yearly" ? safe(Number(a.price)) / 12 : safe(Number(a.price));
      const bMonthly = b.billing_cycle === "yearly" ? safe(Number(b.price)) / 12 : safe(Number(b.price));
      return bMonthly - aMonthly;
    })[0];

  const in10Days = new Date(now);
  in10Days.setDate(in10Days.getDate() + 10);
  const renewalRiskCount = subscriptions.filter((sub) => {
    if (!sub.next_payment_date) return false;
    const due = new Date(sub.next_payment_date);
    return !Number.isNaN(due.getTime()) && due >= now && due <= in10Days;
  }).length;

  const activeGoals = budgets.length;
  const currentGoalProgress = health.factors.find((factor) => factor.key === "goal_progress")?.scorePct ?? 0;
  const previousGoalProgress = clamp(currentGoalProgress - 5, 0, 100);
  const progressChangePct = currentGoalProgress - previousGoalProgress;
  const amountAddedThisMonth = Math.max(0, currentNetSavings * 0.4);
  const goalsAhead = predictive.goalForecast.delayed ? Math.max(0, activeGoals - 1) : activeGoals;
  const goalsDelayed = predictive.goalForecast.delayed ? Math.min(1, activeGoals) : 0;

  const topImprovingFactor = [...health.factors].sort((a, b) => b.trendVsPreviousPct - a.trendVsPreviousPct)[0];
  const topDegradingFactor = [...health.factors].sort((a, b) => a.trendVsPreviousPct - b.trendVsPreviousPct)[0];
  const largestSpendingIncrease = topCategories
    .slice()
    .sort((a, b) => b.changePct - a.changePct)[0];

  const hero = {
    income: currentTotals.income,
    expenses: currentExpensesTotal,
    netSavings: currentNetSavings,
    savingsRatePct: currentSavingsRate,
    healthScoreChange: health.monthlyScoreChange,
    biggestImprovement: topImprovingFactor?.label ?? "Savings Rate",
    biggestWarning: largestSpendingIncrease?.category ?? topDegradingFactor?.label ?? "Spending Control",
    aiSummary: `Ruby AI analyzed your month. You saved ${Math.max(0, currentSavingsRate).toFixed(
      1
    )}% of your income, improved ${topImprovingFactor?.label.toLowerCase() ?? "key stability factors"}, but ${
      largestSpendingIncrease?.category.toLowerCase() ?? "spending"
    } increased ${Math.max(0, largestSpendingIncrease?.changePct ?? 0).toFixed(1)}% compared to last month.`,
  };

  const history = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(date);
    const monthTotals = getMonthTotals(transactions, key);
    const subCost = monthlySubscriptionCostForMonth(subscriptions, date);
    const expenses = monthTotals.expenses + subCost;
    return {
      label: date.toLocaleString("en-US", { month: "short" }),
      income: monthTotals.income,
      expenses,
      savings: monthTotals.income - expenses,
    };
  });

  const monthlyInsights: MonthlyReportInsight[] = [
    {
      id: "insight-category-growth",
      title: `${largestSpendingIncrease?.category ?? "Food & Dining"} spending changed`,
      category: "Spending Warning",
      financialImpact: `${largestSpendingIncrease?.changePct.toFixed(1) ?? "0.0"}% vs last month`,
      severity: toSeverity(Math.abs(largestSpendingIncrease?.changePct ?? 0)),
      suggestedNextStep: largestSpendingIncrease
        ? `Set a weekly limit for ${largestSpendingIncrease.category.toLowerCase()} this month.`
        : "Set a guardrail for your highest discretionary category.",
    },
    {
      id: "insight-savings",
      title: currentNetSavings >= previousNetSavings ? "Savings improved vs last month" : "Savings fell vs last month",
      category: "Saving Opportunity",
      financialImpact: `${Math.abs(currentNetSavings - previousNetSavings).toFixed(0)} change in net savings`,
      severity: currentNetSavings >= previousNetSavings ? "low" : "medium",
      suggestedNextStep:
        currentNetSavings >= previousNetSavings
          ? "Keep your current savings cadence and add a small automation boost."
          : "Cut one variable category and re-route the difference into savings.",
    },
    {
      id: "insight-behavior",
      title: analytics.patternDetection[0] ?? "Behavior pattern detected",
      category: "Behavior Pattern",
      financialImpact: `${analytics.financialBehavior.weekendSpendingPct.toFixed(1)}% weekend spending share`,
      severity: analytics.financialBehavior.weekendSpendingPct > 35 ? "medium" : "low",
      suggestedNextStep: "Apply weekend-specific spend guardrails for 2 weeks.",
    },
    {
      id: "insight-emergency",
      title: "Emergency fund trajectory",
      category: "Financial Health Improvement",
      financialImpact: health.factors.find((factor) => factor.key === "emergency_fund")?.scoreContribution.toFixed(1) ?? "0.0",
      severity:
        (health.factors.find((factor) => factor.key === "emergency_fund")?.scorePct ?? 0) >= 60 ? "low" : "medium",
      suggestedNextStep: "Add one extra transfer to emergency reserves this cycle.",
    },
    {
      id: "insight-subscriptions",
      title: "Subscription costs are stable",
      category: "Subscription Optimization",
      financialImpact: `${currentMonthlySubscriptionCost.toFixed(0)} monthly recurring`,
      severity: currentMonthlySubscriptionCost <= previousMonthlySubscriptionCost ? "low" : "medium",
      suggestedNextStep: "Review at least one overlapping subscription plan.",
    },
  ];

  aiInsights.slice(0, 2).forEach((insight, index) => {
    monthlyInsights.push({
      id: `ai-${insight.id}-${index}`,
      title: insight.title,
      category: insight.label,
      financialImpact: insight.message,
      severity: insight.severity,
      suggestedNextStep: insight.suggestedAction,
    });
  });

  const nextMonthActionPlan: MonthlyReportAction[] = health.improvementPlan.slice(0, 5).map((action) => ({
    id: action.id,
    title: action.title,
    expectedImpact: `+${action.estimatedImpact} health score points expected`,
    difficulty: action.difficulty,
    timeline: action.timeToComplete,
    relatedCategory: action.category,
  }));

  return {
    monthLabel,
    hero,
    incomeVsExpenses: {
      currentIncome: currentTotals.income,
      currentExpenses: currentExpensesTotal,
      netCashFlow: currentNetSavings,
      previousIncome: previousTotals.income,
      previousExpenses: previousExpensesTotal,
      incomeTrendPct,
      expenseTrendPct,
      history,
    },
    savingsSummary: {
      totalSaved: currentNetSavings,
      savingsRatePct: currentSavingsRate,
      savedDelta: currentNetSavings - previousNetSavings,
      contributionToGoals: amountAddedThisMonth,
      projectedSavingsNextMonth: predictive.savingsTrajectory.projectedEomSavings,
    },
    financialHealthChange: {
      currentScore: health.score,
      previousScore: health.previousMonthScore,
      scoreChange: health.monthlyScoreChange,
      improvedFactors: health.factors.filter((factor) => factor.trendVsPreviousPct > 0).map((factor) => factor.label).slice(0, 3),
      decreasedFactors: health.factors.filter((factor) => factor.trendVsPreviousPct < 0).map((factor) => factor.label).slice(0, 3),
      aiExplanation:
        health.aiExplanations[0] ??
        `Your score changed by ${health.monthlyScoreChange.toFixed(1)} points because of movement in savings rate and spending control.`,
    },
    topCategories,
    subscriptionImpact: {
      monthlyCost: currentMonthlySubscriptionCost,
      yearlyProjectedCost: currentMonthlySubscriptionCost * 12,
      burdenPct: currentTotals.income > 0 ? (currentMonthlySubscriptionCost / currentTotals.income) * 100 : 0,
      highestCostSubscription: highestCostSubscription?.name ?? "No active subscription",
      possibleSavingsYearly: analytics.subscriptionAnalytics.optimizationPotential,
      renewalRiskCount,
    },
    goalProgressSummary: {
      activeGoals,
      amountAddedThisMonth,
      progressChangePct,
      predictedCompletion: predictive.goalForecast.completionLabel,
      goalsAhead,
      goalsDelayed,
      aiSavingTip:
        goalsDelayed > 0
          ? "Increase weekly goal contributions slightly to avoid timeline delays."
          : "Your goal pace is healthy. Keep contribution consistency this month.",
    },
    monthlyInsights: monthlyInsights.slice(0, 8),
    nextMonthActionPlan,
  };
};
