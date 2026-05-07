import type { Budget, Transaction } from "@/hooks/useFinance";
import type { Subscription } from "@/hooks/subscriptions/types";

export type PredictivePoint = {
  label: string;
  balance: number;
  spending: number;
  savings: number;
};

export type PredictiveInsight = {
  title: string;
  detail: string;
  tone: "info" | "warning" | "positive";
};

export type ForecastRiskLevel = "low" | "medium" | "high";

export type CategoryForecast = {
  category: string;
  projected: number;
  risk: ForecastRiskLevel;
};

export type SpendingProjection = {
  weeklyPrediction: number;
  behavioralPrediction: number;
  categoryForecasts: CategoryForecast[];
};

export type SafeToSpendForecast = {
  daily: number;
  remaining: number;
  adjustmentFactor: number;
};

export type BudgetRiskForecast = {
  scorePct: number;
  highRiskCategories: string[];
};

export type GoalForecast = {
  projectedCompletionDays: number;
  completionLabel: string;
  accelerationPct: number;
  delayed: boolean;
};

export type SubscriptionImpactForecast = {
  monthlyCost: number;
  nextQuarterCost: number;
  burdenTrendPct: number;
};

export type SavingsTrajectoryForecast = {
  trendPct: number;
  projectedEomSavings: number;
};

export type MonthlyProjectionForecast = {
  projectedIncome: number;
  projectedExpense: number;
  projectedEndBalance: number;
  negativeRiskPct: number;
};

export type PredictiveFinanceResult = {
  futureBalanceForecast: PredictivePoint[];
  spendingProjection: SpendingProjection;
  safeToSpend: SafeToSpendForecast;
  budgetRisk: BudgetRiskForecast;
  goalForecast: GoalForecast;
  subscriptionImpact: SubscriptionImpactForecast;
  savingsTrajectory: SavingsTrajectoryForecast;
  monthlyProjection: MonthlyProjectionForecast;
  insights: PredictiveInsight[];
};

type PredictiveInput = {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
};

const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, safe(value)));
const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

const average = (values: number[]) =>
  values.length ? values.reduce((acc, curr) => acc + safe(curr), 0) / values.length : 0;

const getCategoryRiskLevel = (growth: number, projected: number, current: number): ForecastRiskLevel => {
  if (growth > 0.2 || projected > current * 1.22) return "high";
  if (growth > 0.08) return "medium";
  return "low";
};

export const buildPredictiveFinanceEngine = ({
  transactions,
  budgets,
  subscriptions,
}: PredictiveInput): PredictiveFinanceResult => {
  const now = new Date();
  const currentMonth = monthKey(now);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsedDays = Math.max(1, now.getDate());
  const remainingDays = Math.max(1, daysInMonth - elapsedDays);

  const monthlyKeys = [5, 4, 3, 2, 1, 0].map((offset) =>
    monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1))
  );

  const incomeByMonth: Record<string, number> = {};
  const expenseByMonth: Record<string, number> = {};
  const categoryCurrent: Record<string, number> = {};
  const categoryPrevious: Record<string, number> = {};
  const dailySpendCurrent: Record<string, number> = {};
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  for (const tx of transactions) {
    const amount = safe(Number(tx.amount));
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime())) continue;
    const key = monthKey(txDate);
    if (!monthlyKeys.includes(key)) continue;

    if (tx.type === "income") {
      incomeByMonth[key] = safe(incomeByMonth[key]) + amount;
    } else {
      expenseByMonth[key] = safe(expenseByMonth[key]) + amount;

      if (key === currentMonth) {
        categoryCurrent[tx.category] = safe(categoryCurrent[tx.category]) + amount;
        const day = tx.date.slice(0, 10);
        dailySpendCurrent[day] = safe(dailySpendCurrent[day]) + amount;
      }
      if (key === previousMonth) {
        categoryPrevious[tx.category] = safe(categoryPrevious[tx.category]) + amount;
      }
    }
  }

  const monthlyIncomeSeries = monthlyKeys.map((key) => safe(incomeByMonth[key]));
  const monthlyExpenseSeries = monthlyKeys.map((key) => safe(expenseByMonth[key]));
  const monthlySavingsSeries = monthlyKeys.map(
    (key) => safe(incomeByMonth[key]) - safe(expenseByMonth[key])
  );

  const monthlySubscriptionCost = subscriptions.reduce((sum, sub) => {
    const amount = safe(Number(sub.price));
    return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);

  const incomeCurrent = monthlyIncomeSeries.at(-1) ?? 0;
  const expenseCurrentRaw = monthlyExpenseSeries.at(-1) ?? 0;
  const expenseCurrent = expenseCurrentRaw + monthlySubscriptionCost;
  const savingsCurrent = incomeCurrent - expenseCurrent;

  const dailyObservedSpendRate = expenseCurrentRaw / elapsedDays;
  const projectedRemainingSpend = dailyObservedSpendRate * remainingDays + monthlySubscriptionCost;
  const projectedEndBalance = incomeCurrent - (expenseCurrentRaw + projectedRemainingSpend);
  const projectedExpense = expenseCurrentRaw + projectedRemainingSpend;

  const rollingIncome = average(monthlyIncomeSeries.slice(-3));
  const rollingExpense = average(monthlyExpenseSeries.slice(-3));
  const balanceSlope =
    average(monthlySavingsSeries.slice(-3)) - average(monthlySavingsSeries.slice(-6, -3));

  const futureBalanceForecast: PredictivePoint[] = Array.from({ length: 4 }, (_, index) => {
    const m = index + 1;
    const projectedIncome = rollingIncome * (1 + m * 0.01);
    const projectedSpending = (rollingExpense + monthlySubscriptionCost) * (1 + m * 0.02);
    const projectedBalance = projectedIncome - projectedSpending + balanceSlope * 0.2 * m;
    return {
      label: `M+${m}`,
      balance: safe(projectedBalance),
      spending: safe(projectedSpending),
      savings: safe(projectedIncome - projectedSpending),
    };
  });

  const weeklyPrediction = dailyObservedSpendRate * 7;
  const volatility = dailySpendCurrent
    ? (() => {
        const values = Object.values(dailySpendCurrent);
        const mean = average(values);
        const variance = average(values.map((v) => Math.pow(v - mean, 2)));
        return Math.sqrt(variance);
      })()
    : 0;
  const behavioralPrediction = weeklyPrediction * (1 + clamp(volatility / Math.max(weeklyPrediction, 1), 0, 0.35));

  const categoryForecasts: CategoryForecast[] = Object.entries(categoryCurrent)
    .map(([category, value]) => {
      const prev = safe(categoryPrevious[category]);
      const growth = prev > 0 ? (value - prev) / prev : value > 0 ? 0.2 : 0;
      const projected = value * (1 + clamp(growth, -0.2, 0.45));
      const risk = getCategoryRiskLevel(growth, projected, value);
      return { category, projected: safe(projected), risk };
    })
    .sort((a, b) => b.projected - a.projected)
    .slice(0, 5);

  const totalBudget = budgets.reduce((sum, budget) => sum + safe(Number(budget.limit_amount)), 0);
  const budgetRiskScore =
    totalBudget > 0 ? clamp((projectedExpense / totalBudget) * 100, 0, 100) : clamp(projectedExpense / 30, 15, 95);
  const highRiskCategories = categoryForecasts
    .filter((item) => item.risk === "high")
    .map((item) => item.category);

  const remainingSafeBudget = Math.max(0, incomeCurrent - projectedExpense);
  const adjustmentFactor =
    dailyObservedSpendRate > 0 ? clamp((remainingSafeBudget / Math.max(remainingDays, 1)) / dailyObservedSpendRate, 0.4, 1.25) : 1;
  const safeDaily = remainingSafeBudget / remainingDays;

  const goalTarget = totalBudget > 0 ? totalBudget : Math.max(rollingIncome * 0.35, 500);
  const monthlySavingsAcceleration = (futureBalanceForecast[0]?.savings ?? savingsCurrent) - savingsCurrent;
  const projectedCompletionDays =
    savingsCurrent > 0
      ? Math.max(10, Math.ceil(((goalTarget - Math.max(savingsCurrent, 0)) / Math.max(savingsCurrent, 1)) * 30))
      : 120;
  const delayed = projectedCompletionDays > 90;
  const completionLabel = delayed ? "Delayed trajectory" : projectedCompletionDays < 35 ? "Early completion likely" : "On track";

  const savingsTrendPct = monthlySavingsSeries.at(-2)
    ? ((savingsCurrent - (monthlySavingsSeries.at(-2) ?? 0)) / Math.max(Math.abs(monthlySavingsSeries.at(-2) ?? 0), 1)) * 100
    : 0;

  const negativeRiskPct =
    projectedEndBalance < 0
      ? clamp(60 + Math.abs(projectedEndBalance) / Math.max(incomeCurrent, 1) * 80, 35, 98)
      : clamp(25 - projectedEndBalance / Math.max(incomeCurrent, 1) * 20, 3, 22);

  const insights: PredictiveInsight[] = [
    {
      title: "Future Balance Forecast",
      detail:
        projectedEndBalance < 0
          ? "At this pace, your balance may decrease significantly before month end."
          : "Projected end-of-month balance remains stable with current behavior.",
      tone: projectedEndBalance < 0 ? "warning" : "positive",
    },
    {
      title: "Safe-to-Spend Signal",
      detail: `You can safely spend about ${safeDaily.toFixed(0)} per day for the rest of this month.`,
      tone: safeDaily > 0 ? "info" : "warning",
    },
    {
      title: "Savings Trajectory",
      detail:
        savingsTrendPct >= 0
          ? "Your savings trend is improving."
          : "Savings trajectory is weakening and may require correction.",
      tone: savingsTrendPct >= 0 ? "positive" : "warning",
    },
    {
      title: "Category Risk",
      detail:
        highRiskCategories.length > 0
          ? `${highRiskCategories[0]} spending may exceed your budget this month.`
          : "No severe category overspend is projected currently.",
      tone: highRiskCategories.length > 0 ? "warning" : "info",
    },
    {
      title: "Goal Forecast",
      detail:
        delayed
          ? "This goal may complete later than expected unless savings pace increases."
          : "This goal may complete earlier than expected if momentum holds.",
      tone: delayed ? "warning" : "positive",
    },
  ];

  return {
    futureBalanceForecast,
    spendingProjection: {
      weeklyPrediction: safe(weeklyPrediction),
      behavioralPrediction: safe(behavioralPrediction),
      categoryForecasts,
    },
    safeToSpend: {
      daily: safe(safeDaily),
      remaining: safe(remainingSafeBudget),
      adjustmentFactor: safe(adjustmentFactor),
    },
    budgetRisk: {
      scorePct: safe(budgetRiskScore),
      highRiskCategories,
    },
    goalForecast: {
      projectedCompletionDays,
      completionLabel,
      accelerationPct: safe((monthlySavingsAcceleration / Math.max(Math.abs(savingsCurrent), 1)) * 100),
      delayed,
    },
    subscriptionImpact: {
      monthlyCost: safe(monthlySubscriptionCost),
      nextQuarterCost: safe(monthlySubscriptionCost * 3),
      burdenTrendPct: safe(incomeCurrent > 0 ? (monthlySubscriptionCost / incomeCurrent) * 100 : 0),
    },
    savingsTrajectory: {
      trendPct: safe(savingsTrendPct),
      projectedEomSavings: safe(projectedEndBalance),
    },
    monthlyProjection: {
      projectedIncome: safe(incomeCurrent),
      projectedExpense: safe(projectedExpense),
      projectedEndBalance: safe(projectedEndBalance),
      negativeRiskPct: safe(negativeRiskPct),
    },
    insights,
  };
};
